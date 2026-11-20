import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeGroup } from "@/lib/serializers";

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
        expenses: {
          include: {
            payer: true,
            submitter: true,
            shares: { include: { user: true }, orderBy: { order: "asc" } },
          },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        },
        payments: {
          include: { fromUser: true, toUser: true },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(groups.map(serializeGroup));
  } catch (error) {
    console.error("Could not load groups", error);
    return NextResponse.json({ error: "We couldn’t load your groups. Please try again." }, { status: 500 });
  }
}
