import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { dispatchWebhook, WebhookPayload } from "@/lib/webhook";

function webhookKey() { return process.env.NOLIO_WEBHOOK_KEY ?? ""; }

function verifyKey(received: string): boolean {
  const key = webhookKey();
  if (!key) return false;
  try {
    return timingSafeEqual(Buffer.from(received), Buffer.from(key));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const received = req.headers.get("x-nolio-key") ?? "";
  if (!verifyKey(received)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload: WebhookPayload = await req.json();

  if (!payload.livemode) {
    return NextResponse.json({ status: "ok" });
  }

  dispatchWebhook(payload);
  return NextResponse.json({ status: "ok" });
}
