"use client";

import { useState } from "react";

type Training = {
  nolio_id?: number;
  name?: string;
  sport?: string;
  date_start?: string;
  duration?: number;
  distance?: number;
  [key: string]: unknown;
};

function fmtDuration(seconds: number): string {
  const totalMin = Math.floor(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function WeeklyCalendar({
  days,
  doneByDay,
  plannedByDay,
  todayStr,
}: {
  days: Date[];
  doneByDay: Record<string, Training[]>;
  plannedByDay: Record<string, Training[]>;
  todayStr: string;
}) {
  const [selectedWorkout, setSelectedWorkout] = useState<Training | null>(null);

  return (
    <>
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((day) => {
          const dayStr = toDateStr(day);
          const done = doneByDay[dayStr] ?? [];
          const planned = plannedByDay[dayStr] ?? [];
          const isToday = dayStr === todayStr;
          return (
            <div key={dayStr}>
              <p className={`text-xs font-bold mb-0.5 ${isToday ? "text-white" : "text-gray-400"}`}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                {day.toLocaleDateString("en-US", { day: "numeric", month: "short" })}
              </p>
              {done.map((t, i) => (
                <div
                  key={i}
                  className="mb-1.5 rounded-lg border border-red-900 bg-red-950 px-2.5 py-2"
                >
                  <p className="text-xs font-semibold text-red-200 leading-tight">{t.name ?? "—"}</p>
                  {t.sport && <p className="text-xs text-red-300 mt-0.5">{t.sport}</p>}
                  {t.duration != null && (
                    <p className="text-xs text-red-300">{fmtDuration(t.duration)}</p>
                  )}
                  {t.distance != null && (
                    <p className="text-xs text-red-300">{Number(t.distance).toFixed(1)} km</p>
                  )}
                </div>
              ))}
              {planned.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedWorkout(t)}
                  className="mb-1.5 w-full text-left rounded-lg border border-dashed border-red-900 px-2.5 py-2 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-red-200 leading-tight">{t.name ?? "—"}</p>
                  {t.sport && <p className="text-xs text-red-300 mt-0.5">{t.sport}</p>}
                  {t.duration != null && (
                    <p className="text-xs text-red-300">{fmtDuration(t.duration)}</p>
                  )}
                  {t.distance != null && (
                    <p className="text-xs text-red-300">{Number(t.distance).toFixed(1)} km</p>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {selectedWorkout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedWorkout(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                {selectedWorkout.name ?? "Planned workout"}
              </h2>
              <button
                onClick={() => setSelectedWorkout(null)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>
            {/* form goes here */}
          </div>
        </div>
      )}
    </>
  );
}
