import { assertOwnership, type AuthenticatedUser } from "@/lib/auth/authorize";
import { recordAudit } from "@/lib/audit/audit.server";
import { getDb } from "@/lib/db/client.server";

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  logline: string | null;
  genre: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, user_id, title, logline, genre, status, created_at, updated_at";

export async function listProjects(user: AuthenticatedUser): Promise<ProjectRow[]> {
  const { data, error } = await getDb()
    .from("projects")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return (data ?? []) as ProjectRow[];
}

export async function getProject(id: string, user: AuthenticatedUser): Promise<ProjectRow> {
  const { data } = await getDb().from("projects").select(COLUMNS).eq("id", id).maybeSingle<ProjectRow>();
  return assertOwnership(data, user);
}

export async function createProject(
  user: AuthenticatedUser,
  input: { title: string; logline?: string; genre?: string },
): Promise<ProjectRow> {
  const { data, error } = await getDb()
    .from("projects")
    .insert({
      user_id: user.id,
      title: input.title.trim().slice(0, 200) || "Untitled film",
      logline: input.logline?.trim() ?? null,
      genre: input.genre?.trim() ?? null,
    })
    .select(COLUMNS)
    .single<ProjectRow>();
  if (error || !data) throw new Error(`Could not create project: ${error?.message ?? "unknown"}`);
  await recordAudit({
    actorUserId: user.id,
    action: "project.create",
    resourceType: "projects",
    resourceId: data.id,
  });
  return data;
}

export async function deleteProject(id: string, user: AuthenticatedUser): Promise<void> {
  await getProject(id, user);
  const { error } = await getDb().from("projects").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(`Could not delete project: ${error.message}`);
  await recordAudit({
    actorUserId: user.id,
    action: "project.delete",
    resourceType: "projects",
    resourceId: id,
  });
}
