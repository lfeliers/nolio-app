"use client";

import { useState } from "react";

type Training = {
  nolio_id?: number;
  name?: string;
  sport?: string;
  sport_id?: number;
  date_start?: string;
  duration?: number;
  distance?: number;
  rpe?: number;
  elevation_gain?: number;
  description?: string;
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
  athleteId: number;
  weekFrom: string;
  weekTo: string;
}) {
  const [readonlyWorkout, setReadonlyWorkout] = useState<Training | null>(null);

  return (
    <>
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((day) => {
          const dayStr = toDateStr(day);
          const done = doneByDay[dayStr] ?? [];
          const planned = plannedByDay[dayStr] ?? [];
          const isToday = dayStr === todayStr;
          return (
            <div key={dayStr} className="flex flex-col">
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
                  {t.duration != null && t.duration > 0 && (
                    <p className="text-xs text-red-300">{fmtDuration(t.duration)}</p>
                  )}
                  {t.distance != null && t.distance > 0 && (
                    <p className="text-xs text-red-300">{Number(t.distance).toFixed(1)} km</p>
                  )}
                </div>
              ))}

              {planned.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setReadonlyWorkout(t)}
                  className="mb-1.5 w-full text-left rounded-lg border border-dashed border-red-900 px-2.5 py-2 hover:bg-gray-800/40 transition-colors"
                >
                  <p className="text-xs font-semibold text-red-200 leading-tight">{t.name ?? "—"}</p>
                  {t.sport && <p className="text-xs text-red-300 mt-0.5">{t.sport}</p>}
                  {t.duration != null && t.duration > 0 && (
                    <p className="text-xs text-red-300">{fmtDuration(t.duration)}</p>
                  )}
                  {t.distance != null && t.distance > 0 && (
                    <p className="text-xs text-red-300">{Number(t.distance).toFixed(1)} km</p>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {readonlyWorkout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setReadonlyWorkout(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{readonlyWorkout.name ?? "Planned workout"}</h2>
              <button
                onClick={() => setReadonlyWorkout(null)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {readonlyWorkout.sport && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Sport</dt>
                  <dd className="text-gray-100">{readonlyWorkout.sport}</dd>
                </div>
              )}
              {readonlyWorkout.date_start && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Date</dt>
                  <dd className="text-gray-100">{readonlyWorkout.date_start}</dd>
                </div>
              )}
              {readonlyWorkout.duration != null && readonlyWorkout.duration > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Duration</dt>
                  <dd className="text-gray-100">{fmtDuration(readonlyWorkout.duration)}</dd>
                </div>
              )}
              {readonlyWorkout.distance != null && readonlyWorkout.distance > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Distance</dt>
                  <dd className="text-gray-100">{Number(readonlyWorkout.distance).toFixed(1)} km</dd>
                </div>
              )}
              {readonlyWorkout.elevation_gain != null && readonlyWorkout.elevation_gain > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Elevation gain</dt>
                  <dd className="text-gray-100">{readonlyWorkout.elevation_gain} m</dd>
                </div>
              )}
              {readonlyWorkout.rpe != null && readonlyWorkout.rpe > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">RPE</dt>
                  <dd className="text-gray-100">{readonlyWorkout.rpe}</dd>
                </div>
              )}
              {readonlyWorkout.description && String(readonlyWorkout.description).trim() && (
                <div className="pt-1">
                  <dt className="text-gray-400 mb-1">Description</dt>
                  <dd className="text-gray-100 text-xs whitespace-pre-wrap">{String(readonlyWorkout.description)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
