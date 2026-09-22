/**
 * Credit reservation logic — pure and unit tested.
 *
 * Reserve before work starts, then either consume (work succeeded) or release
 * (work failed or was cancelled). Available credits are balance minus holds.
 */

export type CreditAccount = {
  balance: number;
  reserved: number;
};

export class CreditError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "CreditError";
    this.code = code;
  }
}

export function availableCredits(account: CreditAccount): number {
  return Math.max(0, account.balance - account.reserved);
}

export function assertPositiveAmount(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new CreditError("INVALID_AMOUNT", "Credit amount must be a positive whole number.");
  }
  return amount;
}

export function reserve(account: CreditAccount, amount: number): CreditAccount {
  assertPositiveAmount(amount);
  if (availableCredits(account) < amount) {
    throw new CreditError("INSUFFICIENT_CREDITS", "Not enough credits available.");
  }
  return { balance: account.balance, reserved: account.reserved + amount };
}

export function release(account: CreditAccount, amount: number): CreditAccount {
  assertPositiveAmount(amount);
  if (account.reserved < amount) {
    throw new CreditError("INVALID_RELEASE", "Cannot release more credits than are reserved.");
  }
  return { balance: account.balance, reserved: account.reserved - amount };
}

export function consume(account: CreditAccount, amount: number): CreditAccount {
  assertPositiveAmount(amount);
  if (account.reserved < amount) {
    throw new CreditError("INVALID_CONSUME", "Cannot consume more credits than are reserved.");
  }
  if (account.balance < amount) {
    throw new CreditError("INSUFFICIENT_CREDITS", "Not enough credits to settle this charge.");
  }
  return { balance: account.balance - amount, reserved: account.reserved - amount };
}

export function grant(account: CreditAccount, amount: number): CreditAccount {
  assertPositiveAmount(amount);
  return { balance: account.balance + amount, reserved: account.reserved };
}

/** Indicative cost model for Phase 1; provider adapters refine this later. */
export const CREDIT_COSTS = {
  "script.generate": 5,
  "storyboard.image": 8,
  "shot.video": 40,
  "voice.line": 3,
  "music.track": 15,
} as const;

export type JobCostKey = keyof typeof CREDIT_COSTS;

export function estimateJobCost(jobType: string, units = 1): number {
  const base = (CREDIT_COSTS as Record<string, number>)[jobType] ?? 1;
  return Math.max(1, Math.ceil(base * units));
}
