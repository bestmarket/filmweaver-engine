/**
 * Session lifecycle for the app's own authentication.
 */
import { getCookie, setCookie } from "@tanstack/react-start/server";

import { getAppConfig } from "@/lib/config/env.server";
import { getDb } from "@/lib/db/client.server";
import { logger } from "@/lib/observability/logger";
import type { AppRole, AuthenticatedUser } from "@/lib/auth/authorize";
import { createSessionToken, hashToken, isSessionActive, sessionExpiry } from "@/lib/auth/tokens";

const log = logger.child({ module: "auth.session" });

export async function issueSession(userId: string, userAgent?: string): Promise<void> {
  const { sessionTtlDays, sessionCookieName, isProduction } = getAppConfig();
  const token = createSessionToken();
  const tokenHash = await hashToken(token);
  const expiresAt = sessionExpiry(sessionTtlDays);

  const { error } = await getDb()
    .from("sessions")
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      user_agent: userAgent?.slice(0, 300) ?? null,
      expires_at: expiresAt.toISOString(),
    });
  if (error) throw new Error(`Could not start session: ${error.message}`);

  setCookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    expires: expiresAt,
  });
  log.info("session issued", { userId });
}

export async function revokeCurrentSession(): Promise<void> {
  const { sessionCookieName, isProduction } = getAppConfig();
  const token = getCookie(sessionCookieName);
  if (token) {
    const tokenHash = await hashToken(token);
    await getDb()
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", tokenHash);
  }
  setCookie(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 0,
  });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await getDb()
    .from("sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
}

type SessionRow = {
  expires_at: string;
  revoked_at: string | null;
  app_users: {
    id: string;
    email: string;
    display_name: string;
    status: "ACTIVE" | "SUSPENDED";
  } | null;
};

/** Resolves the signed-in user from the HttpOnly cookie, or null. */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const { sessionCookieName } = getAppConfig();
  const token = getCookie(sessionCookieName);
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const db = getDb();
  const { data, error } = await db
    .from("sessions")
    .select("expires_at, revoked_at, app_users ( id, email, display_name, status )")
    .eq("token_hash", tokenHash)
    .maybeSingle<SessionRow>();

  if (error || !data?.app_users || !isSessionActive(data)) return null;

  const { data: roleRows } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", data.app_users.id);

  return {
    id: data.app_users.id,
    email: data.app_users.email,
    displayName: data.app_users.display_name,
    status: data.app_users.status,
    roles: ((roleRows ?? []) as { role: AppRole }[]).map((row) => row.role),
  };
}
