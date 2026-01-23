// components/GrindsList.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore, type Grind } from "../store";
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

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("pinned");
  const [showNotes, setShowNotes] = useState(false);

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

  const positiveButtons = [1, 10, 50, 100];
  const hardcorePosButtons = [500, 1000];
  const hardcoreNegButtons = [-1, -10, -50, -100];

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
      `Reset kills for ${g.species} back to 0?\n\nThis cannot be undone.`
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

      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/60 mb-2">Search</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a species name…"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/60 mb-2">Sort</div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
          >
            <option value="pinned">Pinned Order</option>
            <option value="kills_desc">Kills (High → Low)</option>
            <option value="kills_asc">Kills (Low → High)</option>
            <option value="name_asc">Species (A → Z)</option>
          </select>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/60 mb-2">Options</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
            Show Notes
          </label>
          <div className="mt-2 text-xs text-white/60">Notes are optional — keep it clean for grinding.</div>
        </div>
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
        {filtered.map((g) => (
          <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              {/* Left: info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{g.species}</div>
                  {g.obtained && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs">
                      OBTAINED
                    </span>
                  )}
                </div>

                <div className="mt-1 text-sm text-white/70">
                  Kills: <span className="font-semibold text-white">{pretty(g.kills || 0)}</span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Fur / Variant</div>
                    <input
                      value={g.fur || ""}
                      onChange={(e) => setFur(g.id, e.target.value)}
                      placeholder="e.g., Albino / Piebald / Melanistic / etc."
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                    />
                  </div>

                  {showNotes && (
                    <div>
                      <div className="text-xs text-white/60 mb-1">Notes</div>
                      <input
                        value={g.notes || ""}
                        onChange={(e) => setNotes(g.id, e.target.value)}
                        placeholder="Optional notes…"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: buttons */}
              <div className="md:w-[380px]">
                {/* Obtained actions */}
                <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                  {!g.obtained ? (
                    <button
                      type="button"
                      onClick={() => handleObtained(g)}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm hover:bg-emerald-500/20"
                    >
                      Mark Obtained
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUnobtained(g)}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                    >
                      Unmark Obtained
                    </button>
                  )}

                  {/* Reset Kills is PRO + Hardcore only */}
                  {proEnabled && hardcoreEnabled && (
                    <button
                      type="button"
                      onClick={() => handleResetConfirm(g)}
                      className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm hover:bg-red-500/20"
                    >
                      Reset Kills
                    </button>
                  )}
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
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            No matches. Try clearing search.
          </div>
        )}
      </div>
    </div>
  );
}
