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

function handlePlanned(payload: WebhookPayload): void {
  const { notif_type, object_type, object_id, user_id, date_object } = payload;
  if (notif_type === "deleted_planned_event") {
    console.info(`[planned] deleted ${object_type} #${object_id} for athlete ${user_id}`);
    return;
  }
  console.info(`[planned] ${notif_type} — ${object_type} #${object_id} at ${date_object} for athlete ${user_id}`);
}

export function dispatchWebhook(payload: WebhookPayload): void {
  const { notif_type } = payload;
  // Check "planned" before "event" — new_planned_event contains both substrings
  if (notif_type.includes("planned")) {
    handlePlanned(payload);
  } else if (notif_type.includes("metric")) {
    handleMetric(payload);
  } else if (notif_type.includes("event")) {
    handleEvent(payload);
  } else {
    console.warn(`[webhook] unknown notif_type=${notif_type}`);
  }
}
