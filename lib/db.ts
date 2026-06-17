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
