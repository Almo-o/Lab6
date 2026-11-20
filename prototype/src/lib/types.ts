export type Person = {
  id: string;
  name: string;
  email?: string;
  initials: string;
  color: string;
  role?: string;
};

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  splitType: string;
  status: string;
  payerId: string;
  submitterId: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  payer: Person;
  submitter: Person;
  shares: { id: string; userId: string; amountCents: number; percentageBps: number | null; order: number; user: Person }[];
};

export type Payment = {
  id: string;
  amountCents: number;
  date: string;
  note: string;
  fromUserId: string;
  toUserId: string;
  fromUser: Person;
  toUser: Person;
};

export type Balance = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  fromUser?: Person;
  toUser?: Person;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  currency: string;
  members: Person[];
  expenses: Expense[];
  payments: Payment[];
  balances: Balance[];
};
