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
        list.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }

    return list;
  }, [grinds, search, sort]);

  return (
    <div className="p-3 space-y-3">
      <SessionHUD />

      {/* Sticky controls */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pt-2 pb-2 bg-white/90 backdrop-blur border-b">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
            placeholder="Search species…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="pinned">Pinned</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>

        {/* Micro status line (UI-only) */}
        <div className="mt-2 flex items-center justify-between text-[11px] opacity-60">
          <div>{filtered.length} shown</div>
          <div>{hardcoreMode ? "Hardcore: ON" : "Hardcore: OFF"}</div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
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
    <div className="rounded-2xl border p-3 sm:p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">{grind.species}</div>
          <div className="text-xs opacity-60 mt-0.5">
            Total kills: {pretty(grind.kills)}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] opacity-60">Kills</div>
          <div className="text-lg font-bold leading-none">{pretty(grind.kills)}</div>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-xl border bg-white/50 p-2 sm:p-3">
        <GrinderHUD species={grind.species} />
      </div>

      {/* Buttons */}
      {!hardcoreMode ? (
        <div className="rounded-xl border p-2 sm:p-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 10, 50, 100].map((n) => (
              <PrimaryBtn key={n} label={`+${n}`} onClick={() => incKills(grind.id, n)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Fix Mistake (muted) */}
          <div className="rounded-xl border p-2 sm:p-3 bg-black/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Fix Mistake
              </div>
              <div className="text-[11px] opacity-50">Corrective</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[-1, -10, -50, -100].map((n) => (
                <MutedBtn
                  key={n}
                  label={`${n}`}
                  onClick={() => incKills(grind.id, n)}
                />
              ))}
            </div>
          </div>

          {/* Add Kills (primary) */}
          <div className="rounded-xl border p-2 sm:p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide">
                Add Kills
              </div>
              <div className="text-[11px] opacity-50">Grinding</div>
            </div>

            {/* Core row */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 10, 50, 100].map((n) => (
                <PrimaryBtn
                  key={n}
                  label={`+${n}`}
                  onClick={() => incKills(grind.id, n)}
                />
              ))}
            </div>

            {/* Power row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[500, 1000].map((n) => (
                <PowerBtn
                  key={n}
                  label={`+${n}`}
                  onClick={() => incKills(grind.id, n)}
                />
              ))}
            </div>
          </div>

          {/* Reset (separate, clearly not part of grinding) */}
          <button
            onClick={() => resetKills(grind.id)}
            className="w-full rounded-xl border py-3 text-xs font-semibold opacity-70 active:scale-[0.99]"
          >
            Reset Kills
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Buttons ---------------- */

function PrimaryBtn({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border py-3 text-sm font-bold bg-black/[0.03] active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function PowerBtn({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border py-3 text-sm font-extrabold bg-black/[0.06] active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function MutedBtn({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border py-3 text-sm font-semibold opacity-80 bg-white active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
