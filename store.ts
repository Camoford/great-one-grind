// store.ts
// Great One Grind — Hardened Zustand store with persistence + backups + sessions
// Feature C (Hardcore Mode): adds hardcoreMode + setters + migration support.
// Phase 4 (Payments Prep): adds isPro + setters + migration support (NO PAYMENTS here).
// Post-Launch QoL Pack (P1): adds single-level Undo (time-window) WITHOUT persisting undo state.
//
// Full-file replacement intended for preview/dev work.
// Production is locked elsewhere; do not touch production.

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ---------------------------- Storage Keys ---------------------------- */

const STORAGE_KEY = "greatonegrind_v1"; // keep stable to avoid wiping users
const AUTO_BACKUPS_KEY = "greatonegrind_auto_backups_v1";

/* ------------------------------ Versioning ---------------------------- */

// Bump because we add isPro (Phase 4 prep) in addition to hardcoreMode already present.
const STORE_VERSION = 3;

/* ------------------------------- Types -------------------------------- */

export type GreatOneSpecies =
  | "Whitetail Deer"
  | "Moose"
  | "Fallow Deer"
  | "Black Bear"
  | "Wild Boar"
  | "Red Deer"
  | "Tahr"
  | "Red Fox"
  | "Mule Deer";

export const GREAT_ONE_SPECIES: GreatOneSpecies[] = [
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

export type Grind = {
  id: string;
  species: GreatOneSpecies;
  kills: number;
  obtained: boolean;
  fur?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type Trophy = {
  id: string;
  species: GreatOneSpecies;
  fur?: string;
  notes?: string;
  date: number; // timestamp
};

export type Session = {
  id: string;
  startedAt: number;
  endedAt?: number;
  species?: GreatOneSpecies;
  kills: number;
};

/* ------------------------------- Undo -------------------------------- */

const UNDO_WINDOW_MS = 8_000;

type CoreSnapshot = {
  grinds: Grind[];
  trophies: Trophy[];
  sessions: Session[];
  activeSession: Session | null;
  hardcoreMode: boolean;
};

type UndoState = {
  armedAt: number;
  expiresAt: number;
  label: string;
  snapshot: CoreSnapshot;
};

/* ------------------------------- Helpers ------------------------------ */

function safeNow() {
  return Date.now();
}

function safeUUID() {
  // crypto.randomUUID is supported on modern browsers; fallback for safety
  // @ts-ignore
  if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function nonNegInt(n: number) {
  const v = clampInt(n);
  return v < 0 ? 0 : v;
}

function isUndoValid(u: UndoState | null) {
  if (!u) return false;
  const now = safeNow();
  return now <= u.expiresAt;
}

type SnapshotSource = {
  grinds: Grind[];
  trophies: Trophy[];
  sessions: Session[];
  activeSession: Session | null;
  hardcoreMode: boolean;
};

function snapshotCore(s: SnapshotSource): CoreSnapshot {
  // Defensive cloning
  return {
    grinds: s.grinds.map((g) => ({ ...g })),
    trophies: s.trophies.map((t) => ({ ...t })),
    sessions: s.sessions.map((se) => ({ ...se })),
    activeSession: s.activeSession ? { ...s.activeSession } : null,
    hardcoreMode: !!s.hardcoreMode,
  };
}

function armUndo(existing: UndoState | null, before: CoreSnapshot, label: string): UndoState {
  const now = safeNow();

  // If an undo is already armed and still valid, keep the earliest snapshot
  // and just extend the timer (so rapid multi-step changes revert as one).
  if (existing && now <= existing.expiresAt) {
    return {
      ...existing,
      expiresAt: now + UNDO_WINDOW_MS,
      label: existing.label || label || "Undo",
    };
  }

  return {
    armedAt: now,
    expiresAt: now + UNDO_WINDOW_MS,
    label: label || "Undo",
    snapshot: before,
  };
}

/* -------------------------- Backup Payload Types ---------------------- */

export type BackupPayloadV3 = {
  app: "great-one-grind";
  version: number;
  exportedAt: number;
  data: {
    grinds: Grind[];
    trophies: Trophy[];
    sessions: Session[];
    activeSession: Session | null;
    hardcoreMode: boolean;

    // Phase 4 prep
    isPro: boolean;
  };
};

type AutoBackupEntry = {
  id: string;
  createdAt: number;
  reason: string;
  payload: BackupPayloadV3;
};

/* --------------------------- Build Default Data ------------------------ */

function buildDefaultGrinds(): Grind[] {
  const now = safeNow();
  return GREAT_ONE_SPECIES.map((species) => ({
    id: safeUUID(),
    species,
    kills: 0,
    obtained: false,
    fur: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  }));
}

function normalizeGrinds(grinds: any): Grind[] {
  const now = safeNow();
  const list: Grind[] = Array.isArray(grinds) ? grinds : [];
  const cleaned: Grind[] = list
    .map((g) => {
      const species = g?.species as GreatOneSpecies;
      if (!GREAT_ONE_SPECIES.includes(species)) return null;

      const id = typeof g?.id === "string" && g.id ? g.id : safeUUID();
      const createdAt = Number.isFinite(g?.createdAt) ? g.createdAt : now;
      const updatedAt = Number.isFinite(g?.updatedAt) ? g.updatedAt : now;

      return {
        id,
        species,
        kills: nonNegInt(g?.kills),
        obtained: !!g?.obtained,
        fur: typeof g?.fur === "string" ? g.fur : "",
        notes: typeof g?.notes === "string" ? g.notes : "",
        createdAt,
        updatedAt,
      } as Grind;
    })
    .filter(Boolean) as Grind[];

  // Ensure we always have all 9 pinned species (self-heal)
  const bySpecies = new Map<GreatOneSpecies, Grind>();
  for (const g of cleaned) bySpecies.set(g.species, g);

  const healed: Grind[] = GREAT_ONE_SPECIES.map((s) => {
    const existing = bySpecies.get(s);
    if (existing) return existing;
    return {
      id: safeUUID(),
      species: s,
      kills: 0,
      obtained: false,
      fur: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
  });

  return healed;
}

function normalizeTrophies(trophies: any): Trophy[] {
  const list: Trophy[] = Array.isArray(trophies) ? trophies : [];
  return list
    .map((t) => {
      const species = t?.species as GreatOneSpecies;
      if (!GREAT_ONE_SPECIES.includes(species)) return null;

      const id = typeof t?.id === "string" && t.id ? t.id : safeUUID();
      const date = Number.isFinite(t?.date) ? t.date : safeNow();

      return {
        id,
        species,
        fur: typeof t?.fur === "string" ? t.fur : "",
        notes: typeof t?.notes === "string" ? t.notes : "",
        date,
      } as Trophy;
    })
    .filter(Boolean) as Trophy[];
}

function normalizeSessions(sessions: any): Session[] {
  const list: Session[] = Array.isArray(sessions) ? sessions : [];
  return list
    .map((s) => {
      const id = typeof s?.id === "string" && s.id ? s.id : safeUUID();
      const startedAt = Number.isFinite(s?.startedAt) ? s.startedAt : safeNow();
      const endedAt = Number.isFinite(s?.endedAt) ? s.endedAt : undefined;
      const kills = nonNegInt(s?.kills);
      const species = GREAT_ONE_SPECIES.includes(s?.species)
        ? (s.species as GreatOneSpecies)
        : undefined;

      return { id, startedAt, endedAt, kills, species } as Session;
    })
    .filter(Boolean) as Session[];
}

function normalizeActiveSession(active: any): Session | null {
  if (!active) return null;
  const id = typeof active?.id === "string" && active.id ? active.id : safeUUID();
  const startedAt = Number.isFinite(active?.startedAt) ? active.startedAt : safeNow();
  const endedAt = Number.isFinite(active?.endedAt) ? active.endedAt : undefined;
  const kills = nonNegInt(active?.kills);
  const species = GREAT_ONE_SPECIES.includes(active?.species)
    ? (active.species as GreatOneSpecies)
    : undefined;

  // If endedAt exists, treat it as not active (defensive)
  if (endedAt) return null;

  return { id, startedAt, endedAt, kills, species };
}

/* ------------------------------- Store -------------------------------- */

export type HunterState = {
  version: number;

  grinds: Grind[];
  trophies: Trophy[];

  // Session tracker (simple + persistent)
  sessions: Session[];
  activeSession: Session | null;

  // Feature C
  hardcoreMode: boolean;

  // Phase 4 prep
  isPro: boolean;

  // Post-launch QoL (P1) — NOT persisted
  undo: UndoState | null;

  // ---- Actions (grinds)
  setKills: (grindId: string, kills: number) => void;
  incKills: (grindId: string, delta: number) => void;
  resetKills: (grindId: string) => void;

  setFur: (grindId: string, fur: string) => void;
  setNotes: (grindId: string, notes: string) => void;
  setObtained: (grindId: string, obtained: boolean) => void;

  // ---- Actions (trophies)
  addTrophy: (trophy: Omit<Trophy, "id" | "date"> & Partial<Pick<Trophy, "id" | "date">>) => void;
  removeTrophy: (trophyId: string) => void;
  clearTrophies: () => void;

  // ---- Actions (sessions)
  startSession: (species?: GreatOneSpecies) => void;
  endSession: () => void;
  clearSessions: () => void;

  // ---- Feature C actions
  setHardcoreMode: (v: boolean) => void;
  toggleHardcoreMode: () => void;

  // ---- Phase 4 prep actions
  setPro: (v: boolean) => void;
  togglePro: () => void;

  // ---- Undo actions
  canUndo: () => boolean;
  undoLastAction: () => { ok: true } | { ok: false; error: string };
  clearUndo: () => void;

  // ---- Backup/Restore
  exportBackup: () => string; // returns JSON string
  importBackup: (json: string) => { ok: true } | { ok: false; error: string };
  factoryReset: () => void;

  // ---- Auto-backups (rolling last 5)
  createAutoBackup: (reason: string) => void;
  getAutoBackups: () => AutoBackupEntry[];
  restoreAutoBackup: (id: string) => { ok: true } | { ok: false; error: string };
  clearAutoBackups: () => void;
};

function buildBackupPayload(
  state: Pick<
    HunterState,
    "grinds" | "trophies" | "sessions" | "activeSession" | "hardcoreMode" | "isPro"
  >
): BackupPayloadV3 {
  return {
    app: "great-one-grind",
    version: STORE_VERSION,
    exportedAt: safeNow(),
    data: {
      grinds: state.grinds,
      trophies: state.trophies,
      sessions: state.sessions,
      activeSession: state.activeSession,
      hardcoreMode: !!state.hardcoreMode,
      isPro: !!state.isPro,
    },
  };
}

function readAutoBackups(): AutoBackupEntry[] {
  const raw = typeof window !== "undefined" ? localStorage.getItem(AUTO_BACKUPS_KEY) : null;
  const parsed = safeJsonParse<AutoBackupEntry[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeAutoBackups(list: AutoBackupEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTO_BACKUPS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const useHunterStore = create<HunterState>()(
  persist(
    (set, get) => ({
      version: STORE_VERSION,

      grinds: normalizeGrinds(buildDefaultGrinds()),
      trophies: [],
      sessions: [],
      activeSession: null,

      hardcoreMode: false,
      isPro: false,

      undo: null,

      /* ----------------------------- Grinds ----------------------------- */

      setKills: (grindId, kills) => {
        set((s) => {
          const before = snapshotCore(s);

          const prev = s.grinds.find((g) => g.id === grindId);
          const prevKills = prev ? prev.kills : 0;

          const next = s.grinds.map((g) =>
            g.id === grindId ? { ...g, kills: nonNegInt(kills), updatedAt: safeNow() } : g
          );

          // update active session kills by delta (only positive adds count)
          const delta = Math.max(0, nonNegInt(kills) - nonNegInt(prevKills));
          const active = s.activeSession
            ? { ...s.activeSession, kills: nonNegInt(s.activeSession.kills + delta) }
            : null;

          return {
            grinds: normalizeGrinds(next),
            activeSession: active,
            undo: armUndo(s.undo, before, "Kills changed"),
          };
        });
      },

      incKills: (grindId, delta) => {
        const d = clampInt(delta);
        set((s) => {
          const target = s.grinds.find((g) => g.id === grindId);
          if (!target) return s;

          const before = snapshotCore(s);

          const nextKills = nonNegInt(target.kills + d);
          const next = s.grinds.map((g) =>
            g.id === grindId ? { ...g, kills: nextKills, updatedAt: safeNow() } : g
          );

          const active = s.activeSession
            ? { ...s.activeSession, kills: nonNegInt(s.activeSession.kills + Math.max(0, d)) }
            : null;

          return {
            grinds: normalizeGrinds(next),
            activeSession: active,
            undo: armUndo(s.undo, before, "Kills added"),
          };
        });
      },

      resetKills: (grindId) => {
        set((s) => {
          const before = snapshotCore(s);

          const next = s.grinds.map((g) =>
            g.id === grindId ? { ...g, kills: 0, updatedAt: safeNow() } : g
          );

          return {
            grinds: normalizeGrinds(next),
            undo: armUndo(s.undo, before, "Kills reset"),
          };
        });
      },

      setFur: (grindId, fur) => {
        set((s) => {
          const before = snapshotCore(s);

          const next = s.grinds.map((g) =>
            g.id === grindId
              ? { ...g, fur: typeof fur === "string" ? fur : "", updatedAt: safeNow() }
              : g
          );
          return {
            grinds: normalizeGrinds(next),
            undo: armUndo(s.undo, before, "Fur changed"),
          };
        });
      },

      setNotes: (grindId, notes) => {
        set((s) => {
          const before = snapshotCore(s);

          const next = s.grinds.map((g) =>
            g.id === grindId
              ? { ...g, notes: typeof notes === "string" ? notes : "", updatedAt: safeNow() }
              : g
          );
          return {
            grinds: normalizeGrinds(next),
            undo: armUndo(s.undo, before, "Notes changed"),
          };
        });
      },

      setObtained: (grindId, obtained) => {
        set((s) => {
          const before = snapshotCore(s);

          const next = s.grinds.map((g) =>
            g.id === grindId ? { ...g, obtained: !!obtained, updatedAt: safeNow() } : g
          );

          return {
            grinds: normalizeGrinds(next),
            undo: armUndo(s.undo, before, "Obtained toggled"),
          };
        });

        get().createAutoBackup("Obtained toggled");
      },

      /* ----------------------------- Trophies --------------------------- */

      addTrophy: (trophyInput) => {
        set((s) => {
          const species = trophyInput.species as GreatOneSpecies;
          if (!GREAT_ONE_SPECIES.includes(species)) return s;

          const before = snapshotCore(s);

          const fur = typeof trophyInput.fur === "string" ? trophyInput.fur : "";
          const notes = typeof trophyInput.notes === "string" ? trophyInput.notes : "";

          const now = safeNow();
          const recently = s.trophies.some(
            (t) =>
              t.species === species &&
              (t.fur || "") === (fur || "") &&
              Math.abs((t.date || 0) - now) < 10_000
          );
          if (recently) return s;

          const trophy: Trophy = {
            id: typeof trophyInput.id === "string" && trophyInput.id ? trophyInput.id : safeUUID(),
            species,
            fur,
            notes,
            date: Number.isFinite(trophyInput.date) ? (trophyInput.date as number) : now,
          };

          return {
            trophies: normalizeTrophies([trophy, ...s.trophies]),
            undo: armUndo(s.undo, before, "Trophy added"),
          };
        });

        get().createAutoBackup("Trophy added");
      },

      removeTrophy: (trophyId) => {
        set((s) => {
          const before = snapshotCore(s);
          return {
            trophies: s.trophies.filter((t) => t.id !== trophyId),
            undo: armUndo(s.undo, before, "Trophy removed"),
          };
        });
      },

      clearTrophies: () => {
        set((s) => {
          const before = snapshotCore(s);
          return { trophies: [], undo: armUndo(s.undo, before, "Trophies cleared") };
        });
      },

      /* ----------------------------- Sessions --------------------------- */

      startSession: (species) => {
        set((s) => {
          if (s.activeSession) return s;

          const before = snapshotCore(s);

          const next: Session = {
            id: safeUUID(),
            startedAt: safeNow(),
            kills: 0,
            species: species && GREAT_ONE_SPECIES.includes(species) ? species : undefined,
          };

          return {
            activeSession: next,
            undo: armUndo(s.undo, before, "Session started"),
          };
        });
      },

      endSession: () => {
        set((s) => {
          if (!s.activeSession) return s;

          const before = snapshotCore(s);

          const ended: Session = { ...s.activeSession, endedAt: safeNow() };
          const nextSessions = [ended, ...s.sessions].slice(0, 200);

          return {
            sessions: normalizeSessions(nextSessions),
            activeSession: null,
            undo: armUndo(s.undo, before, "Session ended"),
          };
        });

        get().createAutoBackup("Session ended");
      },

      clearSessions: () => {
        set((s) => {
          const before = snapshotCore(s);
          return {
            sessions: [],
            activeSession: null,
            undo: armUndo(s.undo, before, "Sessions cleared"),
          };
        });
      },

      /* -------------------------- Feature C ----------------------------- */

      setHardcoreMode: (v) => {
        set((s) => {
          const before = snapshotCore(s);
          return {
            hardcoreMode: !!v,
            undo: armUndo(s.undo, before, "Hardcore mode changed"),
          };
        });
      },

      toggleHardcoreMode: () => {
        set((s) => {
          const before = snapshotCore(s);
          return {
            hardcoreMode: !s.hardcoreMode,
            undo: armUndo(s.undo, before, "Hardcore mode toggled"),
          };
        });
      },

      /* ------------------------------ Undo ------------------------------ */

      canUndo: () => {
        const u = get().undo;
        return isUndoValid(u);
      },

      undoLastAction: () => {
        const u = get().undo;
        if (!isUndoValid(u)) {
          set(() => ({ undo: null }));
          return { ok: false as const, error: "Nothing to undo." };
        }

        // Restore snapshot (and clear undo)
        set(() => ({
          grinds: normalizeGrinds(u.snapshot.grinds),
          trophies: normalizeTrophies(u.snapshot.trophies),
          sessions: normalizeSessions(u.snapshot.sessions),
          activeSession: normalizeActiveSession(u.snapshot.activeSession),
          hardcoreMode: !!u.snapshot.hardcoreMode,
          undo: null,
        }));

        return { ok: true as const };
      },

      clearUndo: () => {
        set(() => ({ undo: null }));
      },

      /* ------------------------ Phase 4 (Prep) -------------------------- */

      setPro: (v) => {
        set(() => ({ isPro: !!v }));
      },

      togglePro: () => {
        set((s) => ({ isPro: !s.isPro }));
      },

      /* -------------------------- Backup/Restore ------------------------ */

      exportBackup: () => {
        const s = get();
        const payload = buildBackupPayload(s);
        return JSON.stringify(payload, null, 2);
      },

      importBackup: (json) => {
        const parsed = safeJsonParse<any>(json);
        if (!parsed) return { ok: false as const, error: "Invalid JSON." };

        // Accept both new structured payloads and legacy raw objects.
        const payload: BackupPayloadV3 | null =
          parsed?.app === "great-one-grind" && parsed?.data ? (parsed as BackupPayloadV3) : null;

        const data =
          payload?.data ??
          (parsed?.grinds || parsed?.trophies || parsed?.sessions
            ? {
                grinds: parsed?.grinds,
                trophies: parsed?.trophies,
                sessions: parsed?.sessions,
                activeSession: parsed?.activeSession,
                hardcoreMode: parsed?.hardcoreMode,
                isPro: parsed?.isPro,
              }
            : null);

        if (!data) return { ok: false as const, error: "Backup format not recognized." };

        const nextGrinds = normalizeGrinds(data.grinds);
        const nextTrophies = normalizeTrophies(data.trophies);
        const nextSessions = normalizeSessions(data.sessions);
        const nextActive = normalizeActiveSession(data.activeSession);

        const nextHardcore = !!data.hardcoreMode;
        const nextIsPro = !!data.isPro;

        set(() => ({
          version: STORE_VERSION,
          grinds: nextGrinds,
          trophies: nextTrophies,
          sessions: nextSessions,
          activeSession: nextActive,
          hardcoreMode: nextHardcore,
          isPro: nextIsPro,
          undo: null, // never carry undo across restores
        }));

        get().createAutoBackup("Restore performed");
        return { ok: true as const };
      },

      factoryReset: () => {
        set(() => ({
          version: STORE_VERSION,
          grinds: normalizeGrinds(buildDefaultGrinds()),
          trophies: [],
          sessions: [],
          activeSession: null,
          hardcoreMode: false,
          isPro: false,
          undo: null,
        }));

        get().clearAutoBackups();
      },

      /* -------------------------- Auto-backups -------------------------- */

      createAutoBackup: (reason) => {
        try {
          const s = get();
          const payload = buildBackupPayload(s);

          const entry: AutoBackupEntry = {
            id: safeUUID(),
            createdAt: safeNow(),
            reason: typeof reason === "string" ? reason : "Auto-backup",
            payload,
          };

          const existing = readAutoBackups();
          const next = [entry, ...existing].slice(0, 5);
          writeAutoBackups(next);
        } catch {
          // ignore
        }
      },

      getAutoBackups: () => {
        return readAutoBackups();
      },

      restoreAutoBackup: (id) => {
        const list = readAutoBackups();
        const found = list.find((b) => b.id === id);
        if (!found) return { ok: false as const, error: "Auto-backup not found." };

        const json = JSON.stringify(found.payload);
        return get().importBackup(json);
      },

      clearAutoBackups: () => {
        writeAutoBackups([]);
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,

      // IMPORTANT: do NOT persist undo state
      partialize: (s) => ({
        version: s.version,
        grinds: s.grinds,
        trophies: s.trophies,
        sessions: s.sessions,
        activeSession: s.activeSession,
        hardcoreMode: s.hardcoreMode,
        isPro: s.isPro,
      }),

      migrate: (persisted: any) => {
        const prev = persisted ?? {};

        return {
          version: STORE_VERSION,
          grinds: normalizeGrinds(prev.grinds),
          trophies: normalizeTrophies(prev.trophies),
          sessions: normalizeSessions(prev.sessions),
          activeSession: normalizeActiveSession(prev.activeSession),
          hardcoreMode: typeof prev.hardcoreMode === "boolean" ? prev.hardcoreMode : false,

          // New in v3
          isPro: typeof prev.isPro === "boolean" ? prev.isPro : false,

          // Never persisted
          undo: null,
        };
      },
    }
  )
);
