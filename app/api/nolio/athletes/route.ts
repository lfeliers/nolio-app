import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getAthletes } from "@/lib/nolio";
import { upsertAthlete } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const athletes = await getAthletes(session.accessToken);
  await Promise.all(athletes.map((a) => upsertAthlete(a)));

  return NextResponse.json(athletes);
}
