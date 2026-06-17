import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getTrainings } from "@/lib/nolio";
import { upsertTraining } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const athleteId = Number(searchParams.get("athleteId"));
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!athleteId || !from || !to) {
    return NextResponse.json({ error: "Missing athleteId, from or to" }, { status: 400 });
  }

  const trainings = await getTrainings(session.accessToken, athleteId, from, to);
  await Promise.all(trainings.map((t) => upsertTraining(t, athleteId)));

  return NextResponse.json(trainings);
}
