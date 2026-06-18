import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getTrainings, getPlannedTrainings } from "@/lib/nolio";
import { upsertTraining, upsertNolioPlannedTraining } from "@/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { athleteId, from, to } = await req.json();

  if (!athleteId || !from || !to) {
    return NextResponse.json({ error: "Missing athleteId, from or to" }, { status: 400 });
  }

  const [trainings, planned] = await Promise.all([
    getTrainings(session.accessToken, athleteId, from, to),
    getPlannedTrainings(session.accessToken, athleteId, from, to),
  ]);

  await Promise.all([
    ...trainings.map((t) => upsertTraining(t, athleteId)),
    ...(planned as Record<string, unknown>[]).map((p) => {
      const nolio_id = (p.nolio_id ?? p.id) as number;
      return upsertNolioPlannedTraining({ ...p, nolio_id }, athleteId);
    }),
  ]);

  return NextResponse.json({ trainings: trainings.length, planned: planned.length });
}
