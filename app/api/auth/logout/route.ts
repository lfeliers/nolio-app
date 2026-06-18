import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { deleteUser, getAnyUser } from "@/lib/db";
import { appUrl } from "@/lib/url";

export async function POST(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const existingUser = await getAnyUser();
  if (existingUser) {
    await deleteUser(existingUser._id);
  }
  session.destroy();
  return NextResponse.redirect(`${appUrl()}/login`);
}
