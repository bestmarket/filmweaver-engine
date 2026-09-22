import { describe, expect, it } from "vitest";

import {
  assertOwnership,
  forbidden,
  isAdmin,
  requireAdmin,
  requireUser,
  type AuthenticatedUser,
} from "@/lib/auth/authorize";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, hashToken, isSessionActive, normalizeEmail } from "@/lib/auth/tokens";
import {
  availableCredits,
  consume,
  CreditError,
  estimateJobCost,
  grant,
  release,
  reserve,
} from "@/lib/credits/credit-math";
import { assertTransition, canTransition, decideRetry } from "@/lib/jobs/job-state";
import { redact, REDACTED } from "@/lib/observability/logger";

const user = (over: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: "user-1",
  email: "a@b.com",
  displayName: "A",
  roles: ["USER"],
  status: "ACTIVE",
  ...over,
});

describe("authentication", () => {
  it("hashes and verifies a password without storing plaintext", async () => {
    const stored = await hashPassword("Stellar-Lens-2026");
    expect(stored).not.toContain("Stellar-Lens-2026");
    expect(stored.startsWith("pbkdf2$sha256$")).toBe(true);
    expect(await verifyPassword("Stellar-Lens-2026", stored)).toBe(true);
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("rejects weak passwords", () => {
    expect(validatePasswordStrength("short").valid).toBe(false);
    expect(validatePasswordStrength("alllowercase123").valid).toBe(false);
    expect(validatePasswordStrength("NoNumbersHere!").valid).toBe(false);
    expect(validatePasswordStrength("Cinematic2026x").valid).toBe(true);
  });

  it("mints unique session tokens and stores only their hash", async () => {
    const a = createSessionToken();
    const b = createSessionToken();
    expect(a).not.toEqual(b);
    const hash = await hashToken(a);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(a);
    expect(await hashToken(a)).toEqual(hash);
  });

  it("treats revoked or expired sessions as inactive", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isSessionActive({ expires_at: future, revoked_at: null })).toBe(true);
    expect(isSessionActive({ expires_at: past, revoked_at: null })).toBe(false);
    expect(isSessionActive({ expires_at: future, revoked_at: past })).toBe(false);
  });

  it("normalizes emails for unique lookups", () => {
    expect(normalizeEmail("  Director@Studio.COM ")).toBe("director@studio.com");
  });
});

describe("authorization", () => {
  it("requires an authenticated active user", () => {
    expect(() => requireUser(null)).toThrow(/sign in/i);
    expect(() => requireUser(user({ status: "SUSPENDED" }))).toThrow(/suspended/i);
    expect(requireUser(user()).id).toBe("user-1");
  });

  it("protects admin surfaces server-side", () => {
    expect(isAdmin(user())).toBe(false);
    expect(() => requireAdmin(user())).toThrow(/administrator/i);
    expect(requireAdmin(user({ roles: ["USER", "ADMIN"] })).id).toBe("user-1");
  });

  it("gives an admin no implicit access to another user's resources", () => {
    const admin = user({ id: "admin-1", roles: ["ADMIN"] });
    expect(() => assertOwnership({ user_id: "user-1" }, admin)).toThrow(/access/i);
  });
});

describe("project ownership", () => {
  it("returns resources owned by the caller", () => {
    const project = { id: "p1", user_id: "user-1" };
    expect(assertOwnership(project, user())).toBe(project);
  });

  it("refuses another user's resource and hides missing rows", () => {
    expect(() => assertOwnership({ id: "p1", user_id: "user-2" }, user())).toThrow(/access/i);
    expect(() => assertOwnership(null, user())).toThrow(/not found/i);
    expect(forbidden().status).toBe(403);
  });
});

describe("job lifecycle", () => {
  it("allows only legal status transitions", () => {
    expect(canTransition("QUEUED", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "COMPLETED")).toBe(true);
    expect(canTransition("PROCESSING", "RETRYING")).toBe(true);
    expect(canTransition("RETRYING", "PROCESSING")).toBe(true);
    expect(canTransition("COMPLETED", "PROCESSING")).toBe(false);
    expect(canTransition("CANCELLED", "PROCESSING")).toBe(false);
    expect(canTransition("QUEUED", "COMPLETED")).toBe(false);
    expect(() => assertTransition("COMPLETED", "QUEUED")).toThrow(/Illegal job transition/);
  });

  it("retries until the attempt budget is spent", () => {
    expect(decideRetry(1, 3)).toEqual({ retry: true, delayMs: 1000 });
    expect(decideRetry(2, 3).retry).toBe(true);
    expect(decideRetry(3, 3)).toEqual({ retry: false });
  });

  it("prices jobs by type", () => {
    expect(estimateJobCost("shot.video")).toBe(40);
    expect(estimateJobCost("script.generate", 2)).toBe(10);
    expect(estimateJobCost("unknown.type")).toBe(1);
  });
});

describe("credit reservation", () => {
  const account = { balance: 100, reserved: 0 };

  it("reserves against available credits only", () => {
    const held = reserve(account, 40);
    expect(held).toEqual({ balance: 100, reserved: 40 });
    expect(availableCredits(held)).toBe(60);
    expect(() => reserve(held, 61)).toThrow(CreditError);
  });

  it("releases a hold without charging", () => {
    const released = release(reserve(account, 40), 40);
    expect(released).toEqual({ balance: 100, reserved: 0 });
    expect(() => release(account, 1)).toThrow(/reserved/i);
  });

  it("consumes a hold and debits the balance", () => {
    const settled = consume(reserve(account, 40), 40);
    expect(settled).toEqual({ balance: 60, reserved: 0 });
    expect(() => consume(account, 5)).toThrow(/reserved/i);
  });

  it("grants credits and rejects invalid amounts", () => {
    expect(grant(account, 50)).toEqual({ balance: 150, reserved: 0 });
    expect(() => grant(account, 0)).toThrow(/positive/i);
    expect(() => grant(account, 2.5)).toThrow(/positive/i);
  });
});

describe("logging", () => {
  it("never emits secrets", () => {
    const line = redact({
      userId: "user-1",
      password: "Cinematic2026x",
      apiKey: "sk-live-123",
      token: "abc",
      nested: { authorization: "Bearer xyz", safe: "keep" },
    }) as Record<string, unknown>;
    expect(JSON.stringify(line)).not.toContain("Cinematic2026x");
    expect(JSON.stringify(line)).not.toContain("sk-live-123");
    expect(line["password"]).toBe(REDACTED);
    expect((line["nested"] as Record<string, unknown>)["safe"]).toBe("keep");
  });
});
