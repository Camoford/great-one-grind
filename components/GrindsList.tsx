// components/GrindsList.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore, type Grind } from "../store";
import SessionHUD from "./SessionHUD";
import GrinderHUD from "./GrinderHUD";

type SortMode = "pinned" | "kills_desc" | "kills_asc" | "name_asc";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function clampInt(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.floor(x);
}

/**
 * PATCH: ensure session kills increment
 * - When a session is active AND species matches,
 *   increment activeSession.kills alongside grind kills
 * - Does NOT touch store.ts
 * - Prevents negatives from reducing session kills
 */
function incSessionIfActive(species: string, delta: number) {
  if (!Number.isFinite(delta) || delta <= 0) return;

  try {
    const state = useHunterStore.getState() as any;
    const active = state.activeSession;
    if (!active) return;
    if (active.species !== species) return;

    const next = clampInt((active.kills || 0) + delta);

    useHunterStore.setState((s: any) => ({
      ...s,
      activeSession: {
        ...s.activeSession,
        kills: next,
      },
    }));
  } catch {
    // never block UI
  }
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

  const showClear = Boolean(search.trim());

  function incKillsPatched(grind: Grind, delta: number) {
    incKills(grind.id, delta);
    incSessionIfActive(grind.species, delta);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-24">
      <SessionHUD />
      <GrinderHUD />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[200px] flex-1 items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species..."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            {showClear && (
              <button
                onClick={() => setSearch("")}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="pinned">Pinned</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((g) => (
          <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{g.species}</div>
              <div className="text-sm opacity-80">Kills: {pretty(g.kills)}</div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 10, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => incKillsPatched(g, n)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                >
                  +{n}
                </button>
              ))}

              {hardcoreMode && (
                <>
                  {[500, 1000].map((n) => (
                    <button
                      key={n}
                      onClick={() => incKillsPatched(g, n)}
                      className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                    >
                      +{n}
                    </button>
                  ))}
                </>
              )}

              <button
                onClick={() => resetKills(g.id)}
                className="rounded-xl bg-red-500/20 px-3 py-2 text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
