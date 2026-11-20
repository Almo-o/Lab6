import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBalances, parseDateOnly } from "@/lib/money";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const groupId = params.get("groupId") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (!groupId || !fromDate || !toDate) {
    return NextResponse.json({ error: "Choose a group and valid date range." }, { status: 400 });
  }
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  if (fromDate > toDate) {
    return NextResponse.json({ error: "The start date must be on or before the end date." }, { status: 400 });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: { include: { user: true } },
        expenses: {
          where: { date: { gte: start, lte: end }, status: "approved" },
          include: { payer: true, shares: { include: { user: true }, orderBy: { order: "asc" } } },
          orderBy: { date: "desc" },
        },
        payments: {
          where: { date: { gte: start, lte: end } },
          include: { fromUser: true, toUser: true },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!group) return NextResponse.json({ error: "That group could not be found." }, { status: 404 });

    const currentData = await prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      select: {
        expenses: { select: { status: true, payerId: true, shares: { select: { userId: true, amountCents: true } } } },
        payments: { select: { fromUserId: true, toUserId: true, amountCents: true } },
      },
    });
    const currentBalances = calculateBalances(currentData.expenses, currentData.payments);
    const users = new Map(group.memberships.map(({ user }) => [user.id, user]));

    return NextResponse.json({
      group: { id: group.id, name: group.name, emoji: group.emoji, currency: group.currency },
      expenses: group.expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        amountCents: expense.amountCents,
        date: expense.date.toISOString(),
        payer: expense.payer,
      })),
      payments: group.payments.map((payment) => ({
        ...payment,
        date: payment.date.toISOString(),
      })),
      totalExpensesCents: group.expenses.reduce((total, expense) => total + expense.amountCents, 0),
      totalPaymentsCents: group.payments.reduce((total, payment) => total + payment.amountCents, 0),
      currentBalances: currentBalances.map((balance) => ({
        ...balance,
        fromUser: users.get(balance.fromUserId),
        toUser: users.get(balance.toUserId),
      })),
    });
  } catch (error) {
    console.error("Could not load report", error);
    return NextResponse.json({ error: "We couldn’t build that report. Please try again." }, { status: 500 });
  }
}
