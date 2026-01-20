import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

const GREAT_ONE_SPECIES = [
  "Whitetail Deer",
  "Moose",
  "Fallow Deer",
  "Black Bear",
  "Wild Boar",
  "Red Deer",
  "Tahr",
  "Red Fox",
  "Mule Deer",
] as const;

// Quick-add presets (optimized for grinders)
const ADD_ROW_PRIMARY = [+1, +10, +50, +100] as const;
const ADD_ROW_SECONDARY = [-1, -10, -50, -100] as const;

// Hardcore milestone ladder (expand later)
const MILESTONES = [100, 250, 500, 1000, 2000, 5000, 10000] as const;

const FUR_COMMON = ["Normal"];
const FUR_RARE_GENERIC = ["Albino", "Melanistic", "Leucistic", "Piebald", "Dilute"];
const FUR_RARE_NAMED = [
  "Dusky",
  "Spirit",
  "Blonde",
  "Silver",
  "Crested",
  "Mocha",
  "Two Tone",
  "Spotted",
  "Painted",
  "Hooded",
  "Golden",
  "Chestnut",
  "Glacier",
];
const FUR_GREAT_ONE_FABLED = [
  "Fabled Chestnut",
  "Fabled Glacier",
  "Fabled Spirit",
  "Fabled Spotted",
  "Fabled Ash",
  "Fabled Birch",
  "Fabled Oak",
  "Fabled Speckled",
  "Fabled Spruce",
  "Fabled Two Tone",
  "Fabled Brown",
  "Fabled Piebald",
  "Fabled Tan",
];

const LS_TROPHIES_KEY = "gog_trophies_v1";
const LS_SESSIONS_KEY = "gog_sessions_v1";
const LS_ACTIVE_SESSION_KEY = "gog_active_session_v1";

type TrophyEntry = {
  id: string;
  ts: number; // created time
  species: string;
  fur?: string;
  notes?: string;
};

type SessionSnapshot = Record<string, number>; // grindId -> kills at snapshot

type SessionEntry = {
  id: string;
  startTs: number;
  endTs: number;
  start: SessionSnapshot;
  end: SessionSnapshot;
  totalDelta: number;
};

type ActiveSession = {
  id: string;
  startTs: number;
  start: SessionSnapshot;
};

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function nextMilestone(kills: number) {
  for (const m of MILESTONES) if (kills < m) return m;
  return null;
}

function progressToNext(kills: number) {
  const next = nextMilestone(kills);
  if (!next)
    return {
      next: null as number | null,
      pct: 100,
      remaining: 0,
      prev: MILESTONES[MILESTONES.length - 1],
    };
  const prev = [...MILESTONES].reverse().find((m) => m <= kills) ?? 0;
  const span = next - prev || next;
  const done = kills - prev;
  const pct = clamp(Math.round((done / span) * 100), 0, 100);
  return { next, pct, remaining: clamp(next - kills, 0, 1_000_000_000), prev };
}

