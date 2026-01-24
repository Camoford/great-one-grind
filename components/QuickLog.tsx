// components/QuickLog.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * QUICK LOG (Restored UI)
 * - Species dropdown
 * - Fur dropdown + Custom fur
 * - Rack dropdown + Custom rack
 * - "Great One Harvested" + Confirm anti-misclick checkbox
 * - When Trophy is saved:
 *    - addTrophy()
 *    - mark obtained
 *    - reset kills to 0
 *    - auto-uncheck confirm (safety)
 * - Persists last selections in localStorage
 *
 * NOTE:
 * This file calls store functions defensively via `any`
 * so it won't TS-crash if store function names differ slightly.
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

const QUICKLOG_LAST_SPECIES_KEY = "gog_quicklog_last_species_v2";
const QUICKLOG_LAST_FUR_KEY = "gog_quicklog_last_fur_v2";
const QUICKLOG_CUSTOM_FUR_KEY = "gog_quicklog_custom_fur_v2";
const QUICKLOG_LAST_RACK_KEY = "gog_quicklog_last_rack_v1";
const QUICKLOG_CUSTOM_RACK_KEY = "gog_quicklog_custom_rack_v1";

const CUSTOM_OPTION = "__CUSTOM__";

// Fallback fur lists (expand later if you want exact COTW lists)
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

// Rack options (generic + custom; you can expand per species later)
const RACK_OPTIONS: string[] = [
  "Typical",
  "Non-Typical",
  "Small",
  "Medium",
  "Large",
  "Max",
];

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

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

// -------------------- Component --------------------

