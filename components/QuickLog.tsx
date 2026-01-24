// components/QuickLog.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * QUICK LOG (Hardened)
 * - Species + Fur dropdowns (with Custom fur)
 * - "Great One obtained" + "Confirm" anti-misclick checkbox
 * - When Trophy is saved:
 *    - addTrophy()
 *    - mark obtained
 *    - reset kills to 0
 *    - auto-uncheck confirm (safety)
 * - Persists last selections in localStorage
 *
 * NOTE:
 * This file intentionally calls store functions defensively via `any`
 * so it won't TypeScript-crash if names differ slightly.
 */

// -------------------- Local constants --------------------

const SPECIES: string[] = [
  "Whitetail Deer",
  "Moose",
  "Fallow Deer",
  "Black Bear",
  "Wild Boar",
  "Red Deer",
  "Tahr",
  "Red Fox",
  "Mule Deer",
];

const QUICKLOG_LAST_SPECIES_KEY = "gog_quicklog_last_species_v1";
const QUICKLOG_LAST_FUR_KEY = "gog_quicklog_last_fur_v1";
const QUICKLOG_CUSTOM_FUR_KEY = "gog_quicklog_custom_fur_v1";

const CUSTOM_OPTION = "__CUSTOM__";

/**
 * Fallback fur lists (feel free to expand later).
 * We include common "rare" style names and a Great One placeholder.
 */
const FALLBACK_FURS: Record<string, string[]> = {
  "Whitetail Deer": ["Great One", "Albino", "Melanistic", "Piebald", "Leucistic", "Normal"],
  Moose: ["Great One", "Albino", "Melanistic", "Piebald", "Leucistic", "Normal"],
  "Fallow Deer": ["Great One", "Albino", "Melanistic", "Piebald", "Leucistic", "Normal"],
  "Black Bear": ["Great One", "Albino", "Melanistic", "Spirit", "Cinnamon", "Blonde", "Normal"],
  "Wild Boar": ["Great One", "Albino", "Melanistic", "Leucistic", "Normal"],
  "Red Deer": ["Great One", "Albino", "Melanistic", "Piebald", "Leucistic", "Normal"],
  Tahr: ["Great One", "Albino", "Melanistic", "Leucistic", "Normal"],
  "Red Fox": ["Great One", "Albino", "Melanistic", "Leucistic", "Normal"],
  "Mule Deer": ["Great One", "Albino", "Melanistic", "Piebald", "Leucistic", "Normal"],
};

// -------------------- Helpers --------------------

