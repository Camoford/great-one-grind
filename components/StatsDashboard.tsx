// components/StatsDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * StatsDashboard — READ ONLY (POLISHED + HIGHLIGHTS + MOBILE CARDS + AUTO DEFAULT)
 * - Lifetime kills per species (from grinds)
 * - Trophy stats (from trophies)
 * - Sort + Search + Summary + Top Highlights
 * - View toggle: Table vs Cards (mobile-friendly)
 * - Auto default: Cards on small screens (until user manually toggles)
 * - No mutations, no grinder logic changes
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

type SortMode = "name" | "kills_desc" | "kills_asc" | "obtained_desc" | "last_desc";
type ViewMode = "table" | "cards";

function getPreferredView(): ViewMode {
  try {
    const w = typeof window !== "undefined" ? window.innerWidth : 9999;
    return w < 640 ? "cards" : "table"; // Tailwind sm breakpoint
  } catch {
    return "table";
  }
}

function PillButton(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={[
        "px-3 py-2 rounded-lg text-sm border",
        props.active
          ? "bg-gray-800 border-gray-600 text-white"
          : "bg-gray-950 border-gray-800 text-gray-300 hover:bg-gray-900/60",
      ].join(" ")}
      type="button"
    >
      {props.label}
    </button>
  );
}

function StatLine(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-gray-400">{props.label}</div>
      <div className="text-sm font-medium text-gray-200">{props.value}</div>
    </div>
  );
}

