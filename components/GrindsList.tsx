// components/GrindsList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore, type Grind } from "../store";
import SessionHUD from "./SessionHUD";
import GrinderHUD from "./GrinderHUD";

type SortMode = "pinned" | "kills_desc" | "kills_asc" | "name_asc";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function ProLockPill() {
  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">
      PRO
    </span>
  );
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

  // NOTE: Phase 4 prep added isPro + test toggle, but the exact test key name can vary.
  // We read them defensively to avoid breaking builds across small naming differences.
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore((s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)) || false;

  const proEnabled = isPro || isProTest;

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

  const activeSession = useHunterStore((s) => s.activeSession);

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

  // Hardcore controls are PRO-gated.
  // FREE users can still grind normally (+1/+10/+50/+100).
  const hardcoreEnabled = proEnabled ? hardcoreMode : false;

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

  return (
    <div className="space-y-4 px-2">
      {/* Grinder HUD at top */}
      <GrinderHUD />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Grinds</h2>
            {proEnabled ? <ProLockPill /> : null}
          </div>

          <div className="text-sm text-white/60">
            {hardcoreEnabled ? (
              <>
                Hardcore Mode ON <span className="text-white/40">— PRO controls enabled</span>
              </>
            ) : (
              <>
                Hardcore Mode OFF{" "}
                <span className="text-white/40">
                  — {proEnabled ? "toggle in Settings" : "PRO unlocks Hardcore controls"}
                </span>
              </>
            )}
          </div>
        </div>

        {!proEnabled && (
          <div className="hidden md:block text-right">
            <div className="text-xs text-white/60">Hardcore controls</div>
            <div className="text-sm">
              <span className="text-white/80">Locked</span> <span className="text-amber-200">PRO</span>
            </div>
          </div>
        )}
      </div>

      {/* Tiny spacer below sticky bar */}
      <div className="pt-2" />

      {/* Grinder HUD panels */}
      <GrinderHUD />

      {/* Undo Toast (P1) */}
      {showUndo && (
        <div className="sticky top-2 z-50">
          <div
            className={`rounded-2xl backdrop-blur px-4 py-3 shadow-lg ${
              hardcoreMode
                ? "border border-orange-400/15 bg-black/85"
                : "border border-white/10 bg-black/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Undo available</div>
                <div className="text-xs text-white/70 truncate">
                  {undo?.label || "Last action"}
                </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/60 mb-2">Options</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
            Show Notes
          </label>
          <div className="mt-2 text-xs text-white/60">Notes are optional — keep it clean for grinding.</div>
        </div>
      )}

      {/* Grinder-first header + controls */}
      <div className={`${frame} p-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Grinds</h2>
              <span className={chip}>
                {hardcoreMode ? "⚔️ HARDCORE • deep end" : "🧊 CASUAL • simple"}
              </span>

              {hardcoreMode && sessionChips && (
                <span className={chip}>Focus: {sessionChips.focusLabel}</span>
              )}
            </div>

            <div className="mt-1 text-xs text-white/60">
              Grinder-first layout {compactMode ? "• Compact ON" : "• Compact OFF"}
              {hardcoreMode && sessionChips && (
                <span className="ml-2 text-orange-100/70">
                  • Session pace:{" "}
                  <span className="text-white/90 font-semibold">{sessionChips.paceLabel}</span>{" "}
                  <span className="text-white/40">({sessionChips.tierName})</span>
                </span>
              )}
            </div>

            {hardcoreMode && (
              <div className="mt-2 text-xs text-orange-100/70">
                Elite controls enabled. No wasted motion.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompactMode((v) => !v)}
              className={
                hardcoreMode
                  ? "rounded-xl border border-orange-400/15 bg-black/25 px-3 py-2 text-xs hover:bg-black/35"
                  : "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              }
              title="Toggle compact grinder layout"
            >
              {compactMode ? "Compact: ON" : "Compact: OFF"}
            </button>

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className={
                hardcoreMode
                  ? "rounded-xl border border-orange-400/15 bg-black/25 px-3 py-2 text-xs hover:bg-black/35"
                  : "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              }
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
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                hardcoreMode
                  ? "border-orange-400/12 bg-black/45 focus:border-orange-400/25"
                  : "border-white/10 bg-black/40 focus:border-white/25"
              }`}
            />
          </div>

          <div>
            <div className="text-[11px] text-white/60 mb-1">Sort</div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                hardcoreMode
                  ? "border-orange-400/12 bg-black/45 focus:border-orange-400/25"
                  : "border-white/10 bg-black/40 focus:border-white/25"
              }`}
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
                Hardcore unlocks - buttons + +500/+1000 + reset.
              </div>
            )}

            {hardcoreMode && (
              <div className="ml-auto text-[11px] text-orange-100/70">
                - buttons + big adds are live.
              </div>
            )}
          </div>
        </div>

        {showDetails && (
          <div className={`mt-3 ${panel} p-3`}>
            <div className="text-xs text-white/70">
              Details are optional. Keep OFF for max grinder focus.
            </div>
            <div className="mt-1 text-[11px] text-white/60">
              (Visual only — Hardcore behavior unchanged.)
            </div>
          </div>
        )}
      </div>

      {/* PRO tease (FREE users only) */}
      {!proEnabled && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">PRO unlocks Hardcore controls</div>
                <ProLockPill />
              </div>
              <div className="mt-1 text-sm text-white/70">
                Negative buttons, +500/+1000, and Reset Kills are PRO-only. Free mode stays clean with quick-add buttons.
              </div>
            </div>
            <div className="shrink-0 text-xs text-white/60">No payments enabled</div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((g) => {
          const kills = g.kills || 0;
          const { target, pct, remain } = progressToNext(kills);

          const isSessionTarget = activeSession?.species === g.species;

          return (
            <div
              key={g.id}
              className={[
                card,
                compactMode ? "p-3" : "p-4",
                hardcoreMode && isSessionTarget ? "ring-1 ring-orange-400/20" : "",
              ].join(" ")}
            >
              {/* Top row: identity + kills */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={compactMode ? "text-base font-semibold" : "text-lg font-semibold"}>
                      {g.species}
                    </div>

                    {isSessionTarget && (
                      <span className={chip}>
                        ⏱ Session target
                      </span>
                    )}

                    {g.obtained && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs">
                        OBTAINED
                      </span>
                    )}

                    {hardcoreMode && (
                      <span className={chip}>Elite</span>
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
                    <div
                      className={hardcoreMode ? "h-full bg-orange-500/60" : "h-full bg-white/35"}
                      style={{ width: `${Math.round(pct * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  {!g.obtained ? (
                    <button
                      type="button"
                      onClick={() => handleObtained(g)}
                      className={
                        hardcoreMode
                          ? "rounded-xl border border-emerald-400/25 bg-emerald-500/12 px-3 py-2 text-sm hover:bg-emerald-500/18"
                          : "rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm hover:bg-emerald-500/20"
                      }
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

                  {/* Reset Kills is PRO + Hardcore only */}
                  {proEnabled && hardcoreEnabled && (
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

                {/* Grinder buttons */}
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-white/60">
                      {hardcoreEnabled ? "Hardcore Controls" : "Quick Add"}
                    </div>

                    {/* Show PRO badge only when user is FREE (keeps it clean for PRO users) */}
                    {!proEnabled && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/60">Hardcore</span>
                        <ProLockPill />
                      </div>
                    )}
                  </div>

                  {/* Row 1: Positive (always) */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {positiveButtons.map((n) => (
                      <button
                        key={`pos_${g.id}_${n}`}
                        type="button"
                        onClick={() => incKills(g.id, n)}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                      >
                        +{n}
                      </button>
                    ))}

                    {/* +500/+1000 only when PRO + Hardcore */}
                    {proEnabled &&
                      hardcoreEnabled &&
                      hardcorePosButtons.map((n) => (
                        <button
                          key={`poshard_${g.id}_${n}`}
                          type="button"
                          onClick={() => incKills(g.id, n)}
                          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                        >
                          +{pretty(n)}
                        </button>
                      ))}
                  </div>

                  {/* Row 2: Negative only when PRO + Hardcore */}
                  {proEnabled && hardcoreEnabled && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hardcoreNegButtons.map((n) => (
                        <button
                          key={`neg_${g.id}_${n}`}
                          type="button"
                          onClick={() => incKills(g.id, n)}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                          title="Subtract kills (Hardcore only)"
                        >
                          {n}
                        </button>
                      ))}
                      <div className="text-xs text-white/50 self-center ml-1">(negative buttons won’t go below 0)</div>
                    </div>
                  )}

                  {/* FREE helper text */}
                  {!proEnabled && (
                    <div className="mt-2 text-xs text-white/60">
                      Unlock <span className="text-amber-200">PRO</span> to enable Hardcore controls.
                    </div>
                  )}

                  {/* PRO helper text when Hardcore OFF */}
                  {proEnabled && !hardcoreEnabled && (
                    <div className="mt-2 text-xs text-white/60">
                      Turn on Hardcore Mode in Settings to show -kills, +500/+1000, and Reset Kills.
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
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                          hardcoreMode
                            ? "border-orange-400/12 bg-black/45 focus:border-orange-400/25"
                            : "border-white/10 bg-black/40 focus:border-white/25"
                        }`}
                      />
                    </div>

                    {showNotes && (
                      <div>
                        <div className="text-[11px] text-white/60 mb-1">Notes</div>
                        <input
                          value={g.notes || ""}
                          onChange={(e) => setNotes(g.id, e.target.value)}
                          placeholder="Optional notes…"
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                            hardcoreMode
                              ? "border-orange-400/12 bg-black/45 focus:border-orange-400/25"
                              : "border-white/10 bg-black/40 focus:border-white/25"
                          }`}
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
          <div className={`${card} p-4 text-sm text-white/70`}>
            No matches. Try clearing search.
          </div>
        )}
      </div>
    </div>
  );
}
