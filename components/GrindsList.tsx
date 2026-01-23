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
        // pinned order = as-is
        break;
    }

    return list;
  }, [grinds, sort, search]);

  const showClear = Boolean(search.trim());

  return (
    <div className="mx-auto w-full max-w-4xl px-3 pb-24 space-y-4">
      {/* Session HUD */}
      <div>
        <SessionHUD />
      </div>

      {/* Grinder HUD (visual / insights) */}
      <div>
        <GrinderHUD />
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species…"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            {showClear ? (
              <button
                onClick={() => setSearch("")}
                className="shrink-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-white/10"
                title="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>

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

        <div className="mt-2 text-xs text-white/60">
          Showing <span className="text-white/90 font-semibold">{pretty(filtered.length)}</span>{" "}
          grind(s)
          <span className="text-white/30"> • </span>
          Mode:{" "}
          <span className={hardcoreMode ? "text-amber-200 font-semibold" : "text-white/80"}>
            {hardcoreMode ? "Hardcore" : "Simple"}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          No grinds match your search.
        </div>
      ) : null}

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <div className="font-semibold text-white truncate">{grind.species}</div>
            <div className="text-xs text-white/60">
              • Kills: <span className="text-white/90 font-semibold">{pretty(grind.kills)}</span>
            </div>
          </div>

          {hardcore ? (
            <div className="mt-1 text-[11px] text-amber-200/80">
              Hardcore: quick adds unlocked
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-white/50">Simple mode</div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => incKills(grind.id, 1)}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            title="Add 1 kill"
          >
            +1
          </button>

          {hardcore ? (
            <>
              <button
                onClick={() => incKills(grind.id, 10)}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                title="Add 10 kills"
              >
                +10
              </button>
              <button
                onClick={() => incKills(grind.id, 100)}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                title="Add 100 kills"
              >
                +100
              </button>
            </>
          ) : null}

          <button
            onClick={() => resetKills(grind.id)}
            className="rounded-xl bg-red-500/20 px-3 py-2 text-sm hover:bg-red-500/30"
            title="Reset kills for this grind"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
