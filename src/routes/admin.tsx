import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Eyebrow, Panel, StatCard, StatusPill } from "@/components/studio/primitives";
import { fetchAdminOverview } from "@/lib/api/admin.functions";
import { fetchSession } from "@/lib/api/auth.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — AI Movie Studio" },
      {
        name: "description",
        content: "Operational overview of studio accounts, render jobs and provider health.",
      },
      { property: "og:title", content: "Administration — AI Movie Studio" },
      { property: "og:description", content: "Studio operations and provider health." },
    ],
  }),
  beforeLoad: async () => {
    const session = await fetchSession();
    if (!session) throw redirect({ to: "/auth", search: { mode: "signin" } });
    if (!session.user.roles.includes("ADMIN")) throw redirect({ to: "/studio" });
  },
  component: AdminPage,
});

function AdminPage() {
  const loadOverview = useServerFn(fetchAdminOverview);
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => loadOverview() });

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-aura pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden />
      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>Operations</Eyebrow>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold">
              <ShieldCheck className="size-7 text-primary" /> Administration
            </h1>
          </div>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            <ArrowLeft className="size-4" /> Studio
          </Link>
        </div>

        {overview.isLoading ? (
          <Panel className="p-10 text-center text-sm text-muted-foreground">Loading…</Panel>
        ) : overview.data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Accounts" value={overview.data.counts.users} />
              <StatCard label="Projects" value={overview.data.counts.projects} />
              <StatCard label="Jobs" value={overview.data.counts.jobs} />
              <StatCard label="Failed jobs" value={overview.data.counts.failedJobs} />
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Providers</h2>
              <Panel className="divide-y divide-border">
                {overview.data.providers.map((provider) => (
                  <div
                    key={`${provider.kind}-${provider.name}`}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <p className="font-medium">
                        {provider.kind} · {provider.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {provider.isDefault ? "Default provider" : "Alternate provider"}
                      </p>
                    </div>
                    <StatusPill status={provider.configured ? "COMPLETED" : "QUEUED"} />
                  </div>
                ))}
              </Panel>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Recent activity</h2>
              <Panel className="divide-y divide-border">
                {overview.data.recentAudit.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  overview.data.recentAudit.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <StatusPill status={entry.outcome === "SUCCESS" ? "COMPLETED" : "FAILED"} />
                    </div>
                  ))
                )}
              </Panel>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
