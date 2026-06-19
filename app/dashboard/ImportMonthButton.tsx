"use client";

import { useState } from "react";

export default function ImportMonthButton({ athleteId }: { athleteId: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [counts, setCounts] = useState<{ trainings: number; planned: number } | null>(null);

  function getLastMonthRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { from: fmt(from), to: fmt(to) };
  }

  async function handleImport() {
    setState("loading");
    setCounts(null);
    try {
      const { from, to } = getLastMonthRange();
      const res = await fetch("/api/nolio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, from, to }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCounts({ trainings: data.trainings, planned: data.planned });
      setState("done");
      setTimeout(() => { setState("idle"); setCounts(null); }, 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleImport}
      disabled={state === "loading"}
      title="Import done & planned trainings from last month into the database"
      className={`px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50 ${
        state === "done"
          ? "bg-green-700 text-white"
          : state === "error"
          ? "bg-red-700 text-white"
          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
      }`}
    >
      {state === "loading"
        ? "Importing…"
        : state === "done"
        ? counts
          ? `Imported ${counts.trainings} done, ${counts.planned} planned`
          : "Imported!"
        : state === "error"
        ? "Error"
        : "Import last month"}
    </button>
  );
}
