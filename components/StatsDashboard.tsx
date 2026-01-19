import React, { useMemo } from "react";
import { useHunterStore } from "../store";

function format(ts: number | null) {
  if (!ts) return "Never";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

export default function StatsDashboard() {
  const grinds = useHunterStore((s: any) => s.grinds) || [];
  const trophies = useHunterStore((s: any) => s.trophies) || [];
  const lastBackupAt = useHunterStore((s: any) => s.lastBackupAt ?? null);

  const safeGrinds = Array.isArray(grinds) ? grinds : [];
  const safeTrophies = Array.isArray(trophies) ? trophies : [];

  const totals = useMemo(() => {
    const totalKills = safeGrinds.reduce((sum: number, g: any) => sum + (Number(g.kills) || 0), 0);
    const obtainedCount = safeGrinds.filter((g: any) => !!g.obtained).length;
    const remaining = safeGrinds.length - obtainedCount;

    // Top 3 by kills
    const top = [...safeGrinds]
      .sort((a: any, b: any) => (Number(b.kills) || 0) - (Number(a.kills) || 0))
      .slice(0, 3);

    return { totalKills, obtainedCount, remaining, top };
  }, [safeGrinds]);

  return (
    <div className="p-4 space-y-4 text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Stats</h2>
          <div className="text-sm text-slate-400">Your Great One grind progress at a glance.</div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-widest text-slate-400">Last Backup</div>
          <div className="text-sm text-slate-200">{format(lastBackupAt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-widest text-slate-400">Total Kills</div>
          <div className="text-2xl font-semibold">{totals.totalKills.toLocaleString()}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-widest text-slate-400">Obtained</div>
          <div className="text-2xl font-semibold">{totals.obtainedCount}</div>
          <div className="text-xs text-slate-400 mt-1">
            Remaining: {totals.remaining}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-widest text-slate-400">Trophies</div>
          <div className="text-2xl font-semibold">{safeTrophies.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Top Grinds (by kills)</div>

        {totals.top.length === 0 ? (
          <div className="text-slate-400 text-sm mt-2">No grind data yet.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {totals.top.map((g: any) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="text-sm">
                  <div className="font-semibold">{g.species}</div>
                  <div className="text-xs text-slate-400">
                    Fur: {g.fur || "—"} {g.obtained ? "• Obtained" : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold">{(Number(g.kills) || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">All Species</div>
        <div className="text-xs text-slate-400 mt-1">Kills + obtained status.</div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {safeGrinds.map((g: any) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="text-sm">
                <div className="font-semibold">{g.species}</div>
                <div className="text-xs text-slate-400">
                  Fur: {g.fur || "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{(Number(g.kills) || 0).toLocaleString()}</div>
                <div className={g.obtained ? "text-xs text-emerald-400" : "text-xs text-slate-400"}>
                  {g.obtained ? "Obtained" : "In Progress"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {safeGrinds.length === 0 ? (
          <div className="text-slate-400 text-sm mt-2">No grind list found.</div>
        ) : null}
      </div>
    </div>
  );
}
