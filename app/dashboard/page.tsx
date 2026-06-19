import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import Link from "next/link";
import { sessionOptions, SessionData } from "@/lib/session";
import { getAthletes } from "@/lib/nolio";
import {
  getAnyUser,
  upsertAthlete,
  getTrainings,
  getNolioPlannedTrainings,
} from "@/lib/db";
import FosterLoadChart from "./FosterLoadChart";
import WeeklyCalendar from "./WeeklyCalendar";
import ImportMonthButton from "./ImportMonthButton";
import { NolioMenu } from "@/app/components/NolioMenu";

export const dynamic = "force-dynamic";

type Training = {
  nolio_id?: number;
  name?: string;
  sport?: string;
  date_start?: string;
  duration?: number;
  distance?: number;
  load_foster?: number;
  [key: string]: unknown;
};

type Athlete = {
  nolio_id: number;
  name: string;
  teams?: { name: string }[];
  [key: string]: unknown;
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekBounds() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return {
    monday,
    mondayStr: toDateStr(monday),
    todayStr: toDateStr(today),
    tomorrowStr: toDateStr(tomorrow),
    sundayStr: toDateStr(sunday),
  };
}


function buildChartData(
  trainings: Training[],
  plannedFull: Training[],
  monday: Date,
  todayStr: string
) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const doneByDay: Record<string, number[]> = {};
  for (const t of trainings) {
    if (t.date_start) {
      doneByDay[t.date_start] ??= [];
      doneByDay[t.date_start].push(t.load_foster ?? 0);
    }
  }

  const plannedByDay: Record<string, number[]> = {};
  for (const t of plannedFull) {
    if (t.date_start) {
      plannedByDay[t.date_start] ??= [];
      plannedByDay[t.date_start].push(t.load_foster ?? 0);
    }
  }

  let cumDone = 0;
  let cumPlanned = 0;
  return days.map((day) => {
    const dayStr = toDateStr(day);
    cumDone += (doneByDay[dayStr] ?? []).reduce((a, b) => a + b, 0);
    cumPlanned += (plannedByDay[dayStr] ?? []).reduce((a, b) => a + b, 0);
    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      done: dayStr <= todayStr ? cumDone : null,
      planned: cumPlanned,
    };
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const accessToken: string = session.accessToken ?? "";
  const dbUser = await getAnyUser();
  const connectedUser = dbUser?.profile as { email?: string; username?: string; first_name?: string; last_name?: string } | null ?? null;

  const { monday, mondayStr, todayStr, sundayStr } = weekBounds();

  // Fetch and sync athletes
  let athletes: Athlete[] = [];
  let fetchError: string | null = null;
  try {
    const raw = await getAthletes(accessToken);
    athletes = raw as Athlete[];
    await Promise.all(athletes.map((a) => upsertAthlete(a as Record<string, unknown>)));
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  const params = await searchParams;
  const selectedId = params.athlete ? Number(params.athlete) : null;
  const selectedAthlete = selectedId ? athletes.find((a) => a.nolio_id === selectedId) ?? null : null;

  let trainings: Training[] = [];
  let plannedFull: Training[] = [];
  if (selectedAthlete && selectedId) {
    try {
      const [t, p] = await Promise.all([
        getTrainings(selectedId, mondayStr, todayStr),
        getNolioPlannedTrainings(selectedId, mondayStr, sundayStr),
      ]);
      trainings = t as unknown as Training[];
      plannedFull = p as unknown as Training[];
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const doneByDay: Record<string, Training[]> = {};
  for (const t of trainings) {
    if (t.date_start) {
      doneByDay[t.date_start] ??= [];
      doneByDay[t.date_start].push(t);
    }
  }

  const matchedPlannedIds = new Set(
    trainings.map((t) => t.planned_training_id as number | undefined).filter(Boolean)
  );
  const plannedUnmatched = plannedFull.filter((t) => !matchedPlannedIds.has(t.nolio_id as number));

  const plannedByDay: Record<string, Training[]> = {};
  for (const t of plannedUnmatched) {
    if (t.date_start) {
      plannedByDay[t.date_start] ??= [];
      plannedByDay[t.date_start].push(t);
    }
  }

  const plannedById: Record<number, Training> = {};
  for (const t of plannedFull) {
    if (t.nolio_id != null) plannedById[t.nolio_id as number] = t;
  }

  const chartData = selectedAthlete
    ? buildChartData(trainings, plannedFull, monday, todayStr)
    : null;

  const localEmail = session.localEmail ?? session.userId;
  const nolioName = connectedUser
    ? [connectedUser.first_name, connectedUser.last_name].filter(Boolean).join(" ") || null
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* navbar */}
      <nav className="h-12 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <NolioMenu localEmail={localEmail} nolioName={nolioName} />
        <div />
      </nav>

      <div className="flex flex-1 overflow-hidden">
      {/* sidebar */}
      <aside className="w-48 shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-3 border-b border-gray-800">
          <h2 className="font-semibold text-sm">Athletes</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {athletes.map((a) => (
            <Link
              key={a.nolio_id}
              href={`/dashboard?athlete=${a.nolio_id}`}
              className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedId === a.nolio_id
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {a.name}
            </Link>
          ))}
          {athletes.length === 0 && !fetchError && (
            <p className="text-xs text-gray-500 px-2">No athletes found.</p>
          )}
        </nav>
      </aside>

      {/* main */}
      <main className="flex-1 overflow-auto p-6">
        {fetchError && (
          <div className="mb-4 px-4 py-3 rounded bg-red-900/40 border border-red-700 text-red-300 text-sm">
            Error: {fetchError}
          </div>
        )}

        {!selectedAthlete ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select an athlete to see their details.
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-1">{selectedAthlete.name}</h1>
            <p className="text-sm text-gray-400 mb-1">
              Nolio ID: <code className="text-xs bg-gray-800 px-1 rounded">{selectedAthlete.nolio_id}</code>
            </p>
            {selectedAthlete.teams && selectedAthlete.teams.length > 0 && (
              <p className="text-sm text-gray-400 mb-4">
                Teams: {selectedAthlete.teams.map((t) => t.name).join(", ")}
              </p>
            )}

            <hr className="border-gray-800 my-4" />

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">This week&apos;s trainings</h2>
              <ImportMonthButton athleteId={selectedAthlete.nolio_id} />
            </div>

            {/* weekly calendar */}
            <WeeklyCalendar
              days={days}
              doneByDay={doneByDay}
              plannedByDay={plannedByDay}
              plannedById={plannedById}
              todayStr={todayStr}
              athleteId={selectedId!}
              weekFrom={mondayStr}
              weekTo={sundayStr}
            />

            <hr className="border-gray-800 my-4" />
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Cumulative Foster Load</h2>
            {chartData && <FosterLoadChart data={chartData} />}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
