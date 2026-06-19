#!/usr/bin/env tsx
/**
 * One-time backfill: links existing trainings to their planned training.
 * Matching logic: same athlete_id + sport_id + date_start, closest duration.
 * Usage: npx tsx scripts/backfill-planned-training-ids.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB ?? "nolioapi");

  const trainingsCol = db.collection("trainings");
  const plannedCol = db.collection("nolio_planned_trainings");

  const trainings = await trainingsCol.find({}).toArray();
  console.log(`Found ${trainings.length} trainings to process.`);

  let matched = 0;
  let unmatched = 0;

  for (const training of trainings) {
    const candidates = await plannedCol
      .find({
        athlete_id: training.athlete_id,
        sport_id: training.sport_id,
        date_start: training.date_start,
      })
      .toArray();

    let plannedId: number | null = null;
    if (candidates.length === 1) {
      plannedId = candidates[0].nolio_id;
    } else if (candidates.length > 1) {
      const best = candidates.reduce((a, b) =>
        Math.abs((a.duration ?? 0) - (training.duration ?? 0)) <=
        Math.abs((b.duration ?? 0) - (training.duration ?? 0))
          ? a
          : b
      );
      plannedId = best.nolio_id;
    }

    await trainingsCol.updateOne(
      { _id: training._id },
      { $set: { planned_training_id: plannedId } }
    );

    if (plannedId != null) matched++;
    else unmatched++;
  }

  console.log(`Done. Matched: ${matched}, unmatched: ${unmatched}.`);
  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
