import { MongoClient, Db, Collection, Filter } from "mongodb";

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

function usersCol(): Collection<StoredUser> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getDb().collection<any>("users") as Collection<StoredUser>;
}

export async function upsertUser(user: Omit<StoredUser, "fetchedAt">): Promise<void> {
  await usersCol().updateOne(
    { _id: user._id } as Filter<StoredUser>,
    { $set: { ...user, fetchedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function getAnyUser(): Promise<StoredUser | null> {
  return usersCol().findOne();
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  return usersCol().findOne({ _id: id } as Filter<StoredUser>);
}

export async function deleteUser(id: string): Promise<void> {
  await usersCol().deleteOne({ _id: id } as Filter<StoredUser>);
}