function safeUUID() {
  const c: any = globalThis.crypto as any;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeFurList(species: string): string[] {
  const list =
    FALLBACK_FURS[species] ?? ["Great One", "Albino", "Melanistic", "Piebald", "Leucistic", "Normal"];
  const dedup = Array.from(new Set(list));
  const withoutNormal = dedup.filter((x) => x !== "Normal");
  return [...withoutNormal, "Normal"];
}

function pretty(n: number) {
  try {
    return new Intl.NumberFormat().format(n || 0);
  } catch {
    return String(n || 0);
  }
}

// -------------------- Component --------------------

export default function QuickLog() {
  // Pull state defensively
  const store = useHunterStore((s) => s) as any;

  const grinds: any[] = useHunterStore((s: any) => s.grinds ?? []);
  const activeSession = useHunterStore((s: any) => s.activeSession ?? null);

  // Restore last selections (safe defaults)
  const [species, setSpecies] = useState<string>(() => {
    const saved = localStorage.getItem(QUICKLOG_LAST_SPECIES_KEY);
    return saved && SPECIES.includes(saved) ? saved : "Whitetail Deer";
  });

  const [furChoice, setFurChoice] = useState<string>(() => {
    const saved = localStorage.getItem(QUICKLOG_LAST_FUR_KEY);
    return saved ? saved : "Normal";
  });

  const [customFur, setCustomFur] = useState<string>(() => {
    return localStorage.getItem(QUICKLOG_CUSTOM_FUR_KEY) ?? "";
  });

  // Trophy + confirm (anti-misclick)
  const [isTrophy, setIsTrophy] = useState<boolean>(false);
  const [confirmTrophy, setConfirmTrophy] = useState<boolean>(false);

  // Derived fur options
  const furOptions = useMemo(() => normalizeFurList(species), [species]);

  // If species changes, make sure fur is valid
  useEffect(() => {
    if (furChoice === CUSTOM_OPTION) return;
    if (!furOptions.includes(furChoice)) {
      setFurChoice("Normal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  // Persist selections
  useEffect(() => {
    localStorage.setItem(QUICKLOG_LAST_SPECIES_KEY, species);
  }, [species]);

  useEffect(() => {
    localStorage.setItem(QUICKLOG_LAST_FUR_KEY, furChoice);
  }, [furChoice]);

  useEffect(() => {
    localStorage.setItem(QUICKLOG_CUSTOM_FUR_KEY, customFur);
  }, [customFur]);

  // If Trophy is turned off, clear confirm (so it doesn't look stuck)
  useEffect(() => {
    if (!isTrophy) setConfirmTrophy(false);
  }, [isTrophy]);

  // Find current grind entry by species (defensive)
  const grind = useMemo(() => {
    return (grinds ?? []).find((g) => (g?.species ?? g?.name) === species) ?? null;
  }, [grinds, species]);

  const kills = typeof grind?.kills === "number" ? grind.kills : 0;
  const obtained = !!grind?.obtained;

  // Final fur string
  const finalFur = furChoice === CUSTOM_OPTION ? (customFur || "").trim() || "Custom" : furChoice;

  // --- Store function wrappers (defensive) ---
  function setKillsForSpecies(newKills: number) {
    if (typeof store.setKills === "function") return store.setKills(species, newKills);
    if (typeof store.setGrindKills === "function") return store.setGrindKills(species, newKills);
    if (typeof store.updateKills === "function") return store.updateKills(species, newKills);

    if (typeof store.updateGrind === "function" && grind?.id) {
      return store.updateGrind(grind.id, { kills: newKills });
    }
  }

  function setFurForSpecies(fur: string) {
    if (typeof store.setFur === "function") return store.setFur(species, fur);
    if (typeof store.setGrindFur === "function") return store.setGrindFur(species, fur);
    if (typeof store.updateFur === "function") return store.updateFur(species, fur);

    if (typeof store.updateGrind === "function" && grind?.id) {
      return store.updateGrind(grind.id, { fur });
    }
  }

  function markObtainedTrue() {
    if (typeof store.setObtained === "function") return store.setObtained(species, true);
    if (typeof store.setGrindObtained === "function") return store.setGrindObtained(species, true);
    if (typeof store.toggleObtained === "function" && grind?.id) return store.toggleObtained(grind.id, true);

    if (typeof store.updateGrind === "function" && grind?.id) {
      return store.updateGrind(grind.id, { obtained: true });
    }
  }

  function addTrophyEntry() {
    if (typeof store.addTrophy !== "function") return;

    if (typeof store.hasTrophy === "function") {
      const exists = store.hasTrophy(species);
      if (exists) return;
    }

    store.addTrophy({
      id: safeUUID(),
      species,
      fur: finalFur,
      date: Date.now(),
      killsAtObtained: kills,
      notes: "",
    });
  }

  function bumpSessionKill(delta: number) {
    if (typeof store.incrementSessionKills === "function") return store.incrementSessionKills(delta);
    if (typeof store.addSessionKill === "function") return store.addSessionKill(delta);

    if (activeSession && typeof store.updateSession === "function") {
      const next = (activeSession.kills ?? 0) + delta;
      return store.updateSession({ kills: next });
    }
  }

  // --- Actions ---
  function handleLog(delta: number) {
    const nextKills = Math.max(0, kills + delta);

    // Always persist fur selection to grind
    setFurForSpecies(finalFur);

    // If Trophy mode is on, require confirm to proceed
    if (isTrophy && !confirmTrophy) {
      return;
    }

    // Normal kill log
    if (!isTrophy) {
      setKillsForSpecies(nextKills);
      bumpSessionKill(delta);
      return;
    }

    // Trophy log
    addTrophyEntry();
    markObtainedTrue();
    setKillsForSpecies(0);

    // Safety: clear confirm so a misclick can't double-trigger
    setConfirmTrophy(false);
  }

  const trophyBlocked = isTrophy && !confirmTrophy;

  return (
    <div className="space-y-4 p-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-lg font-semibold">Quick Log</div>
        <div className="mt-1 text-sm text-slate-400">
          Log kills fast. Trophy mode is protected by a confirm checkbox to prevent misclicks.
        </div>

        {/* Species */}
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-300">Species</div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-black px-3 py-2 outline-none focus:border-slate-600"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Fur */}
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-300">Fur</div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-black px-3 py-2 outline-none focus:border-slate-600"
            value={furChoice}
            onChange={(e) => setFurChoice(e.target.value)}
          >
            {furOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value={CUSTOM_OPTION}>Custom…</option>
          </select>

          {furChoice === CUSTOM_OPTION && (
            <input
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black px-3 py-2 outline-none focus:border-slate-600"
              placeholder="Type custom fur name"
              value={customFur}
              onChange={(e) => setCustomFur(e.target.value)}
            />
          )}
        </div>

        {/* Trophy / Confirm block (visual emphasis) */}
        <div
          className={`mt-4 rounded-2xl border p-3 ${
            isTrophy ? "border-amber-500/30 bg-amber-500/10" : "border-slate-800 bg-slate-950/50"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-1 h-6 w-6 accent-amber-500"
              checked={isTrophy}
              onChange={(e) => {
                const v = e.target.checked;
                setIsTrophy(v);
                if (!v) setConfirmTrophy(false);
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-extrabold tracking-tight">
                  Great One obtained
                </div>
                {isTrophy ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                    Trophy Save ON
                  </span>
                ) : null}
              </div>

              <div className="mt-0.5 text-sm text-slate-300/80">
                Saves to Trophy Room, marks Obtained, and resets kills to 0.
              </div>
            </div>
          </label>

          {isTrophy && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-black/20 p-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-6 w-6 accent-amber-500"
                  checked={confirmTrophy}
                  onChange={(e) => setConfirmTrophy(e.target.checked)}
                />
                <div className="min-w-0">
                  <div className="font-semibold">
                    Confirm trophy save
                  </div>
                  <div className="mt-0.5 text-sm text-slate-300/70">
                    Required to enable the Log buttons while Trophy Save is ON.
                  </div>
                </div>
              </label>

              {!confirmTrophy ? (
                <div className="mt-2 text-sm text-amber-200">
                  Tip: check <span className="font-semibold">Confirm trophy save</span> to enable logging.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="mt-4 text-sm text-slate-300">
          Current: <span className="font-semibold">{species}</span> <span className="text-slate-500">•</span>{" "}
          Kills: <span className="font-semibold">{pretty(kills)}</span>
          {obtained ? (
            <span className="ml-2 rounded-full bg-emerald-900/40 px-2 py-0.5 text-emerald-200">
              Obtained
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`rounded-xl border border-slate-700 bg-white/10 px-4 py-2 font-semibold hover:bg-white/15 ${
              trophyBlocked ? "cursor-not-allowed opacity-50 hover:bg-white/10" : ""
            }`}
            disabled={trophyBlocked}
            onClick={() => handleLog(1)}
          >
            Log +1
          </button>

          <button
            className={`rounded-xl border border-slate-700 bg-white/10 px-4 py-2 font-semibold hover:bg-white/15 ${
              trophyBlocked ? "cursor-not-allowed opacity-50 hover:bg-white/10" : ""
            }`}
            disabled={trophyBlocked}
            onClick={() => handleLog(10)}
          >
            Log +10
          </button>

          <button
            className={`rounded-xl border border-slate-700 bg-white/10 px-4 py-2 font-semibold hover:bg-white/15 ${
              trophyBlocked ? "cursor-not-allowed opacity-50 hover:bg-white/10" : ""
            }`}
            disabled={trophyBlocked}
            onClick={() => handleLog(50)}
          >
            Log +50
          </button>

          <button
            className={`rounded-xl border border-slate-700 bg-white/10 px-4 py-2 font-semibold hover:bg-white/15 ${
              trophyBlocked ? "cursor-not-allowed opacity-50 hover:bg-white/10" : ""
            }`}
            disabled={trophyBlocked}
            onClick={() => handleLog(100)}
          >
            Log +100
          </button>
        </div>

        {isTrophy ? (
          <div className="mt-3 text-sm text-slate-400">
            Trophy save will reset kills to <span className="font-semibold">0</span> after saving.
          </div>
        ) : null}
      </div>
    </div>
  );
}
