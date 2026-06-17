import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { deleteUser } from "@/lib/db";

const APP_URL = process.env.NOLIO_REDIRECT_URI!.replace("/api/auth/callback", "");

export async function POST(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (session.userId) {
    await deleteUser(session.userId);
  }
  session.destroy();
  return NextResponse.redirect(APP_URL);
}