function Pill({
  children,
  onClick,
  active,
  subtle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
          : subtle
          ? "border-slate-800 bg-slate-950/20 text-slate-300 hover:bg-slate-900/40"
          : "border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 md:items-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-black p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">{title}</div>
          <button
            type="button"
            className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function sumSnapshot(snapshot: SessionSnapshot) {
  return Object.values(snapshot).reduce((a, b) => a + (b || 0), 0);
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setObtained = useHunterStore((s) => s.setObtained);
  const setFur = useHunterStore((s) => s.setFur);

  // Premium feel: Simple (clean) by default; Hardcore reveals everything
  const [hardcoreMode, setHardcoreMode] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  // Grinder panels (collapsed by default)
  const [openTrophies, setOpenTrophies] = useState(false);
  const [openSessions, setOpenSessions] = useState(false);

  // Local trophy/session state (stored in localStorage; does NOT touch store.ts)
  const [trophies, setTrophies] = useState<TrophyEntry[]>(() =>
    safeJsonParse<TrophyEntry[]>(localStorage.getItem(LS_TROPHIES_KEY), [])
  );
  const [sessions, setSessions] = useState<SessionEntry[]>(() =>
    safeJsonParse<SessionEntry[]>(localStorage.getItem(LS_SESSIONS_KEY), [])
  );
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() =>
    safeJsonParse<ActiveSession | null>(localStorage.getItem(LS_ACTIVE_SESSION_KEY), null)
  );

  // Trophy quick-add form
  const [tSpecies, setTSpecies] = useState<string>(GREAT_ONE_SPECIES[0]);
  const [tFur, setTFur] = useState<string>("");
  const [tNotes, setTNotes] = useState<string>("");

  const pinned = useMemo(() => {
    const bySpecies = new Map<string, typeof grinds[number]>();
    for (const g of grinds) bySpecies.set(g.species, g);
    return GREAT_ONE_SPECIES.map((sp) => bySpecies.get(sp)).filter(Boolean) as typeof grinds;
  }, [grinds]);

  const totalKills = useMemo(() => pinned.reduce((sum, g) => sum + (g.kills || 0), 0), [pinned]);
  const obtainedCount = useMemo(() => pinned.filter((g) => g.obtained).length, [pinned]);

  const furOptions = useMemo(() => {
    const merged = [...FUR_COMMON, ...FUR_RARE_GENERIC, ...FUR_RARE_NAMED, ...FUR_GREAT_ONE_FABLED];
    return Array.from(new Set(merged));
  }, []);

  // Persist trophies/sessions/active session
  useEffect(() => {
    localStorage.setItem(LS_TROPHIES_KEY, JSON.stringify(trophies));
  }, [trophies]);

  useEffect(() => {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSession) localStorage.setItem(LS_ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
    else localStorage.removeItem(LS_ACTIVE_SESSION_KEY);
  }, [activeSession]);

  function buildSnapshotNow(): SessionSnapshot {
    const snap: SessionSnapshot = {};
    for (const g of pinned) snap[g.id] = g.kills ?? 0;
    return snap;
  }

  const activeDelta = useMemo(() => {
    if (!activeSession) return null;
    const now = buildSnapshotNow();
    const rows = pinned.map((g) => {
      const start = activeSession.start[g.id] ?? 0;
      const end = now[g.id] ?? 0;
      return { id: g.id, species: g.species, start, end, delta: end - start };
    });
    const total = rows.reduce((s, r) => s + r.delta, 0);
    return { rows, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, pinned, totalKills]);

  function startSession() {
    const snap = buildSnapshotNow();
    const s: ActiveSession = { id: uid(), startTs: Date.now(), start: snap };
    setActiveSession(s);
    setOpenSessions(true);
  }

  function endSession() {
    if (!activeSession) return;
    const endSnap = buildSnapshotNow();
    const rows = pinned.map((g) => (endSnap[g.id] ?? 0) - (activeSession.start[g.id] ?? 0));
    const totalDelta = rows.reduce((a, b) => a + b, 0);

    const entry: SessionEntry = {
      id: activeSession.id,
      startTs: activeSession.startTs,
      endTs: Date.now(),
      start: activeSession.start,
      end: endSnap,
      totalDelta,
    };

    setSessions((prev) => [entry, ...prev].slice(0, 200)); // cap history
    setActiveSession(null);
    setOpenSessions(true);
  }

  function clearSessions() {
    const ok = window.confirm("Delete ALL session history? This cannot be undone.");
    if (!ok) return;
    setSessions([]);
    setActiveSession(null);
  }

  function addTrophy(entry: Omit<TrophyEntry, "id" | "ts">) {
    const t: TrophyEntry = { id: uid(), ts: Date.now(), ...entry };
    setTrophies((prev) => [t, ...prev].slice(0, 500)); // cap history
  }

  function clearTrophies() {
    const ok = window.confirm("Delete ALL trophy entries? This cannot be undone.");
    if (!ok) return;
    setTrophies([]);
  }

  function openTrophyPrefillFromGrind(grindId: string) {
    const g = pinned.find((x) => x.id === grindId);
    if (!g) return;
    setTSpecies(g.species);
    setTFur(g.fur ?? "");
    setTNotes("");
    setOpenTrophies(true);
  }

  function submitTrophyForm() {
    addTrophy({
      species: tSpecies,
      fur: tFur || undefined,
      notes: tNotes.trim() ? tNotes.trim() : undefined,
    });
    setTNotes("");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Grinds</div>
          <div className="text-sm text-slate-400">
            Clean by default. Flip <span className="text-slate-200 font-semibold">Hardcore Mode</span> for max speed tools.
          </div>
        </div>

        {/* Top controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grinder Panels */}
          <button
            type="button"
            onClick={() => setOpenTrophies(true)}
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900/40"
            title="Great One / Trophy log"
          >
            Trophies ({trophies.length})
          </button>

          <button
            type="button"
            onClick={() => setOpenSessions(true)}
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900/40"
            title="Session tracker"
          >
            Sessions {activeSession ? "• ACTIVE" : ""}
          </button>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2">
            <span className="text-xs text-slate-400">Mode</span>
            <button
              type="button"
              onClick={() => setHardcoreMode((v) => !v)}
              className={`rounded-lg border px-3 py-2 text-xs ${
                hardcoreMode
                  ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
                  : "border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {hardcoreMode ? "Hardcore ✅" : "Simple ✨"}
            </button>

            <button
              type="button"
              onClick={() => setShowMilestones((v) => !v)}
              className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              title="Show/hide milestone chips"
            >
              Milestones
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">ACTIVE GRINDS</div>
          <div className="mt-1 text-2xl font-semibold">{pinned.length}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">TOTAL KILLS TRACKED</div>
          <div className="mt-1 text-2xl font-semibold">{totalKills}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">OBTAINED</div>
          <div className="mt-1 text-2xl font-semibold">
            {obtainedCount} <span className="text-sm text-slate-400">/ {pinned.length}</span>
          </div>
        </div>
      </div>

      {/* Species cards */}
      <div className="space-y-3">
        {pinned.map((g) => {
          const kills = g.kills ?? 0;
          const prog = progressToNext(kills);

          return (
            <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-3">
                {/* Top row */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{g.species}</div>
                    <div className="text-sm text-slate-400">Kills: {kills}</div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                      value={g.fur ?? ""}
                      onChange={(e) => setFur(g.id, e.target.value)}
                    >
                      <option value="">Fur: —</option>
                      {furOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <button
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        g.obtained
                          ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
                          : "border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
                      }`}
                      onClick={() => {
                        const next = !g.obtained;
                        setObtained(g.id, next);

                        // Grinder-friendly: if they just obtained it, auto-log trophy entry
                        if (next) {
                          addTrophy({
                            species: g.species,
                            fur: g.fur || undefined,
                            notes: "",
                          });
                        }
                      }}
                      type="button"
                    >
                      {g.obtained ? "✅ Obtained" : "⬜ Not yet"}
                    </button>

                    <button
                      className="rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                      onClick={() => openTrophyPrefillFromGrind(g.id)}
                      type="button"
                      title="Add an entry to the trophy log for this species"
                    >
                      Log
                    </button>
                  </div>
                </div>

                {/* Next Target (clean) */}
                <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Next Target</div>
                      <div className="text-xs text-slate-400">
                        {prog.next ? `Hit ${prog.next} kills to clear the next milestone.` : "All milestones cleared ✅"}
                      </div>
                    </div>

                    {prog.next ? (
                      <div className="text-sm text-slate-200">
                        <span className="font-semibold">Next: {prog.next}</span>{" "}
                        <span className="text-slate-400">({prog.remaining} to go)</span>
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-200 font-semibold">Max cleared ✅</div>
                    )}
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950/60">
                    <div className="h-full bg-emerald-600/60" style={{ width: `${prog.pct}%` }} />
                  </div>

                  {/* Milestone chips hidden by default */}
                  {(showMilestones || hardcoreMode) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {MILESTONES.map((m) => (
                        <Pill key={m} active={kills >= m} subtle={!hardcoreMode}>
                          {kills >= m ? "✅ " : ""}
                          {m}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Add (compact + premium) */}
                <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Quick Add</div>
                      <div className="text-xs text-slate-400">
                        Simple shows the most-used buttons. Hardcore reveals the full toolkit.
                      </div>
                    </div>

                    {/* Direct input always available */}
                    <input
                      className="w-28 rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                      value={String(kills)}
                      inputMode="numeric"
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/[^\d]/g, ""));
                        setKills(g.id, clamp(Number.isFinite(n) ? n : 0, 0, 10_000_000));
                      }}
                    />
                  </div>

                  {/* Primary row */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ADD_ROW_PRIMARY.map((delta) => (
                      <button
                        key={delta}
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-800"
                        onClick={() => setKills(g.id, clamp(kills + delta, 0, 10_000_000))}
                        type="button"
                      >
                        +{delta}
                      </button>
                    ))}
                  </div>

                  {/* Secondary row: hidden unless Hardcore */}
                  {hardcoreMode && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ADD_ROW_SECONDARY.map((delta) => (
                        <button
                          key={delta}
                          className="rounded-lg border border-slate-800 bg-slate-950/20 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                          onClick={() => setKills(g.id, clamp(kills + delta, 0, 10_000_000))}
                          type="button"
                        >
                          {delta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hardcore-only extra: one-tap “big moves” */}
                {hardcoreMode && (
                  <div className="rounded-xl border border-slate-800 bg-black/30 p-3">
                    <div className="text-xs text-slate-400 mb-2">Hardcore extras</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm hover:bg-slate-800"
                        onClick={() => setKills(g.id, clamp(kills + 500, 0, 10_000_000))}
                        type="button"
                      >
                        +500
                      </button>
                      <button
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm hover:bg-slate-800"
                        onClick={() => setKills(g.id, clamp(kills + 1000, 0, 10_000_000))}
                        type="button"
                      >
                        +1000
                      </button>
                      <button
                        className="rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                        onClick={() => setKills(g.id, 0)}
                        type="button"
                        title="Reset kills for this species (does not factory reset app)"
                      >
                        Reset Kills
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TROPHIES MODAL */}
      <Modal open={openTrophies} title="Trophies / Great One Log" onClose={() => setOpenTrophies(false)}>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-sm font-semibold">Add Trophy Entry</div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                value={tSpecies}
                onChange={(e) => setTSpecies(e.target.value)}
              >
                {GREAT_ONE_SPECIES.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                value={tFur}
                onChange={(e) => setTFur(e.target.value)}
              >
                <option value="">Fur: —</option>
                {furOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={submitTrophyForm}
                className="rounded-lg border border-emerald-600/60 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/30"
              >
                Add
              </button>
            </div>

            <textarea
              className="mt-2 w-full rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
              placeholder="Notes (optional) — map, zone, trophy score, etc."
              value={tNotes}
              onChange={(e) => setTNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Tip: clicking <span className="text-slate-200 font-semibold">✅ Obtained</span> auto-logs an entry.
            </div>
            <button
              type="button"
              onClick={clearTrophies}
              className="rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900/40"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-2">
            {trophies.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-black/30 p-4 text-sm text-slate-400">
                No trophy entries yet. Mark one as obtained or add one above.
              </div>
            ) : (
              trophies.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-800 bg-black/30 p-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-semibold">{t.species}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(t.ts)}</div>
                  </div>
                  <div className="mt-1 text-sm text-slate-200">
                    Fur: <span className="text-slate-300">{t.fur ?? "—"}</span>
                  </div>
                  {t.notes ? <div className="mt-1 text-sm text-slate-300">Notes: {t.notes}</div> : null}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* SESSIONS MODAL */}
      <Modal open={openSessions} title="Session Tracker" onClose={() => setOpenSessions(false)}>
        <div className="space-y-4">
          {/* Active session controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">
                  {activeSession ? "Active Session" : "No Active Session"}
                </div>
                <div className="text-xs text-slate-400">
                  {activeSession ? `Started: ${formatDateTime(activeSession.startTs)}` : "Start a session to track kills gained per run."}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!activeSession ? (
                  <button
                    type="button"
                    onClick={startSession}
                    className="rounded-lg border border-emerald-600/60 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/30"
                  >
                    Start Session
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={endSession}
                    className="rounded-lg border border-emerald-600/60 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/30"
                  >
                    End Session
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearSessions}
                  className="rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                >
                  Clear History
                </button>
              </div>
            </div>

            {/* Live delta view */}
            {activeSession && activeDelta ? (
              <div className="mt-3 rounded-xl border border-slate-800 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Kills gained (live)</div>
                  <div className="text-sm text-slate-200">
                    Total: <span className="font-semibold">{activeDelta.total >= 0 ? `+${activeDelta.total}` : activeDelta.total}</span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {activeDelta.rows.map((r) => (
                    <div key={r.id} className="rounded-lg border border-slate-800 bg-black/30 p-2">
                      <div className="text-sm font-semibold">{r.species}</div>
                      <div className="text-xs text-slate-400">
                        {r.start} → {r.end}{" "}
                        <span className="text-slate-200 font-semibold">
                          ({r.delta >= 0 ? `+${r.delta}` : r.delta})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Session history */}
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-black/30 p-4 text-sm text-slate-400">
                No sessions yet. Start one, grind, then end it to save the run.
              </div>
            ) : (
              sessions.map((s) => {
                const startTotal = sumSnapshot(s.start);
                const endTotal = sumSnapshot(s.end);
                const totalDelta = endTotal - startTotal;

                const perSpecies = pinned.map((g) => {
                  const a = s.start[g.id] ?? 0;
                  const b = s.end[g.id] ?? 0;
                  return { id: g.id, species: g.species, delta: b - a };
                });

                return (
                  <div key={s.id} className="rounded-xl border border-slate-800 bg-black/30 p-3">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm font-semibold">
                        Session {formatDateTime(s.startTs)}
                      </div>
                      <div className="text-sm text-slate-200">
                        Total gained:{" "}
                        <span className="font-semibold">
                          {totalDelta >= 0 ? `+${totalDelta}` : totalDelta}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDateTime(s.startTs)} → {formatDateTime(s.endTs)}
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {perSpecies.map((r) => (
                        <div key={r.id} className="rounded-lg border border-slate-800 bg-black/30 p-2">
                          <div className="text-sm font-semibold">{r.species}</div>
                          <div className="text-xs text-slate-400">
                            Gained:{" "}
                            <span className="text-slate-200 font-semibold">
                              {r.delta >= 0 ? `+${r.delta}` : r.delta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
