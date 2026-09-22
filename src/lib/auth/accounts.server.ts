/**
 * Account registration and sign-in for the app's own authentication system.
 */
import { AuthError } from "@/lib/auth/authorize";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { isValidEmail, normalizeEmail } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db/client.server";
import { recordAudit } from "@/lib/audit/audit.server";
import { ensureCreditAccount, grantCredits } from "@/lib/credits/credits.server";
import { logger } from "@/lib/observability/logger";

const log = logger.child({ module: "auth.accounts" });

const SIGNUP_BONUS_CREDITS = 250;

export type AccountRow = {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  status: "ACTIVE" | "SUSPENDED";
};

const invalidCredentials = () =>
  new AuthError("INVALID_CREDENTIALS", "That email or password is incorrect.", 401);

export async function registerAccount(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ userId: string }> {
  const email = input.email.trim();
  if (!isValidEmail(email)) {
    throw new AuthError("INVALID_EMAIL", "Enter a valid email address.", 400);
  }
  const strength = validatePasswordStrength(input.password);
  if (!strength.valid) {
    throw new AuthError("WEAK_PASSWORD", strength.reason, 400);
  }
  const displayName = input.displayName.trim() || email.split("@")[0] || "Filmmaker";

  const db = getDb();
  const emailNormalized = normalizeEmail(email);
  const { data: existing } = await db
    .from("app_users")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();
  if (existing) {
    throw new AuthError("EMAIL_TAKEN", "An account with that email already exists.", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const { data, error } = await db
    .from("app_users")
    .insert({
      email,
      email_normalized: emailNormalized,
      display_name: displayName,
      password_hash: passwordHash,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) throw new Error(`Could not create account: ${error?.message ?? "unknown"}`);

  await db.from("user_roles").insert({ user_id: data.id, role: "USER" });
  await db.from("subscriptions").insert({ user_id: data.id, plan: "FREE", monthly_credits: 250 });
  await ensureCreditAccount(data.id);
  await grantCredits(data.id, SIGNUP_BONUS_CREDITS, `signup:${data.id}`, "Welcome credits");
  await recordAudit({ actorUserId: data.id, action: "auth.register", resourceType: "app_users", resourceId: data.id });

  log.info("account registered", { userId: data.id });
  return { userId: data.id };
}

export async function authenticate(input: {
  email: string;
  password: string;
}): Promise<{ userId: string }> {
  const db = getDb();
  const { data } = await db
    .from("app_users")
    .select("id, email, display_name, password_hash, status")
    .eq("email_normalized", normalizeEmail(input.email))
    .maybeSingle<AccountRow>();

  if (!data) {
    // Spend comparable time so a missing account is not distinguishable.
    await verifyPassword(input.password, "pbkdf2$sha256$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
    throw invalidCredentials();
  }
  const ok = await verifyPassword(input.password, data.password_hash);
  if (!ok) {
    await recordAudit({
      actorUserId: data.id,
      action: "auth.login",
      outcome: "FAILURE",
      resourceType: "app_users",
      resourceId: data.id,
    });
    throw invalidCredentials();
  }
  if (data.status !== "ACTIVE") {
    throw new AuthError("ACCOUNT_SUSPENDED", "This account is suspended.", 403);
  }

  await db.from("app_users").update({ last_login_at: new Date().toISOString() }).eq("id", data.id);
  await recordAudit({
    actorUserId: data.id,
    action: "auth.login",
    resourceType: "app_users",
    resourceId: data.id,
  });
  log.info("account authenticated", { userId: data.id });
  return { userId: data.id };
}
