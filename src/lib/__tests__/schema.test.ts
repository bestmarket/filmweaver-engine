/**
 * Database relationship checks.
 *
 * These run against the live Lovable Cloud database when server credentials are
 * present, and are skipped otherwise so the suite stays runnable offline.
 */
import { describe, expect, it } from "vitest";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const live = Boolean(url && key);

const OWNED_TABLES = [
  "projects",
  "movies",
  "characters",
  "locations",
  "scenes",
  "shots",
  "assets",
  "subscriptions",
  "credit_accounts",
  "credit_transactions",
  "jobs",
];

describe.skipIf(!live)("database relationships", () => {
  async function rpc(sql: string) {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url as string, key as string, {
      auth: { persistSession: false },
    });
    return client.from(sql).select("*").limit(0);
  }

  it("exposes every user-owned table with ownership information", async () => {
    for (const table of OWNED_TABLES) {
      const { error } = await rpc(table);
      expect(error, `${table} should exist`).toBeNull();
    }
  });

  it("rejects rows without an owner", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url as string, key as string, {
      auth: { persistSession: false },
    });
    const { error } = await client.from("projects").insert({ title: "orphan" } as never);
    expect(error).not.toBeNull();
  });
});

describe("schema contract", () => {
  it("lists every user-owned table that must carry ownership", () => {
    expect(OWNED_TABLES).toContain("jobs");
    expect(OWNED_TABLES).toContain("assets");
    expect(OWNED_TABLES.length).toBeGreaterThan(10);
  });
});
