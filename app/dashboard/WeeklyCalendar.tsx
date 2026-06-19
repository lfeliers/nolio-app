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
  planned_training_id?: number;
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

function TrainingDetails({ t }: { t: Training }) {
  return (
    <dl className="space-y-2 text-sm">
      {t.sport && (
        <div className="flex justify-between">
          <dt className="text-gray-400">Sport</dt>
          <dd className="text-gray-100">{t.sport}</dd>
        </div>
      )}
      {t.date_start && (
        <div className="flex justify-between">
          <dt className="text-gray-400">Date</dt>
          <dd className="text-gray-100">{t.date_start}</dd>
        </div>
      )}
      {t.duration != null && t.duration > 0 && (
        <div className="flex justify-between">
          <dt className="text-gray-400">Duration</dt>
          <dd className="text-gray-100">{fmtDuration(t.duration)}</dd>
        </div>
      )}
      {t.distance != null && t.distance > 0 && (
        <div className="flex justify-between">
          <dt className="text-gray-400">Distance</dt>
          <dd className="text-gray-100">{Number(t.distance).toFixed(1)} km</dd>
        </div>
      )}
      {t.elevation_gain != null && t.elevation_gain > 0 && (
        <div className="flex justify-between">
          <dt className="text-gray-400">Elevation gain</dt>
          <dd className="text-gray-100">{t.elevation_gain} m</dd>
        </div>
      )}
      {t.rpe != null && t.rpe > 0 && (
        <div className="flex justify-between">
          <dt className="text-gray-400">RPE</dt>
          <dd className="text-gray-100">{t.rpe}</dd>
        </div>
      )}
      {t.description && String(t.description).trim() && (
        <div className="pt-1">
          <dt className="text-gray-400 mb-1">Description</dt>
          <dd className="text-gray-100 text-xs whitespace-pre-wrap">{String(t.description)}</dd>
        </div>
      )}
    </dl>
  );
}

export default function WeeklyCalendar({
  days,
  doneByDay,
  plannedByDay,
  plannedById,
  todayStr,
}: {
  days: Date[];
  doneByDay: Record<string, Training[]>;
  plannedByDay: Record<string, Training[]>;
  plannedById: Record<number, Training>;
  todayStr: string;
  athleteId: number;
  weekFrom: string;
  weekTo: string;
}) {
  const [selected, setSelected] = useState<{ done: Training; planned: Training | null } | null>(null);
  const [selectedPlanned, setSelectedPlanned] = useState<Training | null>(null);

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
                <button
                  key={i}
                  onClick={() =>
                    setSelected({
                      done: t,
                      planned: t.planned_training_id != null ? (plannedById[t.planned_training_id] ?? null) : null,
                    })
                  }
                  className="mb-1.5 w-full text-left rounded-lg border border-red-900 bg-red-950 px-2.5 py-2 hover:bg-red-900/60 transition-colors"
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

              {planned.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPlanned(t)}
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

      {/* Done training modal (with linked planned) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{selected.done.name ?? "Training"}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Done</h3>
                <TrainingDetails t={selected.done} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Planned</h3>
                {selected.planned ? (
                  <TrainingDetails t={selected.planned} />
                ) : (
                  <p className="text-sm text-gray-500">No planned training</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone planned training modal */}
      {selectedPlanned && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedPlanned(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{selectedPlanned.name ?? "Planned workout"}</h2>
              <button
                onClick={() => setSelectedPlanned(null)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>
            <TrainingDetails t={selectedPlanned} />
          </div>
        </div>
      )}
    </>
  );
}
