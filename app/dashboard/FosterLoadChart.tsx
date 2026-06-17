"use client";

interface DayData {
  day: string;
  done: number | null;
  planned: number;
}

interface Props {
  data: DayData[];
}

const WIDTH = 560;
const HEIGHT = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;

export default function FosterLoadChart({ data }: Props) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.planned, d.done ?? 0)),
    1
  );

  function x(i: number) {
    return PAD.left + (i / (data.length - 1)) * INNER_W;
  }

  function y(v: number) {
    return PAD.top + INNER_H - (v / maxVal) * INNER_H;
  }

  const plannedPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.planned)}`)
    .join(" ");

  const donePoints = data.filter((d) => d.done !== null);
  const donePath = donePoints
    .map((d, i) => {
      const globalIdx = data.indexOf(d);
      return `${i === 0 ? "M" : "L"}${x(globalIdx)},${y(d.done!)}`;
    })
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxVal));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      style={{ maxHeight: 220 }}
    >
      {/* grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            y1={y(tick)}
            x2={PAD.left + INNER_W}
            y2={y(tick)}
            stroke="#374151"
            strokeWidth={0.5}
          />
          <text
            x={PAD.left - 6}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={10}
            fill="#9ca3af"
          >
            {tick}
          </text>
        </g>
      ))}

      {/* x axis labels */}
      {data.map((d, i) => (
        <text
          key={d.day}
          x={x(i)}
          y={PAD.top + INNER_H + 18}
          textAnchor="middle"
          fontSize={11}
          fill="#9ca3af"
        >
          {d.day}
        </text>
      ))}

      {/* planned line (blue dashed) */}
      <path
        d={plannedPath}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />

      {/* done line (red) */}
      {donePath && (
        <path d={donePath} fill="none" stroke="#ef4444" strokeWidth={1.5} />
      )}

      {/* done dots */}
      {donePoints.map((d) => {
        const i = data.indexOf(d);
        return (
          <circle
            key={d.day}
            cx={x(i)}
            cy={y(d.done!)}
            r={3}
            fill="#ef4444"
          />
        );
      })}

      {/* planned dots */}
      {data.map((d, i) => (
        <circle
          key={`p-${d.day}`}
          cx={x(i)}
          cy={y(d.planned)}
          r={3}
          fill="#60a5fa"
        />
      ))}

      {/* legend */}
      <line x1={PAD.left} y1={HEIGHT - 8} x2={PAD.left + 16} y2={HEIGHT - 8} stroke="#ef4444" strokeWidth={1.5} />
      <text x={PAD.left + 20} y={HEIGHT - 4} fontSize={10} fill="#9ca3af">Done</text>
      <line x1={PAD.left + 60} y1={HEIGHT - 8} x2={PAD.left + 76} y2={HEIGHT - 8} stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={PAD.left + 80} y={HEIGHT - 4} fontSize={10} fill="#9ca3af">Planned</text>
    </svg>
  );
}
