import { getDb } from "@/lib/db/client.server";
import { logger, redact } from "@/lib/observability/logger";

const log = logger.child({ module: "audit" });

export async function recordAudit(entry: {
  actorUserId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: "SUCCESS" | "FAILURE";
  context?: Record<string, unknown>;
}): Promise<void> {
  const row = {
    actor_user_id: entry.actorUserId ?? null,
    action: entry.action,
    resource_type: entry.resourceType ?? null,
    resource_id: entry.resourceId ?? null,
    outcome: entry.outcome ?? "SUCCESS",
    context: (redact(entry.context ?? {}) ?? {}) as Record<string, unknown>,
  };
  const { error } = await getDb().from("audit_logs").insert(row);
  if (error) log.warn("audit write failed", { action: entry.action, error: error.message });
}
