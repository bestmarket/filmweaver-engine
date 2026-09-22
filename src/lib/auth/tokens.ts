/**
 * Session token minting and hashing.
 *
 * The raw token only ever exists in the user's HttpOnly cookie; the database
 * stores a SHA-256 hash, so a database leak cannot be replayed as a login.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function createSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sessionExpiry(ttlDays: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

export function isSessionActive(
  session: { expires_at: string; revoked_at: string | null },
  now: Date = new Date(),
): boolean {
  if (session.revoked_at) return false;
  return new Date(session.expires_at).getTime() > now.getTime();
}
