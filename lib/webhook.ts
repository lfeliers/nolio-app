import { getAnyUser, upsertNolioPlannedTraining, deleteNolioPlannedTraining } from "@/lib/db";
import { getPlannedTrainingById } from "@/lib/nolio";

export interface WebhookPayload {
  notif_type: string;
  object_type?: string;
  object_id: number;
  user_id: number;
  date_object?: string;
  livemode: boolean;
  metric_type?: string;
}

function handleEvent(payload: WebhookPayload): void {
  const { notif_type, object_type, object_id, user_id, date_object } = payload;
  if (notif_type === "deleted_event") {
    console.info(`[event] deleted ${object_type} #${object_id} by user ${user_id}`);
    return;
  }
  console.info(`[event] ${notif_type} — ${object_type} #${object_id} at ${date_object} by user ${user_id}`);
}

function handleMetric(payload: WebhookPayload): void {
  const { notif_type, object_id, user_id, metric_type, date_object } = payload;
  if (notif_type === "deleted_metric") {
    console.info(`[metric] deleted #${object_id} (type=${metric_type}) by user ${user_id}`);
    return;
  }
  console.info(`[metric] ${notif_type} — type=${metric_type} #${object_id} at ${date_object} by user ${user_id}`);
}

async function handlePlanned(payload: WebhookPayload): Promise<void> {
  const { notif_type, object_id, user_id } = payload;

  if (notif_type === "deleted_planned_event") {
    await deleteNolioPlannedTraining(object_id);
    console.info(`[planned] deleted #${object_id} for athlete ${user_id}`);
    return;
  }

  const dbUser = await getAnyUser();
  if (!dbUser) {
    console.warn("[planned] no stored user, cannot fetch training");
    return;
  }
  const training = await getPlannedTrainingById(dbUser.accessToken, object_id, user_id);
  if (!training) {
    console.warn(`[planned] could not fetch training #${object_id}`);
    return;
  }
  await upsertNolioPlannedTraining(training, user_id);
  console.info(`[planned] synced #${object_id} for athlete ${user_id}`);
}

export function dispatchWebhook(payload: WebhookPayload): void {
  const { notif_type } = payload;
  // Check "planned" before "event" — new_planned_event contains both substrings
  if (notif_type.includes("planned")) {
    handlePlanned(payload).catch((err) =>
      console.error("[planned webhook] error:", err)
    );
  } else if (notif_type.includes("metric")) {
    handleMetric(payload);
  } else if (notif_type.includes("event")) {
    handleEvent(payload);
  } else {
    console.warn(`[webhook] unknown notif_type=${notif_type}`);
  }
}
