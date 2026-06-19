import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { getAppUserByEmail, getAnyUser } from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";
import { appUrl } from "@/lib/url";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const appUser = await getAppUserByEmail(email.toLowerCase().trim());
  if (!appUser || !(await bcrypt.compare(password, appUser.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const nolioUser = await getAnyUser();
  if (!nolioUser) {
    return NextResponse.json({ error: "No Nolio account connected. Please connect via OAuth first." }, { status: 403 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.userId = nolioUser._id;
  session.localEmail = appUser.email;
  session.accessToken = nolioUser.accessToken;
  await session.save();

  return NextResponse.json({ redirectTo: `${appUrl()}/dashboard` });
}
