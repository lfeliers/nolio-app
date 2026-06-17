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
