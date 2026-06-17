import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { exchangeCodeForToken, getNolioUser } from "@/lib/nolio";
import { upsertUser } from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";

const APP_URL = process.env.NOLIO_REDIRECT_URI!.replace("/api/auth/callback", "");

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/?error=missing_code`);
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

    return NextResponse.redirect(APP_URL);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/?error=auth_failed`);
  }
}
