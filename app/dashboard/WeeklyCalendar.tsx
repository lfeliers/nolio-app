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

// https://github.com/NolioApp/NolioAPI-Documentation/wiki/Training-Object#sport-map
const SPORTS: { id: number; label: string }[] = [
  { id: 1,  label: "Running" },
  { id: 2,  label: "Cycling" },
  { id: 3,  label: "Swimming" },
  { id: 4,  label: "Trail Running" },
  { id: 5,  label: "Triathlon" },
  { id: 6,  label: "Duathlon" },
  { id: 7,  label: "Cross-country skiing" },
  { id: 8,  label: "Mountain biking" },
  { id: 9,  label: "Rowing" },
  { id: 10, label: "Walking" },
  { id: 11, label: "Hiking" },
  { id: 23, label: "Other" },
];

const RPE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function fmtDuration(seconds: number): string {
  const totalMin = Math.floor(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function durationToSeconds(h: string, m: string): number | undefined {
  const hv = parseInt(h) || 0;
  const mv = parseInt(m) || 0;
  const total = hv * 3600 + mv * 60;
  return total > 0 ? total : undefined;
}

export default function WeeklyCalendar({
  days,
  doneByDay,
  plannedByDay,
  todayStr,
  athleteId,
}: {
  days: Date[];
  doneByDay: Record<string, Training[]>;
  plannedByDay: Record<string, Training[]>;
  todayStr: string;
  athleteId: number;
}) {
  const [selectedWorkout, setSelectedWorkout] = useState<Training | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [description, setDescription] = useState("");
  const [durationH, setDurationH] = useState("");
  const [durationM, setDurationM] = useState("");
  const [rpe, setRpe] = useState("");
  const [distance, setDistance] = useState("");
  const [elevationGain, setElevationGain] = useState("");

  function openModal(t: Training) {
    setSelectedWorkout(t);
    setError(null);
    setSuccess(false);
    setName(t.name ?? "");
    setSportId(String(t.sport_id ?? ""));
    setDateStart(t.date_start ?? "");
    setDescription(String(t.description ?? ""));
    const totalSec = t.duration ?? 0;
    setDurationH(String(Math.floor(totalSec / 3600) || ""));
    setDurationM(String(Math.floor((totalSec % 3600) / 60) || ""));
    setRpe(t.rpe != null ? String(t.rpe) : "");
    setDistance(t.distance != null ? String(t.distance) : "");
    setElevationGain(t.elevation_gain != null ? String(t.elevation_gain) : "");
  }

  function closeModal() {
    setSelectedWorkout(null);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkout?.nolio_id) return;
    setError(null);
    setSuccess(false);
    setSaving(true);

    const body: Record<string, unknown> = {
      id_partner: selectedWorkout.nolio_id,
      sport_id: parseInt(sportId),
      name,
      date_start: dateStart,
      athlete_id: athleteId,
    };
    if (description) body.description = description;
    const dur = durationToSeconds(durationH, durationM);
    if (dur != null) body.duration = dur;
    if (rpe) body.rpe = parseInt(rpe);
    if (distance) body.distance = parseFloat(distance);
    if (elevationGain) body.elevation_gain = parseInt(elevationGain);

    try {
      const res = await fetch("/api/nolio/planned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

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
                  onClick={() => openModal(t)}
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
          onClick={closeModal}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Edit planned workout</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Sport *</label>
                <select
                  required
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                >
                  <option value="">Select a sport</option>
                  {SPORTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Duration</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="h"
                      value={durationH}
                      onChange={(e) => setDurationH(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="min"
                      value={durationM}
                      onChange={(e) => setDurationM(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">RPE</label>
                  <select
                    value={rpe}
                    onChange={(e) => setRpe(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                  >
                    <option value="">—</option>
                    {RPE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Elevation gain (m)</label>
                  <input
                    type="number"
                    min="0"
                    value={elevationGain}
                    onChange={(e) => setElevationGain(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
              {success && (
                <p className="text-xs text-green-400">Workout updated successfully.</p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
