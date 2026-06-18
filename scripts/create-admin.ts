#!/usr/bin/env tsx
/**
 * Creates (or resets) a local admin account.
 * Usage: npx tsx scripts/create-admin.ts <email> <password>
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB ?? "nolioapi");
  const col = db.collection("app_users");

  const passwordHash = await bcrypt.hash(password, 12);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col.updateOne(
    { _id: email } as any,
    { $set: { _id: email, email, passwordHash, createdAt: new Date().toISOString() } },
    { upsert: true }
  );

  console.log(`Admin user "${email}" created/updated.`);
  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
