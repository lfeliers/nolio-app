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

const SPORTS: { id: number; label: string }[] = [
  { id: 2,  label: "Running" },
  { id: 52, label: "Trail running" },
  { id: 14, label: "Road cycling" },
  { id: 15, label: "Mountain cycling" },
  { id: 19, label: "Swimming" },
  { id: 16, label: "Hiking" },
  { id: 45, label: "Walking" },
  { id: 33, label: "Rowing" },
  { id: 20, label: "Strength" },
  { id: 10, label: "Bodybuilding" },
  { id: 21, label: "Stretching" },
  { id: 30, label: "Yoga" },
  { id: 3,  label: "XC ski - Classic" },
  { id: 4,  label: "XC ski - Skating" },
  { id: 7,  label: "Ski Mountaineering" },
  { id: 8,  label: "Climbing" },
  { id: 18, label: "Virtual ride" },
  { id: 28, label: "Elliptical trainer" },
  { id: 51, label: "Stand up paddle" },
  { id: 38, label: "Biathlon" },
  { id: 59, label: "Tennis" },
  { id: 37, label: "Squash" },
  { id: 53, label: "OCR running" },
  { id: 34, label: "Orienteering race" },
  { id: 35, label: "Track cycling" },
  { id: 36, label: "CX cycling" },
  { id: 24, label: "Treadmill" },
  { id: 26, label: "Kayaking - Sea" },
  { id: 27, label: "Kayaking - River" },
  { id: 29, label: "Walking sticks" },
  { id: 31, label: "Canoe - Sea" },
  { id: 32, label: "Canoe - River" },
  { id: 5,  label: "Roller ski - Classic" },
  { id: 6,  label: "Roller ski - Skating" },
  { id: 12, label: "Other" },
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

const EMPTY_FORM = {
  name: "",
  sportId: "",
  dateStart: "",
  description: "",
  durationH: "",
  durationM: "",
  rpe: "",
  distance: "",
  elevationGain: "",
};

export default function WeeklyCalendar({
  days,
  doneByDay,
  plannedByDay,
  todayStr,
  athleteId,
  weekFrom,
  weekTo,
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
  const [syncing, setSyncing] = useState(false);

  async function handleRefresh() {
    setSyncing(true);
    try {
      await fetch("/api/nolio/planned/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, from: weekFrom, to: weekTo }),
      });
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  }
  const [createDay, setCreateDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate(dayStr: string) {
    setCreateDay(dayStr);
    setForm({ ...EMPTY_FORM, dateStart: dayStr });
    setError(null);
    setSuccess(false);
  }

  function closeCreate() {
    setCreateDay(null);
    setError(null);
    setSuccess(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const body: Record<string, unknown> = {
      sport_id: parseInt(form.sportId),
      name: form.name,
      date_start: form.dateStart,
      athlete_id: athleteId,
    };
    if (form.description) body.description = form.description;
    const dur = durationToSeconds(form.durationH, form.durationM);
    if (dur != null) body.duration = dur;
    if (form.rpe) body.rpe = parseInt(form.rpe);
    if (form.distance) body.distance = parseFloat(form.distance);
    if (form.elevationGain) body.elevation_gain = parseInt(form.elevationGain);

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
      <div className="flex justify-end mb-2">
        <button
          onClick={handleRefresh}
          disabled={syncing}
          className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 flex items-center gap-1"
        >
          <svg className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {syncing ? "Syncing…" : "Refresh"}
        </button>
      </div>
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

              <button
                onClick={() => openCreate(dayStr)}
                className="mt-auto pt-1 w-full text-gray-600 hover:text-gray-400 text-xs flex items-center justify-center gap-1 py-1 rounded hover:bg-gray-800/40 transition-colors"
              >
                <span className="text-base leading-none">+</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Read-only workout detail */}
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

      {/* Create planned workout */}
      {createDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeCreate}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-base font-semibold text-white">New planned workout</h2>
              <button onClick={closeCreate} className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4">
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Sport *</label>
                <select
                  required
                  value={form.sportId}
                  onChange={(e) => setField("sportId", e.target.value)}
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
                  value={form.dateStart}
                  onChange={(e) => setField("dateStart", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
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
                      value={form.durationH}
                      onChange={(e) => setField("durationH", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="min"
                      value={form.durationM}
                      onChange={(e) => setField("durationM", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">RPE</label>
                  <select
                    value={form.rpe}
                    onChange={(e) => setField("rpe", e.target.value)}
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
                    value={form.distance}
                    onChange={(e) => setField("distance", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Elevation gain (m)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.elevationGain}
                    onChange={(e) => setField("elevationGain", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && <p className="text-xs text-green-400">Workout created successfully.</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
