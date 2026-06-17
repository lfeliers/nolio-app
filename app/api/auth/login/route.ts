import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthorizeUrl } from "@/lib/nolio";

export async function GET(): Promise<NextResponse> {
  const state = randomBytes(16).toString("hex");
  const authorizeUrl = getAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