export default function QuickLog() {
  const store = useHunterStore((s) => s) as any;

  const grinds: any[] = useHunterStore((s: any) => s.grinds ?? []);
  const activeSession = useHunterStore((s: any) => s.activeSession ?? null);

  // Restore last selections
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

  const [rackChoice, setRackChoice] = useState<string>(() => {
    const saved = localStorage.getItem(QUICKLOG_LAST_RACK_KEY);
    return saved ? saved : "Typical";
  });

  const [customRack, setCustomRack] = useState<string>(() => {
    return localStorage.getItem(QUICKLOG_CUSTOM_RACK_KEY) ?? "";
  });

  // Trophy + confirm (anti-misclick)
  const [isTrophy, setIsTrophy] = useState<boolean>(false);
  const [confirmTrophy, setConfirmTrophy] = useState<boolean>(false);

  const furOptions = useMemo(() => normalizeFurList(species), [species]);

  // Keep fur valid on species change
  useEffect(() => {
    if (furChoice === CUSTOM_OPTION) return;
    if (!furOptions.includes(furChoice)) setFurChoice("Normal");
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

  useEffect(() => {
    localStorage.setItem(QUICKLOG_LAST_RACK_KEY, rackChoice);
  }, [rackChoice]);

  useEffect(() => {
    localStorage.setItem(QUICKLOG_CUSTOM_RACK_KEY, customRack);
  }, [customRack]);

  // If Trophy is turned off, clear confirm
  useEffect(() => {
    if (!isTrophy) setConfirmTrophy(false);
  }, [isTrophy]);

  // Find grind entry (defensive)
  const grind = useMemo(() => {
    return (grinds ?? []).find((g) => (g?.species ?? g?.name) === species) ?? null;
  }, [grinds, species]);

  const kills = typeof grind?.kills === "number" ? grind.kills : 0;
  const obtained = !!grind?.obtained;

  const finalFur =
    furChoice === CUSTOM_OPTION ? safeStr(customFur).trim() || "Custom" : furChoice;

  const finalRack =
    rackChoice === CUSTOM_OPTION ? safeStr(customRack).trim() || "Custom" : rackChoice;

  // --- Store wrappers (defensive) ---
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

  function setRackForSpecies(rack: string) {
    // Not all stores have rack; updateGrind fallback keeps it safe if schema supports it
    if (typeof store.setRack === "function") return store.setRack(species, rack);
    if (typeof store.setGrindRack === "function") return store.setGrindRack(species, rack);
    if (typeof store.updateRack === "function") return store.updateRack(species, rack);

    if (typeof store.updateGrind === "function" && grind?.id) {
      return store.updateGrind(grind.id, { rack });
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

    // Optional duplicate protection
    if (typeof store.hasTrophy === "function") {
      const exists = store.hasTrophy(species);
      if (exists) return;
    }

    // Try a couple of field names so TrophyRoom can show it either way
    store.addTrophy({
      id: safeUUID(),
      species,
      fur: finalFur,
      rack: finalRack,
      obtainedAt: Date.now(),
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

    // Always persist selections to grind
    setFurForSpecies(finalFur);
    setRackForSpecies(finalRack);

    // Trophy mode requires confirm to proceed
    if (isTrophy && !confirmTrophy) return;

    if (!isTrophy) {
      setKillsForSpecies(nextKills);
      bumpSessionKill(delta);
      return;
    }

    // Trophy log
    addTrophyEntry();
    markObtainedTrue();
    setKillsForSpecies(0);

    // Safety: clear confirm so it can't double-trigger
    setConfirmTrophy(false);
  }

  const trophyBlocked = isTrophy && !confirmTrophy;

  return (
    <div className="space-y-4 p-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Quick Log</div>
            <div className="mt-1 text-sm text-slate-400">
              Fast logging. Trophy save is protected to prevent misclicks.
            </div>
          </div>

          {isTrophy ? (
            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
              Trophy Mode
            </span>
          ) : null}
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

        {/* Fur + Rack */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
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

            {furChoice === CUSTOM_OPTION ? (
              <input
                className="mt-2 w-full rounded-xl border border-slate-800 bg-black px-3 py-2 outline-none focus:border-slate-600"
                placeholder="Type custom fur name"
                value={customFur}
                onChange={(e) => setCustomFur(e.target.value)}
              />
            ) : null}
          </div>

          <div>
            <div className="mb-2 text-sm text-slate-300">Rack</div>
            <select
              className="w-full rounded-xl border border-slate-800 bg-black px-3 py-2 outline-none focus:border-slate-600"
              value={rackChoice}
              onChange={(e) => setRackChoice(e.target.value)}
            >
              {RACK_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value={CUSTOM_OPTION}>Custom…</option>
            </select>

            {rackChoice === CUSTOM_OPTION ? (
              <input
                className="mt-2 w-full rounded-xl border border-slate-800 bg-black px-3 py-2 outline-none focus:border-slate-600"
                placeholder="Type custom rack name"
                value={customRack}
                onChange={(e) => setCustomRack(e.target.value)}
              />
            ) : null}
          </div>
        </div>

        {/* Trophy / Confirm block */}
        <div
          className={`mt-4 rounded-2xl border p-3 ${
            isTrophy ? "border-amber-500/35 bg-amber-500/10" : "border-slate-800 bg-slate-950/50"
          }`}
        >
          <div className="flex flex-col gap-3">
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
                <div className="font-extrabold tracking-tight">Great One Harvested</div>
                <div className="mt-0.5 text-sm text-slate-300/80">
                  Saves to Trophy Room, marks Obtained, and resets kills to 0.
                </div>
              </div>
            </label>

            {isTrophy ? (
              <div className="rounded-xl border border-amber-500/20 bg-black/20 p-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-6 w-6 accent-amber-500"
                      checked={confirmTrophy}
                      onChange={(e) => setConfirmTrophy(e.target.checked)}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold">Confirm trophy save</div>
                      <div className="text-sm text-slate-300/70">
                        Required to enable Log buttons while Trophy Mode is ON.
                      </div>
                    </div>
                  </div>

                  {!confirmTrophy ? (
                    <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                      Locked
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                      Armed
                    </span>
                  )}
                </label>

                {!confirmTrophy ? (
                  <div className="mt-2 text-sm text-amber-200">
                    Tip: check <span className="font-semibold">Confirm trophy save</span> to unlock Log buttons.
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 text-sm text-slate-300">
          Current: <span className="font-semibold">{species}</span>{" "}
          <span className="text-slate-500">•</span> Kills:{" "}
          <span className="font-semibold">{pretty(kills)}</span>
          {obtained ? (
            <span className="ml-2 rounded-full bg-emerald-900/40 px-2 py-0.5 text-emerald-200">
              Obtained
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
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
