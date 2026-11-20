import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL must be set before running the seed.");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

const people = [
  { id: "avery", name: "Avery Morgan", email: "avery@example.com", initials: "AM", color: "#e7a582" },
  { id: "jordan", name: "Jordan Lee", email: "jordan@example.com", initials: "JL", color: "#a7bba4" },
  { id: "sam", name: "Sam Rivera", email: "sam@example.com", initials: "SR", color: "#b3a5cc" },
  { id: "casey", name: "Casey Chen", email: "casey@example.com", initials: "CC", color: "#dfbd74" },
];

async function main() {
  for (const person of people) {
    await prisma.user.upsert({
      where: { id: person.id },
      update: {},
      create: person,
    });
  }

  const home = await prisma.group.upsert({
    where: { id: "weekend-house" },
    update: {},
    create: { id: "weekend-house", name: "The Weekend House", description: "Roommates · Brooklyn", emoji: "🏡", currency: "USD" },
  });
  const trip = await prisma.group.upsert({
    where: { id: "coast-trip" },
    update: {},
    create: { id: "coast-trip", name: "Coast trip", description: "Big Sur · October", emoji: "🌊", currency: "USD" },
  });

  for (const group of [home, trip]) {
    for (const person of people) {
      await prisma.membership.upsert({
        where: { groupId_userId: { groupId: group.id, userId: person.id } },
        update: {},
        create: { groupId: group.id, userId: person.id, role: person.id === "avery" ? "owner" : "member" },
      });
    }
  }

  const now = new Date();
  const sampleExpenses = [
    { id: "seed-market", description: "Sunday farmers market", amountCents: 6840, payerId: "avery", daysAgo: 1, status: "approved" },
    { id: "seed-internet", description: "Monthly internet", amountCents: 7200, payerId: "jordan", daysAgo: 3, status: "approved" },
    { id: "seed-dinner", description: "Dinner at Lilia", amountCents: 12850, payerId: "sam", daysAgo: 5, status: "pending" },
    { id: "seed-cleaning", description: "Cleaning supplies", amountCents: 3560, payerId: "casey", daysAgo: 7, status: "approved" },
    { id: "seed-flowers", description: "Flowers for the kitchen", amountCents: 2450, payerId: "avery", daysAgo: 9, status: "approved" },
    { id: "seed-coffee", description: "Coffee beans", amountCents: 1925, payerId: "jordan", daysAgo: 12, status: "rejected" },
  ];

  for (const [expenseIndex, item] of sampleExpenses.entries()) {
    const memberIds = expenseIndex === 4 ? ["avery", "jordan"] : ["avery", "jordan", "sam", "casey"];
    const weights = expenseIndex === 3 ? [4000, 3000, 2000, 1000] : memberIds.map(() => 1);
    const amountShares = allocate(item.amountCents, weights);
    const date = daysAgo(now, item.daysAgo);
    const fields = {
      groupId: home.id,
      description: item.description,
      amountCents: item.amountCents,
      payerId: item.payerId,
      submitterId: item.payerId,
      date,
      splitType: expenseIndex === 3 ? "percentage" : "equal",
      status: item.status,
      reviewNote: item.status === "rejected" ? "Please add the receipt before resubmitting." : null,
      reviewedAt: item.status === "pending" ? null : daysAgo(now, expenseIndex + 1),
    };
    const expense = await prisma.expense.upsert({
      where: { id: item.id },
      update: {},
      create: { id: item.id, ...fields },
    });

    for (const [order, userId] of memberIds.entries()) {
      const share = {
        amountCents: amountShares[order],
        percentageBps: expenseIndex === 3 ? weights[order] : null,
        order,
      };
      await prisma.expenseShare.upsert({
        where: { expenseId_userId: { expenseId: expense.id, userId } },
        update: {},
        create: { expenseId: expense.id, userId, ...share },
      });
    }
  }

  const cabinDate = daysAgo(now, 14);
  const cabinFields = {
    groupId: trip.id,
    description: "Cabin deposit",
    amountCents: 42000,
    date: cabinDate,
    splitType: "equal",
    status: "approved",
    payerId: "avery",
    submitterId: "avery",
    reviewNote: null,
    reviewedAt: daysAgo(now, 13),
  };
  await prisma.expense.upsert({
    where: { id: "seed-cabin" },
    update: {},
    create: { id: "seed-cabin", ...cabinFields },
  });

  const cabinShares = allocate(42000, people.map(() => 1));
  for (const [order, person] of people.entries()) {
    const share = { amountCents: cabinShares[order], percentageBps: null, order };
    await prisma.expenseShare.upsert({
      where: { expenseId_userId: { expenseId: "seed-cabin", userId: person.id } },
      update: {},
      create: { expenseId: "seed-cabin", userId: person.id, ...share },
    });
  }

  await prisma.payment.upsert({
    where: { id: "seed-trip-payment" },
    update: {},
    create: {
      id: "seed-trip-payment",
      groupId: trip.id,
      fromUserId: "jordan",
      toUserId: "avery",
      amountCents: 10000,
      date: daysAgo(now, 8),
      note: "Cabin deposit",
    },
  });
}

function daysAgo(from: Date, days: number) {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function allocate(total: number, weights: number[]) {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = weights.map((weight) => Math.floor((total * weight) / weightTotal));
  const remainder = total - shares.reduce((sum, share) => sum + share, 0);
  const remainderOrder = weights
    .map((weight, index) => ({ index, fraction: (total * weight) % weightTotal }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  for (let index = 0; index < remainder; index += 1) shares[remainderOrder[index].index] += 1;
  return shares;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
