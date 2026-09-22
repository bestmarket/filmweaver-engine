/**
 * Administration endpoints. Every handler re-checks the ADMIN role
 * server-side — the route guard is UI only and is never trusted.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "@/lib/auth/authorize";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getDb } from "@/lib/db/client.server";
import { describeProviders } from "@/lib/providers/registry.server";

async function adminOrThrow() {
  return requireAdmin(await getCurrentUser());
}

export const fetchAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await adminOrThrow();
  const db = getDb();
  const [users, projects, jobs, failedJobs] = await Promise.all([
    db.from("app_users").select("id", { count: "exact", head: true }),
    db.from("projects").select("id", { count: "exact", head: true }),
    db.from("jobs").select("id", { count: "exact", head: true }),
    db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "FAILED"),
  ]);

  const { data: recentAudit } = await db
    .from("audit_logs")
    .select("id, action, outcome, resource_type, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    counts: {
      users: users.count ?? 0,
      projects: projects.count ?? 0,
      jobs: jobs.count ?? 0,
      failedJobs: failedJobs.count ?? 0,
    },
    providers: describeProviders(),
    recentAudit: recentAudit ?? [],
  };
});

export const fetchProviderConfigurations = createServerFn({ method: "GET" }).handler(async () => {
  await adminOrThrow();
  const { data, error } = await getDb()
    .from("provider_configurations")
    .select("id, kind, provider_name, model, is_default, enabled, credential_env_var")
    .order("kind");
  if (error) throw new Error(`Could not load providers: ${error.message}`);
  return data ?? [];
});
