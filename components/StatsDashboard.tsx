// components/StatsDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

type SortKey = "kills_desc" | "kills_asc" | "species_asc";

const UI_KEY = "greatonegrind_stats_ui_v1";

type UiPrefs = {
  search: string;
  sort: SortKey;
  view: "cards" | "table" | "auto";
};

function loadPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) throw new Error();
    return { search: "", sort: "kills_desc", view: "auto", ...JSON.parse(raw) };
  } catch {
    return { search: "", sort: "kills_desc", view: "auto" };
  }
}

function savePrefs(prefs: UiPrefs) {
  localStorage.setItem(UI_KEY, JSON.stringify(prefs));
}

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

export default function StatsDashboard() {
  const grinds = useHunterStore((s) => s.grinds);
  const trophies = useHunterStore((s) => s.trophies);

  const [prefs, setPrefs] = useState<UiPrefs>(() => loadPrefs());

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  /* ---------- derived stats ---------- */

  const rows = useMemo(() => {
    const map = new Map<
      string,
      { kills: number; obtained: number; lastAt: number | null }
    >();

    for (const g of grinds) {
      map.set(g.species, {
        kills: g.kills || 0,
        obtained: 0,
        lastAt: null,
      });
    }

    for (const t of trophies) {
      const r = map.get(t.species);
      if (!r) continue;
      r.obtained += 1;
      r.lastAt = Math.max(r.lastAt || 0, t.obtainedAt || 0);
    }

    let list = Array.from(map.entries()).map(([species, v]) => ({
      species,
      kills: v.kills,
      obtained: v.obtained,
      lastAt: v.lastAt,
    }));

    if (prefs.search.trim()) {
      const q = prefs.search.toLowerCase();
      list = list.filter((r) => r.species.toLowerCase().includes(q));
    }

    switch (prefs.sort) {
      case "kills_asc":
        list.sort((a, b) => a.kills - b.kills);
        break;
      case "species_asc":
        list.sort((a, b) => a.species.localeCompare(b.species));
        break;
      default:
        list.sort((a, b) => b.kills - a.kills);
    }

    return list;
  }, [grinds, trophies, prefs.search, prefs.sort]);

  /* ---------- view logic ---------- */

  const isMobile = window.innerWidth < 640;
  const effectiveView =
    prefs.view === "auto" ? (isMobile ? "cards" : "table") : prefs.view;

  /* ---------- actions ---------- */

  function clearFilters() {
    localStorage.removeItem(UI_KEY);
    setPrefs({ search: "", sort: "kills_desc", view: "auto" });
  }

  /* ---------- render ---------- */

  return (
    <div className="p-3 space-y-3">
      {/* Sticky controls */}
      <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-700 p-2 space-y-2">
        <div className="flex gap-2">
          <input
            className="flex-1 px-2 py-1 rounded bg-neutral-800 border border-neutral-700"
            placeholder="Search species…"
            value={prefs.search}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, search: e.target.value }))
            }
          />

          <button
            onClick={clearFilters}
            className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
            title="Clear search, sort, and view preferences"
          >
            Clear Filters
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700"
            value={prefs.sort}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, sort: e.target.value as SortKey }))
            }
          >
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="species_asc">Species A–Z</option>
          </select>

          <select
            className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700"
            value={prefs.view}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                view: e.target.value as UiPrefs["view"],
              }))
            }
          >
            <option value="auto">Auto</option>
            <option value="cards">Cards</option>
            <option value="table">Table</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {effectiveView === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map((r) => (
            <div
              key={r.species}
              className="rounded border border-neutral-700 bg-neutral-800 p-3"
            >
              <div className="font-semibold">{r.species}</div>
              <div className="text-sm text-neutral-300">
                Kills: {pretty(r.kills)}
              </div>
              <div className="text-sm text-neutral-300">
                Obtained: {r.obtained}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left p-2">Species</th>
              <th className="text-right p-2">Kills</th>
              <th className="text-right p-2">Obtained</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.species} className="border-b border-neutral-800">
                <td className="p-2">{r.species}</td>
                <td className="p-2 text-right">{pretty(r.kills)}</td>
                <td className="p-2 text-right">{r.obtained}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
