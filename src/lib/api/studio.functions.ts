import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { currentUserOrThrow } from "@/lib/api/auth.functions";
import { getCreditSummary } from "@/lib/credits/credits.server";
import { cancelJob, createJob, getJob, listJobs } from "@/lib/jobs/job-service.server";
import {
  createProject,
  deleteProject,
  listProjects,
} from "@/lib/projects/projects.server";

export const fetchProjects = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUserOrThrow();
  return listProjects(user);
});

export const addProject = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        logline: z.string().max(600).optional(),
        genre: z.string().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUserOrThrow();
    return createProject(user, data);
  });

export const removeProject = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUserOrThrow();
    await deleteProject(data.id, user);
    return { ok: true as const };
  });

export const fetchJobs = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUserOrThrow();
  return listJobs(user);
});

export const queueJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        jobType: z.string().min(1).max(80),
        projectId: z.string().uuid().optional(),
        idempotencyKey: z.string().max(200).optional(),
        payload: z.record(z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUserOrThrow();
    return createJob(user, data);
  });

export const stopJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUserOrThrow();
    return cancelJob(data.id, user);
  });

export const fetchJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUserOrThrow();
    return getJob(data.id, user);
  });

export const fetchCredits = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUserOrThrow();
  return getCreditSummary(user.id);
});
