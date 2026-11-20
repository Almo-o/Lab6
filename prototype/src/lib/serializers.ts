import { calculateBalances } from "@/lib/money";

export function serializeGroup(
  group: {
    id: string;
    name: string;
    description: string;
    emoji: string;
    currency: string;
    memberships: { role: string; user: { id: string; name: string; email: string; initials: string; color: string } }[];
    expenses: {
      id: string;
      description: string;
      amountCents: number;
      date: Date;
      splitType: string;
      status: string;
      payerId: string;
      submitterId: string;
      reviewNote: string | null;
      reviewedAt: Date | null;
      payer: { id: string; name: string; initials: string; color: string };
      submitter: { id: string; name: string; initials: string; color: string };
      shares: { id: string; userId: string; amountCents: number; percentageBps: number | null; order: number; user: { id: string; name: string; initials: string; color: string } }[];
    }[];
    payments: {
      id: string;
      amountCents: number;
      date: Date;
      note: string;
      fromUserId: string;
      toUserId: string;
      fromUser: { id: string; name: string; initials: string; color: string };
      toUser: { id: string; name: string; initials: string; color: string };
    }[];
  },
) {
  const balances = calculateBalances(group.expenses, group.payments);
  const membersById = new Map(group.memberships.map(({ user }) => [user.id, user]));

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    emoji: group.emoji,
    currency: group.currency,
    members: group.memberships.map(({ role, user }) => ({ ...user, role })),
    expenses: group.expenses.map((expense) => ({
      ...expense,
      date: expense.date.toISOString(),
      reviewedAt: expense.reviewedAt?.toISOString() ?? null,
    })),
    payments: group.payments.map((payment) => ({
      ...payment,
      date: payment.date.toISOString(),
    })),
    balances: balances.map((balance) => ({
      ...balance,
      fromUser: membersById.get(balance.fromUserId),
      toUser: membersById.get(balance.toUserId),
    })),
  };
}
