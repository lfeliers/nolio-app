import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getPlannedTrainings, updatePlannedTraining } from "@/lib/nolio";
import { getAnyUser } from "@/lib/db";

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
  let accessToken: string | undefined;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  accessToken = session.accessToken;
  if (!accessToken) {
    const dbUser = await getAnyUser();
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    accessToken = dbUser.accessToken;
  }

  const body = await req.json();
  try {
    const result = await updatePlannedTraining(accessToken, body);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
