import React, { useMemo } from "react";
import { useHunterStore } from "../store";

function fmtDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

type Row = {
  species: string;
  obtainedCount: number;
  lastObtainedAt: number | null;
  avgKills: number | null;
  bestKills: number | null;
  worstKills: number | null;
};

export default function StatsDashboard() {
  const grinds = useHunterStore((s) => s.grinds);
  const trophies = useHunterStore((s) => s.trophies);

  const rows: Row[] = useMemo(() => {
    const bySpecies = new Map<string, number[]>();
    const lastBySpecies = new Map<string, number>();

    for (const t of trophies) {
      const list = bySpecies.get(t.species) || [];
      list.push(t.killsAtObtained || 0);
      bySpecies.set(t.species, list);

      const prev = lastBySpecies.get(t.species) || 0;
      if (t.obtainedAt > prev) lastBySpecies.set(t.species, t.obtainedAt);
    }

    // Use grinds list to keep your 9 species always visible
    const speciesList = grinds.map((g) => g.species);

    return speciesList.map((species) => {
      const list = bySpecies.get(species) || [];
      const obtainedCount = list.length;

      if (!obtainedCount) {
        return {
          species,
          obtainedCount: 0,
          lastObtainedAt: null,
          avgKills: null,
          bestKills: null,
          worstKills: null,
        };
      }

      const sum = list.reduce((a, b) => a + b, 0);
      const avg = sum / obtainedCount;
      const best = Math.min(...list);
      const worst = Math.max(...list);

      return {
        species,
        obtainedCount,
        lastObtainedAt: lastBySpecies.get(species) || null,
        avgKills: avg,
        bestKills: best,
        worstKills: worst,
      };
    });
  }, [grinds, trophies]);

  const totalObtained = useMemo(() => trophies.length, [trophies]);
  const overallAvg = useMemo(() => {
    if (!trophies.length) return null;
    const sum = trophies.reduce((a, t) => a + (t.killsAtObtained || 0), 0);
    return sum / trophies.length;
  }, [trophies]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
        <h2 className="text-xl font-semibold">Stats</h2>
        <p className="text-sm text-slate-400 mt-1">
          These stats are based on your Trophy history — so they stay correct even after kills reset.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-black border border-slate-800 p-3">
            <div className="text-xs text-slate-400">Total Great Ones</div>
            <div className="text-2xl font-bold">{totalObtained}</div>
          </div>

          <div className="rounded-lg bg-black border border-slate-800 p-3">
            <div className="text-xs text-slate-400">Avg Kills per Great One</div>
            <div className="text-2xl font-bold">
              {overallAvg === null ? "-" : overallAvg.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
        <h3 className="text-lg font-semibold">By Species</h3>

        <div className="mt-3 space-y-3">
          {rows.map((r) => (
            <div key={r.species} className="rounded-lg bg-black border border-slate-800 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{r.species}</div>
                <div className="text-sm text-slate-300">
                  Great Ones: <span className="text-white font-semibold">{r.obtainedCount}</span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-400">
                  Last Obtained:{" "}
                  <span className="text-slate-200">
                    {r.lastObtainedAt ? fmtDate(r.lastObtainedAt) : "-"}
                  </span>
                </div>
                <div className="text-slate-400">
                  Avg Kills:{" "}
                  <span className="text-slate-200">
                    {r.avgKills === null ? "-" : r.avgKills.toFixed(0)}
                  </span>
                </div>
                <div className="text-slate-400">
                  Best Run:{" "}
                  <span className="text-slate-200">
                    {r.bestKills === null ? "-" : r.bestKills}
                  </span>
                </div>
                <div className="text-slate-400">
                  Worst Run:{" "}
                  <span className="text-slate-200">
                    {r.worstKills === null ? "-" : r.worstKills}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Note: current grind kills reset after Obtained — trophies store the “kills at obtained”.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
