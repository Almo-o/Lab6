import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBalances, parseDateOnly, parseMoneyToCents } from "@/lib/money";

type PaymentRequest = {
  groupId?: unknown;
  fromUserId?: unknown;
  toUserId?: unknown;
  amount?: unknown;
  date?: unknown;
  note?: unknown;
};

export async function POST(request: Request) {
  let body: PaymentRequest;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json({ error: "Check the payment details and try again." }, { status: 400 });
    }
    body = parsed as PaymentRequest;
  } catch {
    return NextResponse.json({ error: "The payment details couldn’t be read." }, { status: 400 });
  }

  const groupId = typeof body.groupId === "string" ? body.groupId : "";
  const fromUserId = typeof body.fromUserId === "string" ? body.fromUserId : "";
  const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";
  const amountCents = parseMoneyToCents(body.amount);
  const date = parseDateOnly(body.date);
  if (!groupId || !fromUserId || !toUserId || fromUserId === toUserId || !amountCents || !date) {
    return NextResponse.json({ error: "Enter a valid payment amount and date." }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 120) : "";

  try {
    const payment = await prisma.$transaction(async (transaction) => {
      const group = await transaction.group.findUnique({
        where: { id: groupId },
        include: {
          memberships: { select: { userId: true } },
          expenses: { select: { status: true, payerId: true, shares: { select: { userId: true, amountCents: true } } } },
          payments: { select: { fromUserId: true, toUserId: true, amountCents: true } },
        },
      });
      if (!group) throw new Error("GROUP_NOT_FOUND");
      const memberIds = new Set(group.memberships.map((member) => member.userId));
      if (!memberIds.has(fromUserId) || !memberIds.has(toUserId)) throw new Error("MEMBERSHIP_REQUIRED");

      const balance = calculateBalances(group.expenses, group.payments).find(
        (pair) => pair.fromUserId === fromUserId && pair.toUserId === toUserId,
      );
      if (!balance) throw new Error("NO_BALANCE");
      if (amountCents > balance.amountCents) throw new Error("PAYMENT_TOO_LARGE");

      return transaction.payment.create({
        data: {
          groupId,
          fromUserId,
          toUserId,
          amountCents,
          date,
          note,
        },
        select: { id: true },
      });
    });
    return NextResponse.json({ id: payment.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GROUP_NOT_FOUND") return NextResponse.json({ error: "That group could not be found." }, { status: 404 });
      if (error.message === "MEMBERSHIP_REQUIRED") return NextResponse.json({ error: "Both people must be members of this group." }, { status: 400 });
      if (error.message === "NO_BALANCE") return NextResponse.json({ error: "There isn’t an outstanding balance for that pair." }, { status: 400 });
      if (error.message === "PAYMENT_TOO_LARGE") return NextResponse.json({ error: "That payment is more than the amount owed." }, { status: 400 });
    }
    console.error("Could not record payment", error);
    return NextResponse.json({ error: "We couldn’t record that payment. Please try again." }, { status: 500 });
  }
}
