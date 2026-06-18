import { MongoClient, Db, Collection, Filter } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

async function getDb(): Promise<Db> {
  if (!clientPromise) {
    const c = new MongoClient(process.env.MONGODB_URI!);
    clientPromise = c.connect();
  }
  const c = await clientPromise;
  return c.db(process.env.MONGODB_DB ?? "nolioapi");
}

// ── Users ──────────────────────────────────────────────────────────────────

export interface StoredUser {
  _id: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  fetchedAt: string;
  profile: Record<string, unknown>;
}

async function usersCol(): Promise<Collection<StoredUser>> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection<any>("users") as Collection<StoredUser>;
}

export async function upsertUser(user: Omit<StoredUser, "fetchedAt">): Promise<void> {
  const col = await usersCol();
  await col.updateOne(
    { _id: user._id } as Filter<StoredUser>,
    { $set: { ...user, fetchedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function getAnyUser(): Promise<StoredUser | null> {
  const col = await usersCol();
  return col.findOne();
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const col = await usersCol();
  return col.findOne({ _id: id } as Filter<StoredUser>);
}

export async function deleteUser(id: string): Promise<void> {
  const col = await usersCol();
  await col.deleteOne({ _id: id } as Filter<StoredUser>);
}

// ── Athletes ───────────────────────────────────────────────────────────────

export interface StoredAthlete {
  _id: number;
  nolio_id: number;
  name: string;
  teams?: { name: string }[];
  syncedAt: string;
  [key: string]: unknown;
}

async function athletesCol(): Promise<Collection<StoredAthlete>> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection<any>("athletes") as Collection<StoredAthlete>;
}

export async function upsertAthlete(athlete: Record<string, unknown>): Promise<void> {
  const col = await athletesCol();
  const id = athlete.nolio_id as number;
  await col.updateOne(
    { _id: id } as Filter<StoredAthlete>,
    { $set: { ...athlete, _id: id, syncedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function getAllAthletes(): Promise<StoredAthlete[]> {
  const col = await athletesCol();
  return col.find().toArray();
}

// ── Trainings ──────────────────────────────────────────────────────────────

export interface StoredTraining {
  _id: number;
  nolio_id: number;
  athlete_id: number;
  name?: string;
  sport?: string;
  date_start?: string;
  duration?: number;
  distance?: number;
  load_foster?: number;
  syncedAt: string;
  [key: string]: unknown;
}

async function trainingsCol(): Promise<Collection<StoredTraining>> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection<any>("trainings") as Collection<StoredTraining>;
}

export async function upsertTraining(training: Record<string, unknown>, athleteId: number): Promise<void> {
  const col = await trainingsCol();
  const id = training.nolio_id as number;
  await col.updateOne(
    { _id: id } as Filter<StoredTraining>,
    { $set: { ...training, _id: id, athlete_id: athleteId, syncedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

// ── Nolio Planned Trainings (unified cache) ───────────────────────────────
// Stores all planned trainings — both Nolio-native and API-created.
// API-created ones also carry id_partner for future updates.

export interface StoredNolioPlannedTraining {
  _id: number;          // nolio_id
  nolio_id: number;
  id_partner?: number;  // only set for trainings we created via API
  athlete_id: number;
  name?: string;
  sport?: string;
  sport_id?: number;
  date_start?: string;
  duration?: number;
  distance?: number;
  rpe?: number;
  elevation_gain?: number;
  description?: string;
  load_foster?: number;
  syncedAt: string;
  [key: string]: unknown;
}

async function nolioPlannedCol(): Promise<Collection<StoredNolioPlannedTraining>> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection<any>("nolio_planned_trainings") as Collection<StoredNolioPlannedTraining>;
}

export async function upsertNolioPlannedTraining(
  training: Record<string, unknown>,
  athleteId: number,
  idPartner?: number
): Promise<void> {
  const col = await nolioPlannedCol();
  const nolio_id = training.nolio_id as number;
  await col.updateOne(
    { _id: nolio_id } as Filter<StoredNolioPlannedTraining>,
    {
      $set: {
        ...training,
        _id: nolio_id,
        nolio_id,
        athlete_id: athleteId,
        ...(idPartner != null ? { id_partner: idPartner } : {}),
        syncedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

export async function deleteNolioPlannedTraining(nolioId: number): Promise<void> {
  const col = await nolioPlannedCol();
  await col.deleteOne({ _id: nolioId } as Filter<StoredNolioPlannedTraining>);
}

export async function getNolioPlannedTrainings(
  athleteId: number,
  from: string,
  to: string
): Promise<StoredNolioPlannedTraining[]> {
  const col = await nolioPlannedCol();
  return col
    .find({ athlete_id: athleteId, date_start: { $gte: from, $lte: to } } as Filter<StoredNolioPlannedTraining>)
    .toArray();
}

export async function getPlannedSyncAgeSeconds(athleteId: number, from: string, to: string): Promise<number> {
  const col = await nolioPlannedCol();
  const newest = await col
    .find({ athlete_id: athleteId, date_start: { $gte: from, $lte: to } } as Filter<StoredNolioPlannedTraining>)
    .sort({ syncedAt: -1 })
    .limit(1)
    .toArray();
  if (!newest.length) return Infinity;
  return (Date.now() - new Date(newest[0].syncedAt).getTime()) / 1000;
}

export async function generateUniquePartnerId(): Promise<number> {
  const col = await nolioPlannedCol();
  let id: number;
  do {
    id = Date.now() + Math.floor(Math.random() * 1000);
  } while (await col.findOne({ id_partner: id } as Filter<StoredNolioPlannedTraining>));
  return id;
}
