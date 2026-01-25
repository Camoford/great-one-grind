// components/GrindsList.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore, type Grind } from "../store";
import SessionHUD from "./SessionHUD";
import GrinderHUD from "./GrinderHUD";

type SortMode = "pinned" | "kills_desc" | "kills_asc" | "name_asc";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

  const incKills = useHunterStore((s) => s.incKills);
  const resetKills = useHunterStore((s) => s.resetKills);

  const [sort, setSort] = useState<SortMode>("pinned");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...grinds];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) =>
        g.species.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "kills_desc":
        list.sort((a, b) => b.kills - a.kills);
        break;
      case "kills_asc":
        list.sort((a, b) => a.kills - b.kills);
        break;
      case "name_asc":
        list.sort((a, b) => a.species.localeCompare(b.species));
        break;
      default:
        list.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }

    return list;
  }, [grinds, search, sort]);

  return (
    <div className="p-3 space-y-3">
      <SessionHUD />

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1"
          placeholder="Search species…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded border px-2 py-1"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
        >
          <option value="pinned">Pinned</option>
          <option value="kills_desc">Kills ↓</option>
          <option value="kills_asc">Kills ↑</option>
          <option value="name_asc">Name A–Z</option>
        </select>
      </div>

      {filtered.map((g) => (
        <GrindCard
          key={g.id}
          grind={g}
          hardcoreMode={hardcoreMode}
          incKills={incKills}
          resetKills={resetKills}
        />
      ))}
    </div>
  );
}

/* ---------------- Grind Card ---------------- */

function GrindCard({
  grind,
  hardcoreMode,
  incKills,
  resetKills,
}: {
  grind: Grind;
  hardcoreMode: boolean;
  incKills: (id: string, delta: number) => void;
  resetKills: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border p-3 space-y-3">
      <div className="flex justify-between items-center">
        <div className="font-semibold">{grind.species}</div>
        <div className="text-sm opacity-70">
          {pretty(grind.kills)} kills
        </div>
      </div>

      <GrinderHUD species={grind.species} />

      {/* ---- BUTTON ZONE ---- */}
      {!hardcoreMode && (
        <div className="grid grid-cols-4 gap-2">
          {[1, 10, 50, 100].map((n) => (
            <button
              key={n}
              onClick={() => incKills(grind.id, n)}
              className="rounded-lg border py-2 font-semibold"
            >
              +{n}
            </button>
          ))}
        </div>
      )}

      {hardcoreMode && (
        <div className="space-y-3">
          {/* FIX MISTAKE */}
          <div>
            <div className="text-xs uppercase opacity-60 mb-1">
              Fix Mistake
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[-1, -10, -50, -100].map((n) => (
                <button
                  key={n}
                  onClick={() => incKills(grind.id, n)}
                  className="rounded-lg border py-2 text-sm opacity-80"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* ADD KILLS */}
          <div>
            <div className="text-xs uppercase opacity-60 mb-1">
              Add Kills
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 10, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => incKills(grind.id, n)}
                  className="rounded-lg border py-2 font-semibold"
                >
                  +{n}
                </button>
              ))}
              {[500, 1000].map((n) => (
                <button
                  key={n}
                  onClick={() => incKills(grind.id, n)}
                  className="rounded-lg border py-2 font-semibold col-span-2"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* RESET */}
          <button
            onClick={() => resetKills(grind.id)}
            className="w-full rounded-lg border py-2 text-xs opacity-60"
          >
            Reset Kills
          </button>
        </div>
      )}
    </div>
  );
}
