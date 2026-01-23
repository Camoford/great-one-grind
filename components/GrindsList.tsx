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
      list = list.filter((g) => g.species.toLowerCase().includes(q));
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
        break;
    }

    return list;
  }, [grinds, sort, search]);

  return (
    <div className="mx-auto w-full max-w-4xl px-3 pb-24">
      {/* 🔑 RESTORED: Session HUD */}
      <div className="mb-4">
        <SessionHUD />
      </div>

      {/* Grinder HUD (visual / insights) */}
      <div className="mb-4">
        <GrinderHUD />
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search species…"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        >
          <option value="pinned">Pinned order</option>
          <option value="kills_desc">Kills ↓</option>
          <option value="kills_asc">Kills ↑</option>
          <option value="name_asc">Name A–Z</option>
        </select>
      </div>

      {/* Grinds */}
      <div className="flex flex-col gap-3">
        {filtered.map((g) => (
          <GrindRow
            key={g.id}
            grind={g}
            incKills={incKills}
            resetKills={resetKills}
            hardcore={hardcoreMode}
          />
        ))}
      </div>
    </div>
  );
}

function GrindRow({
  grind,
  incKills,
  resetKills,
  hardcore,
}: {
  grind: Grind;
  incKills: (id: string, delta: number) => void;
  resetKills: (id: string) => void;
  hardcore: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{grind.species}</div>
          <div className="text-xs opacity-70">
            Kills: {pretty(grind.kills)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => incKills(grind.id, 1)}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
          >
            +1
          </button>

          {hardcore && (
            <>
              <button
                onClick={() => incKills(grind.id, 10)}
                className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
              >
                +10
              </button>
              <button
                onClick={() => incKills(grind.id, 100)}
                className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
              >
                +100
              </button>
            </>
          )}

          <button
            onClick={() => resetKills(grind.id)}
            className="rounded-lg bg-red-500/20 px-3 py-1 text-sm hover:bg-red-500/30"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
