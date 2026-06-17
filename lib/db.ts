import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;

function getDb(): Db {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
  }
  return client.db(process.env.MONGODB_DB ?? "nolioapi");
}

export interface StoredUser {
  _id: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  fetchedAt: string;
  profile: Record<string, unknown>;
}

export async function upsertUser(user: Omit<StoredUser, "fetchedAt">): Promise<void> {
  await getDb()
    .collection("users")
    .updateOne(
      { _id: user._id },
      { $set: { ...user, fetchedAt: new Date().toISOString() } },
      { upsert: true }
    );
}

export async function getAnyUser(): Promise<StoredUser | null> {
  return getDb().collection<StoredUser>("users").findOne();
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  return getDb().collection<StoredUser>("users").findOne({ _id: id });
}

export async function deleteUser(id: string): Promise<void> {
  await getDb().collection("users").deleteOne({ _id: id });
}
