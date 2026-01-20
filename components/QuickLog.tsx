import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

type LastSelections = {
  grindId: string;
  fur: string;
  amount: number;
  otherFur: string;
  obtained: boolean;
};

const LS_KEY = "greatone_quicklog_last_v1";

/**
 * ✅ Restore your rare fur types here.
 * If you want to expand later, just add items per species.
 */
function getFursForSpecies(species: string): string[] {
  // Common “rare” palette + flexible custom option.
  // You can replace/extend these lists with your exact preferred ones anytime.
  const base = ["Common", "Piebald", "Albino", "Melanistic", "Leucistic"];

  switch (species) {
    case "Whitetail Deer":
      return [...base, "Red", "Tan", "Grey", "Brown", "Other (type it)"];
    case "Moose":
      return [...base, "Light", "Dark", "Brown", "Other (type it)"];
    case "Fallow Deer":
      return [...base, "Spotted", "Chocolate", "Black", "Other (type it)"];
    case "Black Bear":
      return [...base, "Cinnamon", "Blonde", "Other (type it)"];
    case "Wild Boar":
      return [...base, "Brown Hybrid", "Blackgold", "Other (type it)"];
    case "Red Deer":
      return [...base, "Light", "Dark", "Other (type it)"];
    case "Tahr":
      return [...base, "Grey", "Dark", "Other (type it)"];
    case "Red Fox":
      return [...base, "Cross", "Silver", "Other (type it)"];
    case "Mule Deer":
      return [...base, "Grey", "Brown", "Other (type it)"];
    default:
      return [...base, "Other (type it)"];
  }
}

export default function QuickLog() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setFur = useHunterStore((s) => s.setFur);
  const addTrophy = useHunterStore((s) => s.addTrophy);

  const defaultGrindId = useMemo(() => grinds[0]?.id || "", [grinds]);

  const [grindId, setGrindId] = useState<string>("");
  const [furPick, setFurPick] = useState<string>("Common");
  const [otherFur, setOtherFur] = useState<string>("");
  const [amount, setAmount] = useState<number>(1);
  const [obtained, setObtained] = useState<boolean>(false);

  const selected = useMemo(() => grinds.find((g) => g.id === grindId), [grinds, grindId]);
  const furOptions = useMemo(
    () => getFursForSpecies(selected?.species || ""),
    [selected?.species]
  );

  const fur = useMemo(() => {
    if (furPick === "Other (type it)") return (otherFur || "Unknown").trim();
    return (furPick || "Unknown").trim();
  }, [furPick, otherFur]);

  // Restore last selections
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<LastSelections>;
      if (parsed.grindId) setGrindId(parsed.grindId);
      if (typeof parsed.amount === "number") setAmount(parsed.amount);
      if (typeof parsed.obtained === "boolean") setObtained(parsed.obtained);
      if (typeof parsed.otherFur === "string") setOtherFur(parsed.otherFur);
      if (typeof parsed.fur === "string" && parsed.fur) setFurPick(parsed.fur);
    } catch {
      // ignore
    }
  }, []);

  // If nothing selected yet (first load), pick first grind
  useEffect(() => {
    if (!grindId && defaultGrindId) setGrindId(defaultGrindId);
  }, [defaultGrindId, grindId]);

  // If current furPick is not in the options for this species, reset to Common
  useEffect(() => {
    if (!furOptions.includes(furPick)) {
      setFurPick("Common");
      setOtherFur("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.species]);

  // Persist last selections
  useEffect(() => {
    if (!grindId) return;
    const payload: LastSelections = {
      grindId,
      fur: furPick,
      amount,
      otherFur,
      obtained,
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [grindId, furPick, amount, otherFur, obtained]);

  const handleLog = () => {
    if (!selected) return;

    // Set fur on grind
    setFur(selected.id, fur);

    // Increment kills
    const nextKills = Math.max(0, (selected.kills || 0) + amount);
    setKills(selected.id, nextKills);

    // Trophy flow
    if (obtained) {
      addTrophy({
        species: selected.species,
        fur: fur || "Unknown",
        killsAtObtained: nextKills,
        obtainedAt: Date.now(),
      });

      setKills(selected.id, 0);
      setFur(selected.id, undefined);
      setObtained(false);
    }
  };

  if (!grinds.length) {
    return <div className="text-center text-slate-400 mt-10">No grinds available yet.</div>;
  }

  return (
    <div className="space-y-4 rounded-xl bg-slate-900 p-4 border border-slate-800">
      <h2 className="text-xl font-semibold">Quick Log</h2>

      {/* Grind */}
      <div className="space-y-1">
        <label className="text-sm text-slate-400">Grind</label>
        <select
          className="w-full rounded bg-black border border-slate-700 p-2"
          value={grindId}
          onChange={(e) => setGrindId(e.target.value)}
        >
          {grinds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.species}
            </option>
          ))}
        </select>
      </div>

      {/* Fur */}
      <div className="space-y-1">
        <label className="text-sm text-slate-400">Fur</label>
        <select
          className="w-full rounded bg-black border border-slate-700 p-2"
          value={furPick}
          onChange={(e) => setFurPick(e.target.value)}
        >
          {furOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {furPick === "Other (type it)" && (
          <input
            className="w-full rounded bg-black border border-slate-700 p-2"
            value={otherFur}
            onChange={(e) => setOtherFur(e.target.value)}
            placeholder="Type fur name (ex: Spirit, Glacier, etc)"
          />
        )}
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-sm text-slate-400">Kills to add</label>
        <select
          className="w-full rounded bg-black border border-slate-700 p-2"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        >
          {[1, 5, 10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              +{n}
            </option>
          ))}
        </select>
      </div>

      {/* Trophy */}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={obtained} onChange={(e) => setObtained(e.target.checked)} />
        <span className="text-sm">✅ This log is a Trophy (Obtained)</span>
      </label>

      <button
        className="w-full rounded bg-blue-600 py-2 font-semibold hover:bg-blue-700"
        onClick={handleLog}
      >
        Log Entry
      </button>

      {selected && (
        <p className="text-sm text-slate-400">
          Current: <span className="text-white">{selected.species}</span> • Kills:{" "}
          <span className="text-white">{selected.kills}</span>
          {selected.fur ? (
            <>
              {" "}
              • Fur: <span className="text-white">{selected.fur}</span>
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
