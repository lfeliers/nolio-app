import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { exchangeCodeForToken, getNolioUser } from "@/lib/nolio";
import { upsertUser } from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";
import { appUrl } from "@/lib/url";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${appUrl()}/?error=missing_code`);
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const profile = await getNolioUser(tokenData.access_token);
    const userId = String(profile.id);

    await upsertUser({
      _id: userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      profile,
    });

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = userId;
    session.accessToken = tokenData.access_token;
    await session.save();

    return NextResponse.redirect(appUrl());
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl()}/?error=auth_failed`);
  }
}
