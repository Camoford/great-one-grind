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
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-24">
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
          <div className="flex min-w-[200px] flex-1 items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species…"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
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
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none hover:bg-white/10 focus:border-white/20"
          >
            <option value="pinned">Pinned order</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
          <div>
            Showing <span className="font-semibold text-white/90">{pretty(filtered.length)}</span> grind(s)
          </div>

          <span className="text-white/30">•</span>

          <div>
            Mode:{" "}
            <span className={hardcoreMode ? "font-semibold text-amber-200" : "text-white/80"}>
              {hardcoreMode ? "Hardcore" : "Simple"}
            </span>
          </div>

          {hardcoreMode ? (
            <>
              <span className="text-white/30">•</span>
              <div className="text-amber-200/80">Negatives + big jumps + reset confirm enabled</div>
            </>
          ) : null}
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
          <GrindRow key={g.id} grind={g} incKills={incKills} resetKills={resetKills} hardcore={hardcoreMode} />
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
  const [resetArmed, setResetArmed] = useState(false);

  function doReset() {
    if (!hardcore) {
      resetKills(grind.id);
      return;
    }

    if (!resetArmed) {
      setResetArmed(true);
      return;
    }

    resetKills(grind.id);
    setResetArmed(false);
  }

  function cancelReset() {
    setResetArmed(false);
  }

  function bClass(kind: "pos" | "neg" | "warn" | "ghost") {
    if (kind === "warn") {
      return resetArmed
        ? "rounded-xl border border-amber-200/30 bg-amber-500/20 px-3 py-2 text-sm hover:bg-amber-500/25"
        : "rounded-xl bg-red-500/20 px-3 py-2 text-sm hover:bg-red-500/30";
    }
    if (kind === "neg") {
      return "rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm hover:bg-white/10";
    }
    if (kind === "ghost") {
      return "rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-white/10";
    }
    return "rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15";
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <div className="truncate font-semibold text-white">{grind.species}</div>
            <div className="text-xs text-white/60">
              • Kills: <span className="font-semibold text-white/90">{pretty(grind.kills)}</span>
            </div>
          </div>

          {hardcore ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-amber-200/80">
              <span className="rounded-full border border-amber-200/20 bg-amber-500/10 px-2 py-0.5">
                Hardcore
              </span>
              <span className="text-white/35">•</span>
              <span>- / + quick taps</span>
              <span className="text-white/35">•</span>
              <span>big jumps</span>
              <span className="text-white/35">•</span>
              <span>reset confirm</span>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-white/50">Simple mode: clean quick adds</div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {/* SIMPLE: +1 +10 +50 +100 */}
          {!hardcore ? (
            <>
              <button onClick={() => incKills(grind.id, 1)} className={bClass("pos")} title="Add 1 kill">
                +1
              </button>
              <button onClick={() => incKills(grind.id, 10)} className={bClass("pos")} title="Add 10 kills">
                +10
              </button>
              <button onClick={() => incKills(grind.id, 50)} className={bClass("pos")} title="Add 50 kills">
                +50
              </button>
              <button onClick={() => incKills(grind.id, 100)} className={bClass("pos")} title="Add 100 kills">
                +100
              </button>

              <button onClick={() => resetKills(grind.id)} className={bClass("warn")} title="Reset kills for this grind">
                Reset
              </button>
            </>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {/* Row 1: Negatives + core adds */}
              <div className="flex flex-wrap justify-end gap-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => incKills(grind.id, -1)} className={bClass("neg")} title="Subtract 1 kill">
                    -1
                  </button>
                  <button onClick={() => incKills(grind.id, -10)} className={bClass("neg")} title="Subtract 10 kills">
                    -10
                  </button>
                  <button onClick={() => incKills(grind.id, -50)} className={bClass("neg")} title="Subtract 50 kills">
                    -50
                  </button>
                  <button onClick={() => incKills(grind.id, -100)} className={bClass("neg")} title="Subtract 100 kills">
                    -100
                  </button>
                </div>

                <div className="hidden h-9 w-px self-center bg-white/10 sm:block" />

                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => incKills(grind.id, 1)} className={bClass("pos")} title="Add 1 kill">
                    +1
                  </button>
                  <button onClick={() => incKills(grind.id, 10)} className={bClass("pos")} title="Add 10 kills">
                    +10
                  </button>
                  <button onClick={() => incKills(grind.id, 50)} className={bClass("pos")} title="Add 50 kills">
                    +50
                  </button>
                  <button onClick={() => incKills(grind.id, 100)} className={bClass("pos")} title="Add 100 kills">
                    +100
                  </button>
                </div>
              </div>

              {/* Row 2: Big jumps + Reset */}
              <div className="flex flex-wrap justify-end gap-2">
                <span className="hidden select-none self-center text-xs text-white/30 sm:inline">Big:</span>

                <button onClick={() => incKills(grind.id, 500)} className={bClass("pos")} title="Add 500 kills">
                  +500
                </button>
                <button onClick={() => incKills(grind.id, 1000)} className={bClass("pos")} title="Add 1000 kills">
                  +1000
                </button>

                <div className="hidden h-9 w-px self-center bg-white/10 sm:block" />

                {!resetArmed ? (
                  <button onClick={doReset} className={bClass("warn")} title="Reset kills (requires confirm)">
                    Reset
                  </button>
                ) : (
                  <>
                    <button onClick={doReset} className={bClass("warn")} title="Confirm reset kills">
                      Confirm
                    </button>
                    <button onClick={cancelReset} className={bClass("ghost")} title="Cancel reset">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
