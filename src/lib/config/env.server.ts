/**
 * Server-side environment configuration.
 *
 * Secrets are read lazily inside request handlers (never at module scope) so
 * the Worker runtime can inject them per request. Nothing in this file is ever
 * imported by client code — it lives behind `createServerFn` handlers.
 *
 * See docs/ENVIRONMENT.md for the full list of variables.
 */

export type EnvKey =
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SUPABASE_PUBLISHABLE_KEY"
  | "AUTH_SESSION_SECRET"
  | "LOVABLE_API_KEY"
  | "GEMINI_API_KEY"
  | "ELEVENLABS_API_KEY"
  | "STABILITY_API_KEY";

function raw(key: EnvKey): string | undefined {
  const value = process.env[key];
  return value === undefined || value === "" ? undefined : value;
}

export function optionalEnv(key: EnvKey): string | undefined {
  return raw(key);
}

export function requireEnv(key: EnvKey): string {
  const value = raw(key);
  if (!value) {
    // The key name is safe to surface; the value never is.
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function hasEnv(key: EnvKey): boolean {
  return raw(key) !== undefined;
}

export type AppConfig = {
  sessionTtlDays: number;
  sessionCookieName: string;
  isProduction: boolean;
};

export function getAppConfig(): AppConfig {
  return {
    sessionTtlDays: 30,
    sessionCookieName: "ams_session",
    isProduction: process.env["NODE_ENV"] === "production",
  };
}
