import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Film, LogOut, Loader2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Eyebrow,
  Field,
  GhostButton,
  Panel,
  PrimaryButton,
  StatCard,
  StatusPill,
  inputClass,
} from "@/components/studio/primitives";
import { fetchSession, signOut } from "@/lib/api/auth.functions";
import {
  addProject,
  fetchCredits,
  fetchJobs,
  fetchProjects,
  removeProject,
  stopJob,
} from "@/lib/api/studio.functions";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Your studio — AI Movie Studio" },
      {
        name: "description",
        content: "Manage your film projects, render jobs and production credits.",
      },
      { property: "og:title", content: "Your studio — AI Movie Studio" },
      { property: "og:description", content: "Projects, render jobs and credits in one place." },
    ],
  }),
  beforeLoad: async () => {
    const session = await fetchSession();
    if (!session) throw redirect({ to: "/auth", search: { mode: "signin" } });
    return { session };
  },
  loader: ({ context }) => ({ session: context.session }),
  component: StudioPage,
});

function StudioPage() {
  const { session } = Route.useLoaderData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loadProjects = useServerFn(fetchProjects);
  const loadJobs = useServerFn(fetchJobs);
  const loadCredits = useServerFn(fetchCredits);
  const createProject = useServerFn(addProject);
  const deleteProject = useServerFn(removeProject);
  const cancelJob = useServerFn(stopJob);
  const doSignOut = useServerFn(signOut);

  const projects = useQuery({ queryKey: ["projects"], queryFn: () => loadProjects() });
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: () => loadJobs() });
  const credits = useQuery({ queryKey: ["credits"], queryFn: () => loadCredits() });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [genre, setGenre] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["credits"] });
  };

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    toast.error(message.replace(/^Error:\s*/, ""));
  };

  const create = useMutation({
    mutationFn: () => createProject({ data: { title, logline, genre } }),
    onSuccess: () => {
      toast.success("Project created");
      setTitle("");
      setLogline("");
      setGenre("");
      setShowForm(false);
      invalidate();
    },
    onError: handleError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProject({ data: { id } }),
    onSuccess: () => {
      toast.success("Project deleted");
      invalidate();
    },
    onError: handleError,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelJob({ data: { id } }),
    onSuccess: () => {
      toast.success("Job cancelled");
      invalidate();
    },
    onError: handleError,
  });

  const logout = useMutation({
    mutationFn: () => doSignOut(),
    onSuccess: () => {
      queryClient.clear();
      void navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
    },
    onError: handleError,
  });

  const creditData = credits.data ?? session.credits;
  const isAdmin = session.user.roles.includes("ADMIN");

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-aura pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />

      <header className="relative z-10 border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Film className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">AI Movie Studio</p>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
              >
                <ShieldCheck className="size-4" /> Admin
              </Link>
            ) : null}
            <GhostButton onClick={() => logout.mutate()} disabled={logout.isPending}>
              <LogOut className="size-4" /> Sign out
            </GhostButton>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-6 py-10">
        <section>
          <Eyebrow>Production desk</Eyebrow>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Good to see you, {session.user.displayName.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your foundation is live: projects, render jobs and credits. Movie generation tools
            arrive in the next phase.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Credits available" value={creditData.available} hint="Ready to spend" />
          <StatCard label="On hold" value={creditData.reserved} hint="Reserved by active jobs" />
          <StatCard label="Projects" value={projects.data?.length ?? 0} />
          <StatCard label="Render jobs" value={jobs.data?.length ?? 0} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Projects</h2>
            <PrimaryButton onClick={() => setShowForm((value) => !value)}>
              {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
              {showForm ? "Close" : "New project"}
            </PrimaryButton>
          </div>

          {showForm ? (
            <Panel className="p-6">
              <form
                className="grid gap-4 md:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  create.mutate();
                }}
              >
                <Field label="Title">
                  <input
                    className={inputClass}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="The Last Transmission"
                  />
                </Field>
                <Field label="Genre">
                  <input
                    className={inputClass}
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Sci-fi thriller"
                  />
                </Field>
                <Field label="Logline">
                  <input
                    className={inputClass}
                    value={logline}
                    onChange={(e) => setLogline(e.target.value)}
                    placeholder="A lone engineer hears her own voice from deep space."
                  />
                </Field>
                <div className="md:col-span-3">
                  <PrimaryButton type="submit" disabled={create.isPending}>
                    {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Create project
                  </PrimaryButton>
                </div>
              </form>
            </Panel>
          ) : null}

          {projects.isLoading ? (
            <Panel className="p-10 text-center text-sm text-muted-foreground">
              Loading projects…
            </Panel>
          ) : (projects.data?.length ?? 0) === 0 ? (
            <Panel className="p-12 text-center">
              <p className="font-display text-lg font-semibold">No projects yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start building a film.
              </p>
            </Panel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.data?.map((project) => (
                <Panel key={project.id} className="flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold">{project.title}</h3>
                    <StatusPill status={project.status} />
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {project.logline ?? "No logline yet."}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {project.genre ?? "Unclassified"}
                    </span>
                    <GhostButton
                      onClick={() => remove.mutate(project.id)}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-4" /> Delete
                    </GhostButton>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Render jobs</h2>
          {(jobs.data?.length ?? 0) === 0 ? (
            <Panel className="p-12 text-center">
              <p className="font-display text-lg font-semibold">No jobs yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Generation jobs will appear here with live status, retries and credit holds.
              </p>
            </Panel>
          ) : (
            <Panel className="divide-y divide-border">
              {jobs.data?.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{job.job_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Attempt {job.attempt_count}/{job.max_attempts} · {job.reserved_credits}{" "}
                      credits held
                      {job.error_message ? ` · ${job.error_message}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={job.status} />
                    {job.status === "QUEUED" ||
                    job.status === "PROCESSING" ||
                    job.status === "RETRYING" ? (
                      <GhostButton onClick={() => cancel.mutate(job.id)}>Cancel</GhostButton>
                    ) : null}
                  </div>
                </div>
              ))}
            </Panel>
          )}
        </section>
      </main>
    </div>
  );
}
