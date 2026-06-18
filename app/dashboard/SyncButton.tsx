"use client";

import { useState } from "react";

export default function SyncButton({
  athleteId,
  from,
  to,
}: {
  athleteId: number;
  from: string;
  to: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSync() {
    setState("loading");
    try {
      const res = await fetch("/api/nolio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, from, to }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("done");
      setTimeout(() => setState("idle"), 2000);
      window.location.reload();
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === "loading"}
      className={`px-3 py-1.5 text-xs rounded transition-colors ${
        state === "done"
          ? "bg-green-700 text-white"
          : state === "error"
          ? "bg-red-700 text-white"
          : "bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
      }`}
    >
      {state === "loading" ? "Syncing…" : state === "done" ? "Synced!" : state === "error" ? "Error" : "Sync week"}
    </button>
  );
}
