/**
 * Generic job service. Every generation task in the studio becomes a job row,
 * so status, retries, provider metadata and credit holds are handled in one
 * place regardless of which provider does the work.
 */
import { assertOwnership, forbidden, type AuthenticatedUser } from "@/lib/auth/authorize";
import { recordAudit } from "@/lib/audit/audit.server";
import { estimateJobCost } from "@/lib/credits/credit-math";
import { consumeCredits, releaseCredits, reserveCredits } from "@/lib/credits/credits.server";
import { getDb } from "@/lib/db/client.server";
import { assertTransition, decideRetry, type JobStatus } from "@/lib/jobs/job-state";
import { logger } from "@/lib/observability/logger";
import type { ProviderKind } from "@/lib/providers/types";

const log = logger.child({ module: "jobs" });

export type JobRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  job_type: string;
  status: JobStatus;
  attempt_count: number;
  max_attempts: number;
  error_code: string | null;
  error_message: string | null;
  provider_kind: ProviderKind | null;
  provider_name: string | null;
  provider_metadata: Record<string, any>;
  reserved_credits: number;
  idempotency_key: string | null;
  input: Record<string, any>;
  output: Record<string, any> | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

const JOB_COLUMNS =
  "id, user_id, project_id, job_type, status, attempt_count, max_attempts, error_code, error_message, provider_kind, provider_name, provider_metadata, reserved_credits, idempotency_key, input, output, started_at, finished_at, created_at, updated_at";

export async function createJob(
  user: AuthenticatedUser,
  input: {
    jobType: string;
    projectId?: string | undefined;
    payload?: Record<string, unknown> | undefined;
    providerKind?: ProviderKind | undefined;
    providerName?: string | undefined;
    idempotencyKey?: string | undefined;
    units?: number | undefined;
  },
): Promise<JobRow> {
  const db = getDb();

  // Idempotency: the same key from the same user always returns the first job.
  if (input.idempotencyKey) {
    const { data: existing } = await db
      .from("jobs")
      .select(JOB_COLUMNS)
      .eq("user_id", user.id)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle<JobRow>();
    if (existing) return existing;
  }

  if (input.projectId) {
    const { data: project } = await db
      .from("projects")
      .select("id, user_id")
      .eq("id", input.projectId)
      .maybeSingle<{ id: string; user_id: string }>();
    assertOwnership(project, user);
  }

  const cost = estimateJobCost(input.jobType, input.units ?? 1);
  const { data, error } = await db
    .from("jobs")
    .insert({
      user_id: user.id,
      project_id: input.projectId ?? null,
      job_type: input.jobType,
      input: input.payload ?? {},
      provider_kind: input.providerKind ?? null,
      provider_name: input.providerName ?? null,
      reserved_credits: cost,
      idempotency_key: input.idempotencyKey ?? null,
    })
    .select(JOB_COLUMNS)
    .single<JobRow>();
  if (error || !data) throw new Error(`Could not queue job: ${error?.message ?? "unknown"}`);

  try {
    await reserveCredits(user.id, cost, `job-reserve:${data.id}`, data.id);
  } catch (creditError) {
    await db
      .from("jobs")
      .update({
        status: "FAILED",
        error_code: "INSUFFICIENT_CREDITS",
        error_message: "Not enough credits to start this job.",
        finished_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    throw creditError;
  }

  await recordAudit({
    actorUserId: user.id,
    action: "job.create",
    resourceType: "jobs",
    resourceId: data.id,
    context: { jobType: input.jobType },
  });
  log.info("job queued", { jobId: data.id, userId: user.id, jobType: input.jobType });
  return data;
}

async function loadOwnedJob(jobId: string, user: AuthenticatedUser): Promise<JobRow> {
  const { data } = await getDb()
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle<JobRow>();
  return assertOwnership(data, user);
}

export async function getJob(jobId: string, user: AuthenticatedUser): Promise<JobRow> {
  return loadOwnedJob(jobId, user);
}

export async function listJobs(user: AuthenticatedUser, limit = 25): Promise<JobRow[]> {
  const { data, error } = await getDb()
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load jobs: ${error.message}`);
  return (data ?? []) as JobRow[];
}

async function applyStatus(job: JobRow, to: JobStatus, patch: Record<string, unknown> = {}) {
  assertTransition(job.status, to);
  const { data, error } = await getDb()
    .from("jobs")
    .update({ status: to, ...patch })
    .eq("id", job.id)
    .eq("status", job.status)
    .select(JOB_COLUMNS)
    .single<JobRow>();
  if (error || !data) throw new Error(`Could not update job: ${error?.message ?? "conflict"}`);
  log.info("job status changed", { jobId: job.id, from: job.status, to });
  return data;
}

export async function markProcessing(jobId: string, user: AuthenticatedUser): Promise<JobRow> {
  const job = await loadOwnedJob(jobId, user);
  return applyStatus(job, "PROCESSING", {
    attempt_count: job.attempt_count + 1,
    started_at: job.started_at ?? new Date().toISOString(),
  });
}

export async function completeJob(
  jobId: string,
  user: AuthenticatedUser,
  output: Record<string, unknown>,
): Promise<JobRow> {
  const job = await loadOwnedJob(jobId, user);
  const updated = await applyStatus(job, "COMPLETED", {
    output,
    finished_at: new Date().toISOString(),
  });
  await consumeCredits(user.id, job.reserved_credits, job.id);
  return updated;
}

export async function failJob(
  jobId: string,
  user: AuthenticatedUser,
  failure: { code: string; message: string },
): Promise<JobRow> {
  const job = await loadOwnedJob(jobId, user);
  const decision = decideRetry(job.attempt_count, job.max_attempts);
  if (decision.retry) {
    return applyStatus(job, "RETRYING", {
      error_code: failure.code,
      error_message: failure.message.slice(0, 1000),
    });
  }
  const updated = await applyStatus(job, "FAILED", {
    error_code: failure.code,
    error_message: failure.message.slice(0, 1000),
    finished_at: new Date().toISOString(),
  });
  await releaseCredits(user.id, job.reserved_credits, job.id);
  return updated;
}

export async function cancelJob(jobId: string, user: AuthenticatedUser): Promise<JobRow> {
  const job = await loadOwnedJob(jobId, user);
  if (job.status === "COMPLETED") throw forbidden("A finished job cannot be cancelled.");
  const updated = await applyStatus(job, "CANCELLED", { finished_at: new Date().toISOString() });
  await releaseCredits(user.id, job.reserved_credits, job.id);
  await recordAudit({
    actorUserId: user.id,
    action: "job.cancel",
    resourceType: "jobs",
    resourceId: job.id,
  });
  return updated;
}
