import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

type LastSelections = {
  grindId: string;
  fur: string;
  amount: number;
};

const LS_KEY = "greatone_quicklog_last_v1";

export default function QuickLog() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setFur = useHunterStore((s) => s.setFur);
  const addTrophy = useHunterStore((s) => s.addTrophy);

  const defaultGrindId = useMemo(() => grinds[0]?.id || "", [grinds]);

  const [grindId, setGrindId] = useState<string>("");
  const [fur, setLocalFur] = useState<string>("Common");
  const [amount, setAmount] = useState<number>(1);
  const [obtained, setObtained] = useState<boolean>(false);

  // Restore last selections
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<LastSelections>;
      if (parsed.grindId) setGrindId(parsed.grindId);
      if (typeof parsed.fur === "string") setLocalFur(parsed.fur);
      if (typeof parsed.amount === "number") setAmount(parsed.amount);
    } catch {
      // ignore
    }
  }, []);

  // If nothing selected yet (first load), pick first grind
  useEffect(() => {
    if (!grindId && defaultGrindId) setGrindId(defaultGrindId);
  }, [defaultGrindId, grindId]);

  // Persist last selections whenever changed
  useEffect(() => {
    if (!grindId) return;
    const payload: LastSelections = { grindId, fur, amount };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [grindId, fur, amount]);

  const selected = useMemo(() => grinds.find((g) => g.id === grindId), [grinds, grindId]);

  const handleLog = () => {
    if (!selected) return;

    // Set fur on the grind (store-backed)
    setFur(selected.id, fur);

    // Increment kills (store-backed)
    const nextKills = Math.max(0, (selected.kills || 0) + amount);
    setKills(selected.id, nextKills);

    // If user says this entry is a trophy, store it and reset grinder counter
    if (obtained) {
      addTrophy({
        species: selected.species,
        fur: fur || "Unknown",
        killsAtObtained: nextKills,
        obtainedAt: Date.now(),
      });

      // Grinder default reset after trophy
      setKills(selected.id, 0);
      setFur(selected.id, undefined);
      setObtained(false);
    }
  };

  if (!grinds.length) {
    return (
      <div className="text-center text-slate-400 mt-10">
        No grinds available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-slate-900 p-4 border border-slate-800">
      <h2 className="text-xl font-semibold">Quick Log</h2>

      {/* Select Grind */}
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
        <input
          className="w-full rounded bg-black border border-slate-700 p-2"
          value={fur}
          onChange={(e) => setLocalFur(e.target.value)}
          placeholder="Common / Rare / etc"
        />
        <p className="text-xs text-slate-500">
          Tip: type any fur name you want (we keep it flexible).
        </p>
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

      {/* Obtained */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={obtained}
          onChange={(e) => setObtained(e.target.checked)}
        />
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
