/**
 * Job state machine — pure logic, shared by the job service and the tests.
 */

export const JOB_STATUSES = [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "RETRYING",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

const TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  QUEUED: ["PROCESSING", "CANCELLED", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED", "CANCELLED", "RETRYING"],
  RETRYING: ["PROCESSING", "CANCELLED", "FAILED"],
  COMPLETED: [],
  FAILED: ["RETRYING"],
  CANCELLED: [],
};

export const TERMINAL_STATUSES: readonly JobStatus[] = ["COMPLETED", "CANCELLED"];

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status) || status === "FAILED";
}

export class JobTransitionError extends Error {
  constructor(from: JobStatus, to: JobStatus) {
    super(`Illegal job transition: ${from} -> ${to}`);
    this.name = "JobTransitionError";
  }
}

export function assertTransition(from: JobStatus, to: JobStatus): JobStatus {
  if (!canTransition(from, to)) throw new JobTransitionError(from, to);
  return to;
}

export type RetryDecision = { retry: true; delayMs: number } | { retry: false };

export function decideRetry(attemptCount: number, maxAttempts: number): RetryDecision {
  if (attemptCount >= maxAttempts) return { retry: false };
  const delayMs = Math.min(60_000, 1_000 * 2 ** (attemptCount - 1 < 0 ? 0 : attemptCount - 1));
  return { retry: true, delayMs };
}
