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
    <div className="p-3 space-y-3 text-neutral-100">
      <SessionHUD />

      {/* Sticky controls (DARK-SAFE) */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pt-2 pb-2 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
            placeholder="Search species…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="pinned">Pinned</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
          <div>{filtered.length} shown</div>
          <div>{hardcoreMode ? "Hardcore: ON" : "Hardcore: OFF"}</div>
        </div>
      </div>

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
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4 space-y-2.5 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate text-neutral-100">
            {grind.species}
          </div>

          <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
            <span>Total: {pretty(grind.kills)}</span>
            <span className="text-neutral-600">•</span>
            <span>{hardcoreMode ? "Hardcore layout" : "Simple layout"}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] text-neutral-400">Kills</div>
          <div className="text-lg font-bold leading-none text-neutral-100">
            {pretty(grind.kills)}
          </div>
        </div>
      </div>

      {/* Insights (DARK-SAFE wrapper) */}
      <div className="rounded-xl border border-white/10 bg-black/25 p-2 sm:p-3">
        <GrinderHUD species={grind.species} />
      </div>

      {/* Buttons */}
      {!hardcoreMode ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-2 sm:p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-2">
            Add Kills
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[1, 10, 50, 100].map((n) => (
              <PrimaryBtn
                key={n}
                label={`+${n}`}
                onClick={() => incKills(grind.id, n)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* ADD KILLS — dominant */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-2 sm:p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-200">
                Add Kills
              </div>
              <div className="text-[11px] text-neutral-500">Main</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[1, 10, 50, 100].map((n) => (
                <PrimaryBtn
                  key={n}
                  label={`+${n}`}
                  onClick={() => incKills(grind.id, n)}
                />
              ))}
            </div>

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

          {/* FIX MISTAKE — tucked away */}
          <details className="rounded-xl border border-white/10 bg-black/15 overflow-hidden">
            <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Fix Mistake
                </span>
                <span className="text-[11px] text-neutral-500">(tap)</span>
              </div>
              <span className="text-[12px] text-neutral-500">▼</span>
            </summary>

            <div className="px-3 pb-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {[-1, -10, -50, -100].map((n) => (
                  <MutedBtn
                    key={n}
                    label={`${n}`}
                    onClick={() => incKills(grind.id, n)}
                  />
                ))}
              </div>
            </div>
          </details>

          {/* Reset */}
          <button
            onClick={() => resetKills(grind.id)}
            className="w-full rounded-xl border border-white/10 bg-black/15 py-3 text-xs font-semibold text-neutral-300 active:scale-[0.99]"
          >
            Reset Kills
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Buttons ---------------- */

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/35 py-3 text-sm font-extrabold text-neutral-100 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function PowerBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/50 py-3 text-sm font-black text-neutral-100 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function MutedBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-semibold text-neutral-200 opacity-90 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