export default function StatsDashboard() {
  const grinds = useHunterStore((s) => s.grinds);
  const trophies = useHunterStore((s) => s.trophies);

  const [sort, setSort] = useState<SortMode>("kills_desc");
  const [search, setSearch] = useState("");

  // Auto default view: cards on small screens
  const [view, setView] = useState<ViewMode>(() => getPreferredView());
  const [autoView, setAutoView] = useState(true);

  // If autoView is enabled, keep view aligned to screen size (but stop once user manually toggles)
  useEffect(() => {
    if (!autoView) return;

    const apply = () => {
      const preferred = getPreferredView();
      setView(preferred);
    };

    apply();

    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [autoView]);

  const { rows, summary, highlights } = useMemo(() => {
    const killsBySpecies = new Map<string, number>();
    const obtainedKillsBySpecies = new Map<string, number[]>();
    const lastObtainedBySpecies = new Map<string, number>();

    // Lifetime kills (sum of grind kills by species)
    for (const g of grinds as any[]) {
      const s = g?.species || "";
      if (!s) continue;
      const k = Number(g?.kills || 0);
      killsBySpecies.set(s, (killsBySpecies.get(s) || 0) + (Number.isFinite(k) ? k : 0));
    }

    // Trophy-derived stats
    for (const t of trophies as any[]) {
      const s = t?.species || "";
      if (!s) continue;

      const list = obtainedKillsBySpecies.get(s) || [];
      if (typeof t?.killsAtObtained === "number") list.push(t.killsAtObtained);
      obtainedKillsBySpecies.set(s, list);

      if (typeof t?.obtainedAt === "number") {
        const prev = lastObtainedBySpecies.get(s) || 0;
        if (t.obtainedAt > prev) lastObtainedBySpecies.set(s, t.obtainedAt);
      }
    }

    // Union of species from grinds + trophies
    const speciesSet = new Set<string>();
    (grinds as any[]).forEach((g) => g?.species && speciesSet.add(g.species));
    (trophies as any[]).forEach((t) => t?.species && speciesSet.add(t.species));

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

    // Summary strip
    const totalLifetimeKills = result.reduce((acc, r) => acc + (r.lifetimeKills || 0), 0);
    const totalObtained = result.reduce((acc, r) => acc + (r.obtainedCount || 0), 0);
    const trackedSpecies = result.length;

    // Highlights
    const topKills =
      [...result].sort(
        (a, b) => (b.lifetimeKills - a.lifetimeKills) || a.species.localeCompare(b.species)
      )[0] || null;

    const topObtained =
      [...result].sort(
        (a, b) => (b.obtainedCount - a.obtainedCount) || (b.lifetimeKills - a.lifetimeKills)
      )[0] || null;

    const mostRecent =
      [...result].sort(
        (a, b) =>
          ((b.lastObtainedAt || 0) - (a.lastObtainedAt || 0)) || (b.obtainedCount - a.obtainedCount)
      )[0] || null;

    return {
      rows: result,
      summary: { totalLifetimeKills, totalObtained, trackedSpecies },
      highlights: { topKills, topObtained, mostRecent },
    };
  }, [grinds, trophies]);

  const filteredSorted = useMemo(() => {
    let list = [...rows];

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.species.toLowerCase().includes(q));

    const byName = (a: Row, b: Row) => a.species.localeCompare(b.species);
    const byKillsDesc = (a: Row, b: Row) => (b.lifetimeKills - a.lifetimeKills) || byName(a, b);
    const byKillsAsc = (a: Row, b: Row) => (a.lifetimeKills - b.lifetimeKills) || byName(a, b);
    const byObtainedDesc = (a: Row, b: Row) => (b.obtainedCount - a.obtainedCount) || byKillsDesc(a, b);
    const byLastDesc = (a: Row, b: Row) =>
      ((b.lastObtainedAt || 0) - (a.lastObtainedAt || 0)) || byObtainedDesc(a, b);

    switch (sort) {
      case "name":
        list.sort(byName);
        break;
      case "kills_asc":
        list.sort(byKillsAsc);
        break;
      case "obtained_desc":
        list.sort(byObtainedDesc);
        break;
      case "last_desc":
        list.sort(byLastDesc);
        break;
      case "kills_desc":
      default:
        list.sort(byKillsDesc);
        break;
    }

    return list;
  }, [rows, search, sort]);

  if (!rows.length) {
    return <div className="p-4 text-sm text-gray-400">No stats yet.</div>;
  }

  const setViewManual = (v: ViewMode) => {
    setAutoView(false);
    setView(v);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Lifetime Stats</h2>
          <div className="text-xs text-gray-400">Read-only • Derived from grinds + trophies</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search species…"
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm outline-none focus:border-gray-500"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm outline-none focus:border-gray-500"
            title="Sort"
          >
            <option value="kills_desc">Sort: Lifetime Kills ↓</option>
            <option value="kills_asc">Sort: Lifetime Kills ↑</option>
            <option value="obtained_desc">Sort: Obtained ↓</option>
            <option value="last_desc">Sort: Last Obtained ↓</option>
            <option value="name">Sort: Species A–Z</option>
          </select>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <PillButton active={view === "table"} label="Table" onClick={() => setViewManual("table")} />
        <PillButton active={view === "cards"} label="Cards" onClick={() => setViewManual("cards")} />
        <div className="text-xs text-gray-500 ml-1">
          {autoView ? "(Auto: based on screen size)" : "(Manual)"}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
          <div className="text-xs text-gray-400">Total lifetime kills</div>
          <div className="text-xl font-semibold">{pretty(summary.totalLifetimeKills)}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
          <div className="text-xs text-gray-400">Total obtained</div>
          <div className="text-xl font-semibold">{pretty(summary.totalObtained)}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
          <div className="text-xs text-gray-400">Species tracked</div>
          <div className="text-xl font-semibold">{pretty(summary.trackedSpecies)}</div>
        </div>
      </div>

      {/* Top Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
          <div className="text-xs text-gray-400">Top lifetime kills</div>
          <div className="text-base font-semibold">{highlights.topKills ? highlights.topKills.species : "—"}</div>
          <div className="text-sm text-gray-300">{highlights.topKills ? pretty(highlights.topKills.lifetimeKills) : "—"}</div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
          <div className="text-xs text-gray-400">Most obtained</div>
          <div className="text-base font-semibold">{highlights.topObtained ? highlights.topObtained.species : "—"}</div>
          <div className="text-sm text-gray-300">{highlights.topObtained ? pretty(highlights.topObtained.obtainedCount) : "—"}</div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
          <div className="text-xs text-gray-400">Most recent obtained</div>
          <div className="text-base font-semibold">{highlights.mostRecent ? highlights.mostRecent.species : "—"}</div>
          <div className="text-sm text-gray-300">{highlights.mostRecent ? fmtDate(highlights.mostRecent.lastObtainedAt) : "—"}</div>
        </div>
      </div>

      {/* Table view */}
      {view === "table" && (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-900 sticky top-0 z-10">
                <tr className="border-b border-gray-800 text-left">
                  <th className="py-3 px-3">Species</th>
                  <th className="py-3 px-3">Lifetime Kills</th>
                  <th className="py-3 px-3">Obtained</th>
                  <th className="py-3 px-3">Last</th>
                  <th className="py-3 px-3">Avg</th>
                  <th className="py-3 px-3">Best</th>
                  <th className="py-3 px-3">Worst</th>
                </tr>
              </thead>

              <tbody>
                {filteredSorted.map((r) => (
                  <tr key={r.species} className="border-b border-gray-800 hover:bg-gray-900/40">
                    <td className="py-3 px-3 font-medium whitespace-nowrap">{r.species}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{pretty(r.lifetimeKills)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{pretty(r.obtainedCount)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{fmtDate(r.lastObtainedAt)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{pretty(r.avgKills)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{pretty(r.bestKills)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{pretty(r.worstKills)}</td>
                  </tr>
                ))}

                {!filteredSorted.length && (
                  <tr>
                    <td colSpan={7} className="py-6 px-3 text-gray-400 text-center">
                      No matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-950 border-t border-gray-800">
            Showing {pretty(filteredSorted.length)} of {pretty(rows.length)} species
          </div>
        </div>
      )}

      {/* Cards view */}
      {view === "cards" && (
        <div className="space-y-2">
          {!filteredSorted.length && (
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400 text-center">
              No matches.
            </div>
          )}

          {filteredSorted.map((r) => (
            <div key={r.species} className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-base font-semibold">{r.species}</div>
                <div className="text-sm text-gray-300">
                  {pretty(r.lifetimeKills)} <span className="text-gray-500">kills</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <StatLine label="Obtained" value={pretty(r.obtainedCount)} />
                <StatLine label="Last obtained" value={fmtDate(r.lastObtainedAt)} />
                <StatLine label="Avg (kills to obtained)" value={pretty(r.avgKills)} />
                <StatLine label="Best (lowest)" value={pretty(r.bestKills)} />
                <StatLine label="Worst (highest)" value={pretty(r.worstKills)} />
              </div>
            </div>
          ))}

          <div className="text-xs text-gray-500 text-center pt-1">
            Showing {pretty(filteredSorted.length)} of {pretty(rows.length)} species
          </div>
        </div>
      )}
    </div>
  );
}
