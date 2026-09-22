import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { authenticate, registerAccount } from "@/lib/auth/accounts.server";
import { AuthError, requireUser, type AuthenticatedUser } from "@/lib/auth/authorize";
import { getCurrentUser, issueSession, revokeCurrentSession } from "@/lib/auth/session.server";
import { recordAudit } from "@/lib/audit/audit.server";
import { getCreditSummary } from "@/lib/credits/credits.server";

const credentials = z.object({
  email: z.string().min(3).max(320),
  password: z.string().min(1).max(200),
});

const registration = credentials.extend({ displayName: z.string().max(120).optional() });

export type SessionPayload = {
  user: AuthenticatedUser;
  credits: { balance: number; reserved: number; available: number };
};

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registration.parse(input))
  .handler(async ({ data }) => {
    const { userId } = await registerAccount({
      email: data.email,
      password: data.password,
      displayName: data.displayName ?? "",
    });
    await issueSession(userId, getRequestHeader("user-agent"));
    return { ok: true as const };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentials.parse(input))
  .handler(async ({ data }) => {
    const { userId } = await authenticate(data);
    await issueSession(userId, getRequestHeader("user-agent"));
    return { ok: true as const };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const user = await getCurrentUser();
  await revokeCurrentSession();
  if (user) {
    await recordAudit({ actorUserId: user.id, action: "auth.logout" });
  }
  return { ok: true as const };
});

/** Public: returns null when nobody is signed in. */
export const fetchSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionPayload | null> => {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") return null;
    const credits = await getCreditSummary(user.id);
    return {
      user,
      credits: { balance: credits.balance, reserved: credits.reserved, available: credits.available },
    };
  },
);

/** Shared guard for authenticated server functions. */
export async function currentUserOrThrow(): Promise<AuthenticatedUser> {
  return requireUser(await getCurrentUser());
}

export { AuthError };
