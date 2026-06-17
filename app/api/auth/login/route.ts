import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { randomBytes } from "crypto";
import { getAuthorizeUrl } from "@/lib/nolio";
import { sessionOptions, SessionData } from "@/lib/session";
import { getAnyUser } from "@/lib/db";
import { appUrl } from "@/lib/url";

export async function GET(): Promise<NextResponse> {
  const existing = await getAnyUser();
  if (existing) {
    return NextResponse.redirect(appUrl());
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const state = randomBytes(16).toString("hex");
  (session as unknown as Record<string, string>).oauthState = state;
  await session.save();

  return NextResponse.redirect(getAuthorizeUrl(state));
}
