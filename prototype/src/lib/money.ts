export type WeightedShare = { userId: string; weight: number };

export function allocateShares(totalCents: number, shares: WeightedShare[]) {
  const totalWeight = shares.reduce((total, share) => total + share.weight, 0);
  const allocations = shares.map((share) =>
    Math.floor((totalCents * share.weight) / totalWeight),
  );
  const remainder = totalCents - allocations.reduce((total, share) => total + share, 0);
  const order = shares
    .map((share, index) => ({
      index,
      remainder: (totalCents * share.weight) % totalWeight,
    }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);

  for (let index = 0; index < remainder; index += 1) {
    allocations[order[index].index] += 1;
  }

  return allocations;
}

export type LedgerExpense = {
  status: string;
  payerId: string;
  shares: { userId: string; amountCents: number }[];
};

export type LedgerPayment = { fromUserId: string; toUserId: string; amountCents: number };

export function calculateBalances(
  expenses: LedgerExpense[],
  payments: LedgerPayment[],
) {
  const ledger = new Map<string, number>();
  const add = (from: string, to: string, amount: number) => {
    const [low, high] = [from, to].sort();
    const key = `${low}:${high}`;
    const sign = from === low ? 1 : -1;
    ledger.set(key, (ledger.get(key) ?? 0) + sign * amount);
  };

  for (const expense of expenses) {
    if (expense.status !== "approved") continue;
    for (const share of expense.shares) {
      if (share.userId !== expense.payerId) add(share.userId, expense.payerId, share.amountCents);
    }
  }

  for (const payment of payments) {
    add(payment.toUserId, payment.fromUserId, payment.amountCents);
  }

  return [...ledger.entries()]
    .flatMap(([key, signedAmount]) => {
      if (signedAmount === 0) return [];
      const [low, high] = key.split(":");
      return signedAmount > 0
        ? [{ fromUserId: low, toUserId: high, amountCents: signedAmount }]
        : [{ fromUserId: high, toUserId: low, amountCents: -signedAmount }];
    })
    .sort((left, right) => right.amountCents - left.amountCents);
}

export function parseMoneyToCents(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,7}(?:\.\d{1,2})?$/.test(value.trim())) {
    return null;
  }
  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function parsePercentageToBps(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,3}(?:\.\d{1,2})?$/.test(value.trim())) {
    return null;
  }
  const [whole, fraction = ""] = value.trim().split(".");
  const percentage = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return percentage > 0 && percentage <= 10000 ? percentage : null;
}

export function parseDateOnly(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
