import React, { useEffect, useMemo, useState } from "react";

/* ======================================================
   Great One species list (v1 – safe, small, fixed)
   ====================================================== */
const GREAT_ONE_SPECIES = [
  { id: "whitetail_deer", label: "Whitetail Deer" },
  { id: "moose", label: "Moose" },
  { id: "red_deer", label: "Red Deer" },
  { id: "black_bear", label: "Black Bear" },
] as const;

/* ======================================================
   Types
   ====================================================== */
type Grind = {
  id: string;
  name: string;
  species: string;
  reserve?: string;
  createdAt: number;
  kills: number;
  obtained: boolean;
};

/* ======================================================
   Storage helpers
   ====================================================== */
const STORAGE_KEY = "greatonegrind.grinds.v1";

function uid() {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function loadGrinds(): Grind[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((g) => ({
      id: String(g.id),
      name: String(g.name ?? "Untitled Grind"),
      species: String(g.species ?? ""),
      reserve: g.reserve ? String(g.reserve) : "",
      createdAt: Number(g.createdAt ?? Date.now()),
      kills: Number(g.kills ?? 0),
      obtained: Boolean(g.obtained),
    }));
  } catch {
    return [];
  }
}

function saveGrinds(grinds: Grind[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grinds));
  } catch {
    /* ignore */
  }
}

/* ======================================================
   Component
   ====================================================== */
export default function GrindsList() {
  const [grinds, setGrinds] = useState<Grind[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSpecies, setNewSpecies] = useState("");
  const [newReserve, setNewReserve] = useState("");

  useEffect(() => {
    setGrinds(loadGrinds());
  }, []);

  useEffect(() => {
    saveGrinds(grinds);
  }, [grinds]);

  const selected = useMemo(
    () => grinds.find((g) => g.id === selectedId) ?? null,
    [grinds, selectedId]
  );

  const totalKills = useMemo(
    () => grinds.reduce((sum, g) => sum + g.kills, 0),
    [grinds]
  );

  function createGrind() {
    if (!newName.trim() || !newSpecies) return;

    const grind: Grind = {
      id: uid(),
      name: newName.trim(),
      species: newSpecies,
      reserve: newReserve.trim(),
      createdAt: Date.now(),
      kills: 0,
      obtained: false,
    };

    setGrinds((prev) => [grind, ...prev]);
    setSelectedId(grind.id);

    setNewName("");
    setNewSpecies("");
    setNewReserve("");
    setIsCreating(false);
  }

  function updateGrind(id: string, patch: Partial<Grind>) {
    setGrinds((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  }

  function deleteGrind(id: string) {
    setGrinds((prev) => prev.filter((g) => g.id !== id));
    setSelectedId(null);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Grinds</h2>
          <p className="text-xs text-slate-400">
            Track kills and mark when you finally land the Great One.
          </p>
        </div>

        <button
          onClick={() => setIsCreating((v) => !v)}
          className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm"
        >
          {isCreating ? "Close" : "Create"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            Active Grinds
          </div>
          <div className="text-2xl font-semibold text-slate-100">
            {grinds.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            Total Kills Tracked
          </div>
          <div className="text-2xl font-semibold text-slate-100">
            {totalKills}
          </div>
        </div>
      </div>

      {/* Create form */}
      {isCreating && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Grind name"
            className="w-full rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-slate-100 text-sm"
          />

          <select
            value={newSpecies}
            onChange={(e) => setNewSpecies(e.target.value)}
            className="w-full rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-slate-100 text-sm"
          >
            <option value="">Select a Great One species…</option>
            {GREAT_ONE_SPECIES.map((s) => (
              <option key={s.id} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>

          <input
            value={newReserve}
            onChange={(e) => setNewReserve(e.target.value)}
            placeholder="Reserve (optional)"
            className="w-full rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-slate-100 text-sm"
          />

          <button
            onClick={createGrind}
            disabled={!newName.trim() || !newSpecies}
            className="w-full px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-sm disabled:opacity-40"
          >
            Create Grind
          </button>
        </div>
      )}

      {/* Empty state */}
      {grinds.length === 0 && !isCreating && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
          <div className="text-slate-200 font-medium">No grinds yet</div>
          <div className="text-xs text-slate-400 mt-1">
            Hit <span className="text-slate-200">Create</span> to start tracking
            kills.
          </div>
        </div>
      )}

      {/* List */}
      {!selected &&
        grinds.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedId(g.id)}
            className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <div className="flex justify-between">
              <div>
                <div className="text-slate-100 font-medium">{g.name}</div>
                <div className="text-xs text-slate-400">
                  {g.species}
                  {g.reserve ? ` • ${g.reserve}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Kills</div>
                <div className="text-lg text-slate-100">{g.kills}</div>
              </div>
            </div>
          </button>
        ))}

      {/* Detail view */}
      {selected && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-slate-400"
          >
            ← Back
          </button>

          <div>
            <div className="text-lg text-slate-100 font-semibold">
              {selected.name}
            </div>
            <div className="text-xs text-slate-400">
              {selected.species}
              {selected.reserve ? ` • ${selected.reserve}` : ""}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                updateGrind(selected.id, {
                  kills: Math.max(0, selected.kills - 1),
                })
              }
              className="px-4 py-2 rounded-xl bg-slate-800/40 text-slate-200"
            >
              –
            </button>

            <div className="text-3xl font-bold text-slate-100">
              {selected.kills}
            </div>

            <button
              onClick={() =>
                updateGrind(selected.id, { kills: selected.kills + 1 })
              }
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-200"
            >
              +
            </button>
          </div>

          <label className="flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={selected.obtained}
              onChange={(e) =>
                updateGrind(selected.id, { obtained: e.target.checked })
              }
            />
            Obtained
          </label>

          <button
            onClick={() => deleteGrind(selected.id)}
            className="text-sm text-rose-300"
          >
            Delete Grind
          </button>
        </div>
      )}
    </div>
  );
}
