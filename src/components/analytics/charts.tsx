import { memo, useId, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { compact, niceCeil } from "@/lib/rbx";

export type Datum = { t: string; v: number; partial?: boolean };
type Fmt = (n: number) => string;

const dateLabel = (iso: string, hourly: boolean) =>
  new Date(iso).toLocaleString([], hourly ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" });

function Tip({ active, payload, fmt, hourly, unitLabel }: { active?: boolean; payload?: { payload: Datum }[]; fmt: Fmt; hourly: boolean; unitLabel?: string }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{new Date(d.t).toLocaleString([], hourly ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { weekday: "short", month: "short", day: "numeric" })}</p>
      <p className="mt-0.5 font-medium tabular">{fmt(d.v)}{unitLabel && <span className="text-muted-foreground"> {unitLabel}</span>}{d.partial && <span className="text-muted-foreground"> · in progress</span>}</p>
    </div>
  );
}

/** Dashed top / middle / base lines with the ceiling printed above, matching the Overview cards. */
function Frame({ max, fmt, first, last, hourly, children }: { max: number; fmt: Fmt; first?: string; last?: string; hourly: boolean; children: ReactNode }) {
  // A 24h hourly axis starts and ends at the same clock time, so add the date when the days differ.
  const label = (iso: string) => hourly && first && last && new Date(first).toDateString() !== new Date(last).toDateString()
    ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : dateLabel(iso, hourly);
  return (
    <div>
      <p className="text-xs text-muted-foreground/70 tabular">{fmt(max)}</p>
      <div className="h-36 md:h-44">{children}</div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular">
        <span>{first ? label(first) : ""}</span><span>{last ? label(last) : ""}</span>
      </div>
    </div>
  );
}

const GRID = (max: number) => [max, max / 2, 0].map((y) => (
  <ReferenceLine key={y} y={y} stroke="hsl(var(--border))" strokeDasharray="3 5" ifOverflow="extendDomain" />
));

export const LineCard = memo(function LineCard({ data, fmt = compact, hourly = false, tone = "chart", unitLabel }: { data: Datum[]; fmt?: Fmt; hourly?: boolean; tone?: "chart" | "violet"; unitLabel?: string }) {
  const id = useId().replace(/:/g, "");
  const max = niceCeil(Math.max(...data.map((d) => d.v)) * 1.1);
  const color = `hsl(var(--${tone}))`;
  return (
    <Frame max={max} fmt={fmt} first={data[0]?.t} last={data.at(-1)?.t} hourly={hourly}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, max]} />
          {GRID(max)}
          <Tooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }} content={<Tip fmt={fmt} hourly={hourly} unitLabel={unitLabel} />} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
});

/** Bars per period; the latest complete one is highlighted, running periods are hatched. */
export const BarsCard = memo(function BarsCard({ data, fmt = compact, hourly = false, tone = "chart", unitLabel }: { data: Datum[]; fmt?: Fmt; hourly?: boolean; tone?: "chart" | "gold"; unitLabel?: string }) {
  const id = useId().replace(/:/g, "");
  const max = niceCeil(Math.max(...data.map((d) => d.v)) * 1.15);
  let hi = -1;
  for (let i = data.length - 1; i >= 0; i--) if (!data[i].partial) { hi = i; break; }
  const showLabel = data.length <= 14;
  const solid = tone === "gold" ? `url(#${id}-g)` : "hsl(var(--chart))";
  const dim = tone === "gold" ? "hsl(var(--gold-deep) / 0.45)" : "hsl(var(--chart-dim))";
  const stripe = tone === "gold" ? "hsl(var(--gold))" : "hsl(var(--chart))";
  return (
    <Frame max={max} fmt={fmt} first={data[0]?.t} last={data.at(-1)?.t} hourly={hourly}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 22, right: 4, left: 4, bottom: 0 }} barCategoryGap={data.length > 20 ? "18%" : "22%"}>
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--gold))" /><stop offset="100%" stopColor="hsl(var(--gold-deep))" />
            </linearGradient>
            <pattern id={`${id}-s`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill={stripe} fillOpacity={0.1} /><line x1="0" y1="0" x2="0" y2="7" stroke={stripe} strokeOpacity={0.7} strokeWidth="1.5" />
            </pattern>
          </defs>
          <YAxis hide domain={[0, max]} />
          {GRID(max)}
          <Tooltip cursor={{ fill: "hsl(var(--foreground) / 0.04)" }} content={<Tip fmt={fmt} hourly={hourly} unitLabel={unitLabel} />} />
          <Bar dataKey="v" radius={[6, 6, 2, 2]} isAnimationActive={false}>
            {data.map((d, i) => <Cell key={d.t} fill={d.partial ? `url(#${id}-s)` : i === hi ? solid : dim} />)}
            {showLabel && hi >= 0 && (
              <LabelList dataKey="v" position="top" content={({ x, y, width, index, value }) => index === hi ? (
                <text x={Number(x) + Number(width) / 2} y={Number(y) - 8} textAnchor="middle" fontSize={13} fontWeight={500} fill={tone === "gold" ? "hsl(var(--gold))" : "hsl(var(--chart))"}>{fmt(Number(value))}</text>
              ) : null} />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
});
