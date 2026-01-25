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

/**
 * Clamp grind kills so we never go below 0 when applying negative deltas.
 * We do this in the UI layer WITHOUT touching store.ts.
 */
function safeDeltaForGrind(grind: Grind, delta: number) {
  const d = clampInt(delta);
  if (d >= 0) return d;
  const next = (grind.kills || 0) + d;
  if (next >= 0) return d;
  return -Math.max(0, clampInt(grind.kills || 0));
}

function hasActiveSession() {
  try {
    const s = useHunterStore.getState() as any;
    return !!s.activeSession;
  } catch {
    return false;
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
        list.sort((a, b) => (b.kills || 0) - (a.kills || 0));
        break;
      case "kills_asc":
        list.sort((a, b) => (a.kills || 0) - (b.kills || 0));
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
    const safe = safeDeltaForGrind(grind, delta);
    if (!safe) return;

    incKills(grind.id, safe);

    // Only increments session kills on POSITIVE deltas (by design)
    if (safe > 0) incSessionIfActive(grind.species, safe);
  }

  function confirmReset(grind: Grind) {
    const tip = hardcoreMode
      ? "Tip: In Hardcore Mode you can fix mistakes with -1 / -10 / -50 / -100."
      : "Tip: Turn on Hardcore Mode (PRO) to get take-back buttons.";
    const ok = window.confirm(`Reset kills for ${grind.species} back to 0?\n\n${tip}`);
    if (!ok) return;

    // If resetting the active session species, we keep session patch safe:
    // session kills are tracked separately; this reset only affects grind kills.
    resetKills(grind.id);
  }

  const headerNote = hardcoreMode
    ? "Hardcore ON: negatives + +500/+1000 + reset"
    : "Hardcore OFF: clean +1/+10/+50/+100";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-24">
      <SessionHUD />
      <GrinderHUD />

      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
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
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-white/10"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            title="Sort"
          >
            <option value="pinned">Pinned</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>

        <div className="text-xs text-white/55 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5">
            {headerNote}
          </span>
          {hasActiveSession() ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-100">
              Session active
            </span>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.map((g) => (
          <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{g.species}</div>

                {!hardcoreMode ? (
                  <div className="text-xs text-white/55">
                    Tip: turn on <span className="font-semibold text-white/70">Hardcore Mode</span> for take-back buttons
                  </div>
                ) : (
                  <div className="text-xs text-white/55">
                    Tip: negatives never drop below <span className="font-semibold text-white/70">0</span>
                  </div>
                )}
              </div>

              <div className="text-sm opacity-80 shrink-0">Kills: {pretty(g.kills || 0)}</div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {/* Hardcore-only take-back buttons */}
              {hardcoreMode ? (
                <>
                  {[-1, -10, -50, -100].map((n) => (
                    <button
                      key={n}
                      onClick={() => incKillsPatched(g, n)}
                      className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                      title="Remove kills (won't go below 0)"
                    >
                      {n}
                    </button>
                  ))}
                </>
              ) : null}

              {/* Positive buttons always */}
              {[1, 10, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => incKillsPatched(g, n)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                >
                  +{n}
                </button>
              ))}

              {/* Hardcore-only big jumps */}
              {hardcoreMode ? (
                <>
                  {[500, 1000].map((n) => (
                    <button
                      key={n}
                      onClick={() => incKillsPatched(g, n)}
                      className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                      title="Big jump (Hardcore)"
                    >
                      +{n}
                    </button>
                  ))}
                </>
              ) : null}

              {/* Reset (Hardcore only) */}
              {hardcoreMode ? (
                <button
                  onClick={() => confirmReset(g)}
                  className="rounded-xl bg-red-500/20 px-3 py-2 text-sm hover:bg-red-500/25"
                  title="Reset this species to 0"
                >
                  Reset Kills
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
