/**
 * Credit service — wraps the pure credit math with persistence and an
 * idempotent ledger so a retried request never double-charges.
 */
import { getDb } from "@/lib/db/client.server";
import { logger } from "@/lib/observability/logger";
import {
  consume,
  grant,
  release,
  reserve,
  type CreditAccount,
  CreditError,
} from "@/lib/credits/credit-math";

const log = logger.child({ module: "credits" });

type AccountRow = CreditAccount & {
  id: string;
  lifetime_granted: number;
  lifetime_consumed: number;
};

export async function ensureCreditAccount(userId: string): Promise<AccountRow> {
  const db = getDb();
  const { data } = await db
    .from("credit_accounts")
    .select("id, balance, reserved, lifetime_granted, lifetime_consumed")
    .eq("user_id", userId)
    .maybeSingle<AccountRow>();
  if (data) return data;

  const { data: created, error } = await db
    .from("credit_accounts")
    .insert({ user_id: userId })
    .select("id, balance, reserved, lifetime_granted, lifetime_consumed")
    .single<AccountRow>();
  if (error || !created) {
    throw new Error(`Could not open credit account: ${error?.message ?? "unknown"}`);
  }
  return created;
}

async function ledger(input: {
  userId: string;
  kind: "GRANT" | "RESERVE" | "RELEASE" | "CONSUME" | "ADJUST";
  amount: number;
  balanceAfter: number;
  idempotencyKey?: string;
  jobId?: string;
  note?: string;
}): Promise<void> {
  const { error } = await getDb()
    .from("credit_transactions")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      amount: input.amount,
      balance_after: input.balanceAfter,
      idempotency_key: input.idempotencyKey ?? null,
      job_id: input.jobId ?? null,
      note: input.note ?? null,
    });
  if (error) throw new Error(`Credit ledger write failed: ${error.message}`);
}

async function alreadyApplied(userId: string, idempotencyKey?: string): Promise<boolean> {
  if (!idempotencyKey) return false;
  const { data } = await getDb()
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  return Boolean(data);
}

async function persist(userId: string, next: CreditAccount, delta: Partial<AccountRow> = {}) {
  const { error } = await getDb()
    .from("credit_accounts")
    .update({ balance: next.balance, reserved: next.reserved, ...delta })
    .eq("user_id", userId);
  if (error) throw new Error(`Credit account update failed: ${error.message}`);
}

export async function getCreditSummary(userId: string) {
  const account = await ensureCreditAccount(userId);
  return {
    balance: account.balance,
    reserved: account.reserved,
    available: Math.max(0, account.balance - account.reserved),
    lifetimeGranted: account.lifetime_granted,
    lifetimeConsumed: account.lifetime_consumed,
  };
}

export async function grantCredits(
  userId: string,
  amount: number,
  idempotencyKey?: string,
  note?: string,
): Promise<void> {
  if (await alreadyApplied(userId, idempotencyKey)) return;
  const account = await ensureCreditAccount(userId);
  const next = grant(account, amount);
  await persist(userId, next, { lifetime_granted: account.lifetime_granted + amount });
  await ledger({
    userId,
    kind: "GRANT",
    amount,
    balanceAfter: next.balance,
    ...(idempotencyKey !== undefined && { idempotencyKey }),
    ...(note !== undefined && { note }),
  });
  log.info("credits granted", { userId, amount });
}

export async function reserveCredits(
  userId: string,
  amount: number,
  idempotencyKey?: string,
  jobId?: string,
): Promise<void> {
  if (await alreadyApplied(userId, idempotencyKey)) return;
  const account = await ensureCreditAccount(userId);
  const next = reserve(account, amount);
  await persist(userId, next);
  await ledger({
    userId,
    kind: "RESERVE",
    amount,
    balanceAfter: next.balance,
    ...(idempotencyKey !== undefined && { idempotencyKey }),
    ...(jobId !== undefined && { jobId }),
  });
  log.info("credits reserved", { userId, amount, jobId });
}

export async function releaseCredits(userId: string, amount: number, jobId?: string) {
  if (amount <= 0) return;
  const account = await ensureCreditAccount(userId);
  const next = release(account, amount);
  await persist(userId, next);
  await ledger({
    userId,
    kind: "RELEASE",
    amount,
    balanceAfter: next.balance,
    ...(jobId !== undefined && { jobId }),
  });
}

export async function consumeCredits(userId: string, amount: number, jobId?: string) {
  if (amount <= 0) return;
  const account = await ensureCreditAccount(userId);
  const next = consume(account, amount);
  await persist(userId, next, { lifetime_consumed: account.lifetime_consumed + amount });
  await ledger({
    userId,
    kind: "CONSUME",
    amount,
    balanceAfter: next.balance,
    ...(jobId !== undefined && { jobId }),
  });
}

export { CreditError };
