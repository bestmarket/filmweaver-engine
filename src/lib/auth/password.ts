/**
 * Password hashing — PBKDF2-SHA256 over Web Crypto (Worker-compatible).
 *
 * Stored format: pbkdf2$sha256$<iterations>$<saltBase64>$<hashBase64>
 * Plaintext passwords are never stored, logged, or returned.
 */

const ITERATIONS = 210_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

export const PASSWORD_MIN_LENGTH = 10;

export type PasswordPolicyResult = { valid: true } | { valid: false; reason: string };

export function validatePasswordStrength(password: string): PasswordPolicyResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, reason: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must include upper and lower case letters." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Password must include a number." };
  }
  return { valid: true };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations },
    key,
    KEY_LENGTH_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;
  const iterations = Number(parts[2]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  try {
    const salt = fromBase64(parts[3] as string);
    const expected = fromBase64(parts[4] as string);
    const actual = await derive(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
