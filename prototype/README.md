# SplitSmart prototype

A responsive Next.js demo for shared expense entry, review, pairwise balances, payment recording, and date-range reports. It uses SQLite through Prisma; browser code only calls the app's API routes and never imports the database client.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
cd prototype
cp .env.example .env
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seed command can be run repeatedly; it only creates the sample records when they are missing and does not clear or reset the SQLite database. The database is stored at `prisma/dev.db`.

Useful commands:

```bash
npm run lint
npm run build
npm run db:seed
npm run db:studio
```

The demo opens as Avery Morgan and includes a roommate group and a trip group. There is no sign-in, user switching, external notification delivery, or money transfer. Approval actions use Avery's seeded reviewer role; recording a payment only adds a local ledger entry. This behavior is for demonstration, not production authentication or payment processing.
