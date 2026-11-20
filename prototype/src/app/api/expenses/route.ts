import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { allocateShares, parseDateOnly, parseMoneyToCents, parsePercentageToBps } from "@/lib/money";

type ExpenseRequest = {
  groupId?: unknown;
  description?: unknown;
  amount?: unknown;
  date?: unknown;
  payerId?: unknown;
  splitType?: unknown;
  participants?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let body: ExpenseRequest;
  try {
    const parsed: unknown = await request.json();
    if (!isRecord(parsed)) return NextResponse.json({ error: "Please check the expense details." }, { status: 400 });
    body = parsed;
  } catch {
    return NextResponse.json({ error: "The expense details couldn’t be read." }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  const amountCents = parseMoneyToCents(body.amount);
  const date = parseDateOnly(body.date);
  const splitType = body.splitType;
  if (!description || description.length > 120 || !amountCents || !date) {
    return NextResponse.json({ error: "Add a description, a positive amount, and a valid date." }, { status: 400 });
  }
  if (splitType !== "equal" && splitType !== "percentage") {
    return NextResponse.json({ error: "Choose an equal or percentage split." }, { status: 400 });
  }
  if (!Array.isArray(body.participants) || body.participants.length === 0 || body.participants.length > 50) {
    return NextResponse.json({ error: "Choose at least one group member to share this expense." }, { status: 400 });
  }

  const participants = body.participants.filter(isRecord);
  if (participants.length !== body.participants.length) {
    return NextResponse.json({ error: "Please check the selected participants." }, { status: 400 });
  }
  const participantIds = participants.map((participant) => participant.userId);
  if (participantIds.some((id) => typeof id !== "string") || new Set(participantIds).size !== participantIds.length) {
    return NextResponse.json({ error: "Each participant can only be selected once." }, { status: 400 });
  }
  const payerId = typeof body.payerId === "string" ? body.payerId : "";
  if (!participantIds.includes(payerId)) {
    return NextResponse.json({ error: "The payer must also be included in the split." }, { status: 400 });
  }

  const weights = splitType === "equal"
    ? participants.map((participant) => ({ userId: participant.userId as string, weight: 1 }))
    : participants.map((participant) => ({
        userId: participant.userId as string,
        weight: parsePercentageToBps(participant.percentage),
      }));

  if (weights.some((share) => share.weight === null) || weights.reduce((sum, share) => sum + (share.weight ?? 0), 0) !== (splitType === "percentage" ? 10000 : participants.length)) {
    return NextResponse.json({ error: "Percentage splits must add up to exactly 100%." }, { status: 400 });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: typeof body.groupId === "string" ? body.groupId : "" },
      include: { memberships: { select: { userId: true, role: true } } },
    });
    if (!group) return NextResponse.json({ error: "That group could not be found." }, { status: 404 });
    const memberIds = new Set(group.memberships.map((membership) => membership.userId));
    if (participantIds.some((id) => !memberIds.has(id as string))) {
      return NextResponse.json({ error: "Every participant must be a member of this group." }, { status: 400 });
    }

    const amountShares = allocateShares(amountCents, weights as { userId: string; weight: number }[]);
    const expense = await prisma.expense.create({
      data: {
        groupId: group.id,
        description,
        amountCents,
        date,
        splitType,
        status: "pending",
        payerId,
        submitterId: "avery",
        shares: {
          create: participants.map((participant, index) => ({
            userId: participant.userId as string,
            amountCents: amountShares[index],
            percentageBps: splitType === "percentage" ? weights[index].weight : null,
            order: index,
          })),
        },
      },
      select: { id: true },
    });
    return NextResponse.json({ id: expense.id }, { status: 201 });
  } catch (error) {
    console.error("Could not create expense", error);
    return NextResponse.json({ error: "We couldn’t save that expense. Please try again." }, { status: 500 });
  }
}
