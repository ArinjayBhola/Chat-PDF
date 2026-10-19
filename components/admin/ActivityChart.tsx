"use client";

import { useState } from "react";
import { adminDate } from "@/lib/admin-format";

type Day = { day: string; users: number };

export default function ActivityChart({ days }: { days: Day[] }) {
  const [range, setRange] = useState<7 | 30>(30);
  const [selected, setSelected] = useState<string | null>(null);
  const visible = days.slice(-range);
  const max = Math.max(1, ...visible.map(d => d.users));
  const today = days.at(-1)?.users ?? 0;
  const average = visible.length ? visible.reduce((sum, d) => sum + d.users, 0) / visible.length : 0;
  const peak = Math.max(0, ...visible.map(d => d.users));
  const active = visible.find(d => d.day === selected) ?? visible.at(-1);

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Daily active users</h2>
          <p className="mt-1 text-sm text-muted-foreground">Signed-in users active each day</p>
        </div>
        <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Activity date range">
          {([7, 30] as const).map(n => (
            <button key={n} type="button" aria-pressed={range === n}
              onClick={() => { setRange(n); setSelected(null); }}
              className={"rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary " + (range === n ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {n} days
            </button>
          ))}
        </div>
      </div>

      <div className="my-6 grid grid-cols-3 gap-3">
        {[["Today", today.toLocaleString()], ["Daily average", average.toFixed(1)], ["Peak day", peak.toLocaleString()]].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {visible.length ? <>
        <div className="relative h-44 pl-8" role="group" aria-label={"Daily active users for the last " + range + " days. Focus or select a bar for its date and count."}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 right-0 flex flex-col justify-between pb-0 text-[10px] text-muted-foreground">
            {[max, max / 2, 0].map((n, i) => <div key={i} className="flex items-center gap-2"><span className="w-6 text-right tabular-nums">{Number.isInteger(n) ? n : n.toFixed(1)}</span><span className="flex-1 border-t border-dashed border-border"/></div>)}
          </div>
          <div className="relative flex h-full items-end gap-1">
            {visible.map(d => (
              <button key={d.day} type="button"
                aria-label={adminDate(d.day, false) + ": " + d.users + " active users"}
                aria-pressed={active?.day === d.day}
                onMouseEnter={() => setSelected(d.day)} onFocus={() => setSelected(d.day)} onClick={() => setSelected(d.day)}
                className="group relative flex h-full min-w-0 flex-1 items-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className={"w-full rounded-t-sm transition-all " + (d.users ? (active?.day === d.day ? "bg-primary" : "bg-primary/45 group-hover:bg-primary/75") : "bg-muted-foreground/25")}
                  style={{ height: d.users ? (d.users / max * 100) + "%" : "2px" }}/>
              </button>
            ))}
          </div>
        </div>
        <div className="ml-8 mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{adminDate(visible[0].day, false)}</span><span>{adminDate(visible[visible.length - 1].day, false)}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs" aria-live="polite" aria-atomic="true">
          <span className="text-muted-foreground">{adminDate(active?.day, false)}</span>
          <span className="font-medium tabular-nums">{active?.users ?? 0} active users</span>
        </div>
      </> : <p className="py-12 text-center text-sm text-muted-foreground">Activity will appear here as users visit the app.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Days before tracking began have no recorded activity.</p>
    </section>
  );
}
