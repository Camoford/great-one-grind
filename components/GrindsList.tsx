// components/GrindsList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore, type Grind } from "../store";
import SessionHUD from "./SessionHUD";
import GrinderHUD from "./GrinderHUD";

type SortMode = "pinned" | "kills_desc" | "kills_asc" | "name_asc";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function nextMilestone(kills: number) {
  const m = [25, 50, 100, 250, 500, 1000, 2000, 3000, 5000, 7500, 10000];
  for (const v of m) if (kills < v) return v;
  return Math.ceil((kills + 1) / 2500) * 2500;
}

function progressToNext(kills: number) {
  const target = nextMilestone(kills);
  const prev =
    target === 25
      ? 0
      : target === 50
      ? 25
      : target === 100
      ? 50
      : target === 250
      ? 100
      : target === 500
      ? 250
      : target === 1000
      ? 500
      : target === 2000
      ? 1000
      : target === 3000
      ? 2000
      : target === 5000
      ? 3000
      : target === 7500
      ? 5000
      : target === 10000
      ? 7500
      : target - 2500;

  const denom = Math.max(1, target - prev);
  const pct = clamp01((kills - prev) / denom);
  const remain = Math.max(0, target - kills);

  return { target, prev, pct, remain };
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

  const incKills = useHunterStore((s) => s.incKills);
  const resetKills = useHunterStore((s) => s.resetKills);
  const setFur = useHunterStore((s) => s.setFur);
  const setNotes = useHunterStore((s) => s.setNotes);
  const setObtained = useHunterStore((s) => s.setObtained);
  const addTrophy = useHunterStore((s) => s.addTrophy);
  const createAutoBackup = useHunterStore((s) => s.createAutoBackup);

  // Undo (P1)
  const undo = useHunterStore((s) => s.undo);
  const canUndo = useHunterStore((s) => s.canUndo);
  const undoLastAction = useHunterStore((s) => s.undoLastAction);
  const clearUndo = useHunterStore((s) => s.clearUndo);

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("pinned");

  // Grinder-first defaults
  const [compactMode, setCompactMode] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Toast countdown
  const [undoMsLeft, setUndoMsLeft] = useState(0);

  // Button tap feedback
  const [pulseKey, setPulseKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...grinds];

    if (q) {
      list = list.filter((g) => g.species.toLowerCase().includes(q));
    }

    switch (sortMode) {
      case "kills_desc":
        list.sort((a, b) => (b.kills || 0) - (a.kills || 0));
        break;
      case "kills_asc":
        list.sort((a, b) => (a.kills || 0) - (b.kills || 0));
        break;
      case "name_asc":
        list.sort((a, b) => a.species.localeCompare(b.species));
        break;
      case "pinned":
      default:
        // keep natural order from store (your pinned 9 are already in order)
        break;
    }

    return list;
  }, [grinds, query, sortMode]);

  const positiveButtons = compactMode ? [1, 10, 50, 100] : [1, 5, 10, 25, 50, 100];
  const hardcorePosButtons = [500, 1000];
  const hardcoreNegButtons = [-1, -10, -50, -100];

  // Drive the undo countdown based on store undo.expiresAt
  useEffect(() => {
    const active = canUndo();
    if (!active || !undo?.expiresAt) {
      setUndoMsLeft(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, undo.expiresAt - Date.now());
      setUndoMsLeft(left);
      if (left <= 0) {
        clearUndo();
      }
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [undo?.expiresAt, undo?.armedAt, canUndo, clearUndo]);

  const showUndo = canUndo() && undoMsLeft > 0;
  const undoProgress = clamp01(undoMsLeft / 8000);

  const handleUndo = () => {
    const res = undoLastAction();
    if (!res.ok) return;
  };

  const handleDismissUndo = () => {
    clearUndo();
  };

  const pulse = (key: string) => {
    setPulseKey(key);
    window.setTimeout(() => {
      setPulseKey((prev) => (prev === key ? null : prev));
    }, 160);
  };

  const handleObtained = (g: Grind) => {
    const confirmed = window.confirm(
      `Mark OBTAINED for ${g.species}?\n\nThis will:\n• Add a trophy\n• Reset kills to 0\n\nContinue?`
    );
    if (!confirmed) return;

    addTrophy({
      species: g.species,
      fur: (g.fur || "").trim(),
      notes: (g.notes || "").trim(),
    });

    resetKills(g.id);
    setObtained(g.id, true);

    createAutoBackup("Obtained confirmed (Grinds)");
  };

  const handleUnobtained = (g: Grind) => {
    const confirmed = window.confirm(
      `Unmark OBTAINED for ${g.species}?\n\nThis will NOT delete trophies.\nContinue?`
    );
    if (!confirmed) return;
    setObtained(g.id, false);
    createAutoBackup("Obtained unmarked (Grinds)");
  };

  const handleResetConfirm = (g: Grind) => {
    const confirmed = window.confirm(
      `Reset kills for ${g.species} back to 0?\n\nYou can Undo for a few seconds after resetting.\nContinue?`
    );
    if (!confirmed) return;
    resetKills(g.id);
    createAutoBackup("Kills reset (Grinds)");
  };

  const handleInc = (g: Grind, delta: number) => {
    pulse(`${g.id}_${delta}`);
    incKills(g.id, delta);
  };

  return (
    <div className="space-y-3 px-2 pb-2">
      {/* ✅ Locked: SessionHUD above everything */}
      <div className="sticky top-0 z-[999]">
        <SessionHUD />
      </div>

      {/* Tiny spacer below sticky bar */}
      <div className="pt-2" />

      {/* Grinder HUD panels */}
      <GrinderHUD />

      {/* Undo Toast (P1) */}
      {showUndo && (
        <div className="sticky top-2 z-50">
          <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur px-4 py-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Undo available</div>
                <div className="text-xs text-white/70 truncate">
                  {undo?.label || "Last action"}
                </div>

                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/40"
                    style={{ width: `${Math.round(undoProgress * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                  title="Undo the last action"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleDismissUndo}
                  className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-1 text-[11px] text-white/50">
              {Math.max(1, Math.ceil(undoMsLeft / 1000))}s left
            </div>
          </div>
        </div>
      )}

      {/* Grinder-first header + controls (compact) */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Grinds</h2>
              {hardcoreMode && (
                <span className="rounded-full border border-orange-400/30 bg-orange-500/15 px-2 py-0.5 text-xs">
                  🔥 HARDCORE
                </span>
              )}
            </div>
            <div className="text-xs text-white/60">
              Grinder-first layout {compactMode ? "• Compact ON" : "• Compact OFF"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompactMode((v) => !v)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              title="Toggle compact grinder layout"
            >
              {compactMode ? "Compact: ON" : "Compact: OFF"}
            </button>

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              title="Show/hide extra controls"
            >
              {showDetails ? "Details: ON" : "Details: OFF"}
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <div className="text-[11px] text-white/60 mb-1">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a species name…"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="text-[11px] text-white/60 mb-1">Sort</div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
            >
              <option value="pinned">Pinned Order</option>
              <option value="kills_desc">Kills (High → Low)</option>
              <option value="kills_asc">Kills (Low → High)</option>
              <option value="name_asc">Species (A → Z)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
              />
              <span className="text-sm">Notes</span>
            </label>

            {!hardcoreMode && (
              <div className="ml-auto text-[11px] text-white/55">
                Hardcore Mode unlocks - buttons + +500/+1000 + reset.
              </div>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/70">
              Details are optional. Keep OFF for max grinder focus.
            </div>
            <div className="mt-1 text-[11px] text-white/60">
              (This does not change Hardcore behavior — visual only.)
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((g) => {
          const kills = g.kills || 0;
          const { target, pct, remain } = progressToNext(kills);

          return (
            <div
              key={g.id}
              className={[
                "rounded-2xl border border-white/10 bg-white/5",
                compactMode ? "p-3" : "p-4",
              ].join(" ")}
            >
              {/* Top row: identity + kills */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={compactMode ? "text-base font-semibold" : "text-lg font-semibold"}>
                      {g.species}
                    </div>

                    {g.obtained && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs">
                        OBTAINED
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-xs text-white/60">Kills</div>
                    <div className="text-2xl font-bold leading-none">{pretty(kills)}</div>
                    <div className="ml-2 text-xs text-white/55">
                      Next: <span className="text-white/80 font-semibold">{pretty(target)}</span>{" "}
                      <span className="text-white/45">({pretty(remain)} left)</span>
                    </div>
                  </div>

                  {/* Progress bar always visible */}
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-white/35" style={{ width: `${Math.round(pct * 100)}%` }} />
                  </div>
                </div>

                {/* Actions (kept small + clean) */}
                <div className="flex flex-col items-end gap-2">
                  {!g.obtained ? (
                    <button
                      type="button"
                      onClick={() => handleObtained(g)}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm hover:bg-emerald-500/20"
                    >
                      Obtained
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUnobtained(g)}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                    >
                      Unmark
                    </button>
                  )}

                  {hardcoreMode && (
                    <button
                      type="button"
                      onClick={() => handleResetConfirm(g)}
                      className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm hover:bg-red-500/20"
                      title="Reset kills (Hardcore only)"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Quick controls: always grinder-first */}
              <div className={compactMode ? "mt-3" : "mt-4"}>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-2">
                  <div className="flex flex-wrap gap-2">
                    {positiveButtons.map((n) => {
                      const k = `${g.id}_${n}`;
                      const pulsing = pulseKey === k;
                      return (
                        <button
                          key={`pos_${g.id}_${n}`}
                          type="button"
                          onClick={() => handleInc(g, n)}
                          className={[
                            "rounded-xl border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15",
                            pulsing ? "scale-[1.03]" : "",
                            "transition-transform duration-150",
                          ].join(" ")}
                        >
                          +{n}
                        </button>
                      );
                    })}

                    {hardcoreMode &&
                      hardcorePosButtons.map((n) => {
                        const k = `${g.id}_${n}`;
                        const pulsing = pulseKey === k;
                        return (
                          <button
                            key={`poshard_${g.id}_${n}`}
                            type="button"
                            onClick={() => handleInc(g, n)}
                            className={[
                              "rounded-xl border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15",
                              pulsing ? "scale-[1.03]" : "",
                              "transition-transform duration-150",
                            ].join(" ")}
                          >
                            +{pretty(n)}
                          </button>
                        );
                      })}
                  </div>

                  {hardcoreMode && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hardcoreNegButtons.map((n) => {
                        const k = `${g.id}_${n}`;
                        const pulsing = pulseKey === k;
                        return (
                          <button
                            key={`neg_${g.id}_${n}`}
                            type="button"
                            onClick={() => handleInc(g, n)}
                            className={[
                              "rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm hover:bg-white/10",
                              pulsing ? "scale-[1.03]" : "",
                              "transition-transform duration-150",
                            ].join(" ")}
                            title="Subtract kills (Hardcore only)"
                          >
                            {n}
                          </button>
                        );
                      })}
                      <div className="text-[11px] text-white/50 self-center ml-1">
                        (won’t go below 0)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details (optional) */}
              {(showNotes || showDetails) && (
                <div className={compactMode ? "mt-3" : "mt-4"}>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <div className="text-[11px] text-white/60 mb-1">Fur / Variant</div>
                      <input
                        value={g.fur || ""}
                        onChange={(e) => setFur(g.id, e.target.value)}
                        placeholder="e.g., Albino / Piebald / Melanistic / etc."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                      />
                    </div>

                    {showNotes && (
                      <div>
                        <div className="text-[11px] text-white/60 mb-1">Notes</div>
                        <input
                          value={g.notes || ""}
                          onChange={(e) => setNotes(g.id, e.target.value)}
                          placeholder="Optional notes…"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                        />
                      </div>
                    )}
                  </div>

                  {showDetails && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-white/55">
                        Pro tip: Keep Details OFF for speed.
                      </div>
                      <div className="text-[11px] text-white/45">
                        Next milestone progress stays visible even in Compact.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            No matches. Try clearing search.
          </div>
        )}
      </div>
    </div>
  );
}
