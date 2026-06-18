import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getPlannedTrainings } from "@/lib/nolio";
import { upsertNolioPlannedTraining } from "@/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { athleteId, from, to } = await req.json();
  if (!athleteId || !from || !to) {
    return NextResponse.json({ error: "Missing athleteId, from or to" }, { status: 400 });
  }

  try {
    const trainings = await getPlannedTrainings(session.accessToken, athleteId, from, to);
    await Promise.all(
      (trainings as Record<string, unknown>[]).map((t) => upsertNolioPlannedTraining(t, athleteId))
    );
    return NextResponse.json({ synced: trainings.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
