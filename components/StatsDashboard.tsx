// components/StatsDashboard.tsx
import React, { useMemo } from "react";
import { useHunterStore } from "../store";

/**
 * StatsDashboard — READ ONLY
 * UI polish only
 * - Lifetime kills per species
 * - Obtained stats
 * - No mutations
 * - No grinder logic
 */

function pretty(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

function fmtDate(ts: number | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return "—";
  }
}

type Row = {
  species: string;
  lifetimeKills: number;
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
    const killsBySpecies = new Map<string, number>();
    const obtainedKillsBySpecies = new Map<string, number[]>();
    const lastObtainedBySpecies = new Map<string, number>();

    // Lifetime kills (from grinds)
    for (const g of grinds) {
      killsBySpecies.set(
        g.species,
        (killsBySpecies.get(g.species) || 0) + (g.kills || 0)
      );
    }

    // Trophy-derived stats
    for (const t of trophies) {
      const list = obtainedKillsBySpecies.get(t.species) || [];
      if (typeof t.killsAtObtained === "number") {
        list.push(t.killsAtObtained);
      }
      obtainedKillsBySpecies.set(t.species, list);

      if (typeof t.obtainedAt === "number") {
        const prev = lastObtainedBySpecies.get(t.species) || 0;
        if (t.obtainedAt > prev) {
          lastObtainedBySpecies.set(t.species, t.obtainedAt);
        }
      }
    }

    const speciesSet = new Set<string>();
    grinds.forEach((g) => speciesSet.add(g.species));
    trophies.forEach((t) => speciesSet.add(t.species));

    const result: Row[] = [];

    for (const species of speciesSet) {
      const obtainedList = obtainedKillsBySpecies.get(species) || [];
      const obtainedCount = obtainedList.length;

      let avg: number | null = null;
      let best: number | null = null;
      let worst: number | null = null;

      if (obtainedList.length > 0) {
        const sum = obtainedList.reduce((a, b) => a + b, 0);
        avg = Math.round(sum / obtainedList.length);
        best = Math.min(...obtainedList);
        worst = Math.max(...obtainedList);
      }

      result.push({
        species,
        lifetimeKills: killsBySpecies.get(species) || 0,
        obtainedCount,
        lastObtainedAt: lastObtainedBySpecies.get(species) || null,
        avgKills: avg,
        bestKills: best,
        worstKills: worst,
      });
    }

    return result.sort((a, b) =>
      a.species.localeCompare(b.species)
    );
  }, [grinds, trophies]);

  if (!rows.length) {
    return (
      <div className="p-4 text-sm text-gray-400">
        No stats yet.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Lifetime Stats</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="py-2 pr-3">Species</th>
              <th className="py-2 pr-3">Lifetime Kills</th>
              <th className="py-2 pr-3">Obtained</th>
              <th className="py-2 pr-3">Last</th>
              <th className="py-2 pr-3">Avg</th>
              <th className="py-2 pr-3">Best</th>
              <th className="py-2 pr-3">Worst</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.species}
                className="border-b border-gray-800"
              >
                <td className="py-2 pr-3 font-medium">
                  {r.species}
                </td>
                <td className="py-2 pr-3">
                  {pretty(r.lifetimeKills)}
                </td>
                <td className="py-2 pr-3">
                  {pretty(r.obtainedCount)}
                </td>
                <td className="py-2 pr-3">
                  {fmtDate(r.lastObtainedAt)}
                </td>
                <td className="py-2 pr-3">
                  {pretty(r.avgKills)}
                </td>
                <td className="py-2 pr-3">
                  {pretty(r.bestKills)}
                </td>
                <td className="py-2 pr-3">
                  {pretty(r.worstKills)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
