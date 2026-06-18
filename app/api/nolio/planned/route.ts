import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getPlannedTrainings, createPlannedTraining } from "@/lib/nolio";
import { generateUniquePartnerId, upsertPlannedTraining } from "@/lib/db";

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

  const planned = await getPlannedTrainings(session.accessToken, athleteId, from, to);
  return NextResponse.json(planned);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sport_id, name, date_start, description, duration, rpe, distance, elevation_gain, athlete_id } =
    await req.json();

  if (!sport_id || !name || !date_start || !athlete_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const id_partner = await generateUniquePartnerId();

  const body = {
    id_partner,
    sport_id,
    name,
    date_start,
    athlete_id,
    ...(description ? { description } : {}),
    ...(duration ? { duration } : {}),
    ...(rpe ? { rpe } : {}),
    ...(distance ? { distance } : {}),
    ...(elevation_gain ? { elevation_gain } : {}),
  };

  try {
    const result = await createPlannedTraining(session.accessToken, body);
    const nolio_id = (result.nolio_id ?? result.id) as number;

    await upsertPlannedTraining({
      _id: id_partner,
      nolio_id,
      athlete_id,
      sport_id,
      name,
      date_start,
      ...(description ? { description } : {}),
      ...(duration ? { duration } : {}),
      ...(rpe ? { rpe } : {}),
      ...(distance ? { distance } : {}),
      ...(elevation_gain ? { elevation_gain } : {}),
    });

    return NextResponse.json({ ...result, id_partner });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
