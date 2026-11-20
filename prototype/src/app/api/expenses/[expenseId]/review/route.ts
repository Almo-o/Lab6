import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ReviewRequest = { decision?: unknown; reason?: unknown };

export async function PATCH(
  request: Request,
  context: { params: Promise<{ expenseId: string }> },
) {
  const { expenseId } = await context.params;
  let body: ReviewRequest;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    }
    body = parsed as ReviewRequest;
  } catch {
    return NextResponse.json({ error: "The review decision couldn’t be read." }, { status: 400 });
  }

  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (body.decision === "rejected" && !reason) {
    return NextResponse.json({ error: "Add a short reason so the group knows what to fix." }, { status: 400 });
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { group: { include: { memberships: true } } },
    });
    if (!expense) return NextResponse.json({ error: "That expense could not be found." }, { status: 404 });
    const reviewer = expense.group.memberships.find((membership) => membership.userId === "avery");
    if (!reviewer || !["owner", "reviewer"].includes(reviewer.role)) {
      return NextResponse.json({ error: "Only a group reviewer can make this decision." }, { status: 403 });
    }
    if (expense.status !== "pending") {
      return NextResponse.json({ error: "This expense has already been reviewed." }, { status: 409 });
    }

    const updated = await prisma.expense.updateMany({
      where: { id: expenseId, status: "pending" },
      data: {
        status: body.decision,
        reviewNote: body.decision === "rejected" ? reason.slice(0, 300) : null,
        reviewedAt: new Date(),
      },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ error: "This expense has already been reviewed." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not review expense", error);
    return NextResponse.json({ error: "We couldn’t save that review. Please try again." }, { status: 500 });
  }
}
