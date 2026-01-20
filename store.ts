// src/store.ts
// Hardened persistence + unified grinds/trophies
// + Rolling auto-backups (keep last 5)
// + Session Tracker persistence (active + history)

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ---------------- KEYS ---------------- */

const STORAGE_KEY = "greatonegrind_v1";
const LAST_BACKUP_KEY = "greatonegrind_last_backup_v1";
const ROLLING_BACKUPS_KEY = "greatonegrind_backups_v1";
const SESSION_ACTIVE_KEY = "greatonegrind_session_active_v1";

const MAX_ROLLING_BACKUPS = 5;

/* ---------------- TYPES ---------------- */

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

export type GrindEntry = {
  id: string;
  species: GreatOneSpecies;
  kills: number;
  obtained: boolean;
  fur?: string;
  notes?: string;
};

export type TrophyEntry = {
  id: string;
  species: GreatOneSpecies;
  fur: string;
  killsAtObtained: number;
  obtainedAt: number;
};

export type SessionEntry = {
  id: string;
  grindId: string;
  species: GreatOneSpecies;
  startedAt: number;
  endedAt: number;
  startKills: number;
  endKills: number;
};

export type BackupPayload = {
  version: number;
  exportedAt: number;
  grinds: GrindEntry[];
  trophies: TrophyEntry[];
  sessions: SessionEntry[];
};

type ActiveSession = {
  grindId: string;
  startTs: number;
  startKills: number;
};

type HunterState = {
  version: number;
  grinds: GrindEntry[];
  trophies: TrophyEntry[];
  sessions: SessionEntry[];
  activeSession: ActiveSession | null;

  // Core setters
  setKills: (grindId: string, kills: number) => void;
  setFur: (grindId: string, fur?: string) => void;
  setObtained: (grindId: string, obtained: boolean) => void;

  // Sessions
  startSession: (grindId: string) => void;
  endSession: () => void;

  // Trophies
  addTrophy: (t: Omit<TrophyEntry, "id">) => void;
  clearTrophies: () => void;

  // Backup/restore
  exportBackup: () => string;
  importBackup: (json: string) => { ok: boolean; error?: string };
  factoryReset: () => void;

  // Rolling backups
  listRollingBackups: () => BackupPayload[];
  restoreRollingBackup: (index: number) => { ok: boolean; error?: string };
  clearRollingBackups: () => void;
};

/* ---------------- HELPERS ---------------- */

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function safeParseJSON<T>(raw: string | null): { ok: boolean; value?: T; error?: string } {
  if (!raw) return { ok: false, error: "Empty" };
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

function buildDefaultGrinds(): GrindEntry[] {
  const species: GreatOneSpecies[] = [
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

  return species.map((s) => ({
    id: uid(),
    species: s,
    kills: 0,
    obtained: false,
    fur: undefined,
    notes: "",
  }));
}

function selfHealGrinds(grinds: GrindEntry[]): GrindEntry[] {
  const defaults = buildDefaultGrinds();
  const existingSpecies = new Set(grinds.map((g) => g.species));
  const missing = defaults.filter((d) => !existingSpecies.has(d.species));
  if (missing.length === 0) return grinds;
  return [...grinds, ...missing];
}

function buildBackupPayload(
  grinds: GrindEntry[],
  trophies: TrophyEntry[],
  sessions: SessionEntry[]
): BackupPayload {
  return {
    version: 1,
    exportedAt: Date.now(),
    grinds,
    trophies,
    sessions,
  };
}

function readRollingBackups(): BackupPayload[] {
  const parsed = safeParseJSON<BackupPayload[]>(localStorage.getItem(ROLLING_BACKUPS_KEY));
  if (!parsed.ok || !parsed.value || !Array.isArray(parsed.value)) return [];
  return parsed.value
    .filter((b) => b && Array.isArray(b.grinds) && Array.isArray(b.trophies))
    .slice(0, MAX_ROLLING_BACKUPS);
}

function writeRollingBackups(list: BackupPayload[]) {
  try {
    localStorage.setItem(ROLLING_BACKUPS_KEY, JSON.stringify(list.slice(0, MAX_ROLLING_BACKUPS)));
  } catch {}
}

function pushRollingBackup(payload: BackupPayload) {
  const current = readRollingBackups();
  const next = [payload, ...current].slice(0, MAX_ROLLING_BACKUPS);
  writeRollingBackups(next);
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
  } catch {}
}

/* ---------------- STORE ---------------- */

export const useHunterStore = create<HunterState>()(
  persist(
    (set, get) => {
      // Restore active session from localStorage
      let restoredSession: ActiveSession | null = null;
      const parsedSession = safeParseJSON<ActiveSession>(
        localStorage.getItem(SESSION_ACTIVE_KEY)
      );
      if (parsedSession.ok && parsedSession.value) {
        restoredSession = parsedSession.value;
      }

      return {
        version: 1,
        grinds: selfHealGrinds([]).length ? selfHealGrinds([]) : buildDefaultGrinds(),
        trophies: [],
        sessions: [],
        activeSession: restoredSession,

        setKills: (grindId, kills) => {
          set((state) => ({
            grinds: state.grinds.map((g) =>
              g.id === grindId ? { ...g, kills: Math.max(0, Math.floor(kills)) } : g
            ),
          }));
        },

        setFur: (grindId, fur) => {
          set((state) => ({
            grinds: state.grinds.map((g) => (g.id === grindId ? { ...g, fur } : g)),
          }));
        },

        setObtained: (grindId, obtained) => {
          set((state) => ({
            grinds: state.grinds.map((g) => (g.id === grindId ? { ...g, obtained } : g)),
          }));
        },

        startSession: (grindId) => {
          const grind = get().grinds.find((g) => g.id === grindId);
          if (!grind) return;

          const active: ActiveSession = {
            grindId,
            startTs: Date.now(),
            startKills: grind.kills || 0,
          };

          try {
            localStorage.setItem(SESSION_ACTIVE_KEY, JSON.stringify(active));
          } catch {}

          set({ activeSession: active });
        },

        endSession: () => {
          const s = get();
          if (!s.activeSession) return;

          const grind = s.grinds.find((g) => g.id === s.activeSession!.grindId);
          if (!grind) return;

          const session: SessionEntry = {
            id: uid(),
            grindId: grind.id,
            species: grind.species,
            startedAt: s.activeSession.startTs,
            endedAt: Date.now(),
            startKills: s.activeSession.startKills,
            endKills: grind.kills || 0,
          };

          const updatedSessions = [session, ...s.sessions];

          try {
            localStorage.removeItem(SESSION_ACTIVE_KEY);
          } catch {}

          set({ sessions: updatedSessions, activeSession: null });

          // Auto-backup after session ends
          const after = get();
          pushRollingBackup(
            buildBackupPayload(after.grinds, after.trophies, after.sessions)
          );
        },

        addTrophy: (t) => {
          const state = get();

          const dupe = state.trophies.some(
            (x) =>
              x.species === t.species &&
              x.fur === t.fur &&
              Math.abs(x.obtainedAt - t.obtainedAt) < 2000
          );
          if (dupe) return;

          const trophy: TrophyEntry = {
            id: uid(),
            ...t,
          };

          set((s) => ({ trophies: [trophy, ...s.trophies] }));

          const after = get();
          pushRollingBackup(
            buildBackupPayload(after.grinds, after.trophies, after.sessions)
          );
        },

        clearTrophies: () => set({ trophies: [] }),

        exportBackup: () => {
          const s = get();
          const payload = buildBackupPayload(s.grinds, s.trophies, s.sessions);
          try {
            localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
          } catch {}
          return JSON.stringify(payload, null, 2);
        },

        importBackup: (json) => {
          const parsed = safeParseJSON<BackupPayload>(json);
          if (!parsed.ok || !parsed.value) return { ok: false, error: parsed.error || "Invalid JSON" };

          const payload = parsed.value;
          if (
            !Array.isArray(payload.grinds) ||
            !Array.isArray(payload.trophies) ||
            !Array.isArray(payload.sessions)
          ) {
            return { ok: false, error: "Backup missing arrays" };
          }

          const healedGrinds = selfHealGrinds(payload.grinds);

          set({
            version: 1,
            grinds: healedGrinds,
            trophies: payload.trophies,
            sessions: payload.sessions,
            activeSession: null,
          });

          try {
            localStorage.removeItem(SESSION_ACTIVE_KEY);
            localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
          } catch {}

          pushRollingBackup(
            buildBackupPayload(healedGrinds, payload.trophies, payload.sessions)
          );

          return { ok: true };
        },

        factoryReset: () => {
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LAST_BACKUP_KEY);
            localStorage.removeItem(ROLLING_BACKUPS_KEY);
            localStorage.removeItem(SESSION_ACTIVE_KEY);
          } catch {}

          set({
            version: 1,
            grinds: buildDefaultGrinds(),
            trophies: [],
            sessions: [],
            activeSession: null,
          });
        },

        listRollingBackups: () => {
          return readRollingBackups();
        },

        restoreRollingBackup: (index) => {
          const list = readRollingBackups();
          const chosen = list[index];
          if (!chosen) return { ok: false, error: "Backup not found" };

          const healedGrinds = selfHealGrinds(chosen.grinds);

          set({
            version: 1,
            grinds: healedGrinds,
            trophies: chosen.trophies,
            sessions: chosen.sessions,
            activeSession: null,
          });

          try {
            localStorage.removeItem(SESSION_ACTIVE_KEY);
            localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
          } catch {}

          pushRollingBackup(
            buildBackupPayload(healedGrinds, chosen.trophies, chosen.sessions)
          );

          return { ok: true };
        },

        clearRollingBackups: () => {
          try {
            localStorage.removeItem(ROLLING_BACKUPS_KEY);
          } catch {}
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,

      migrate: (persisted: any) => {
        const grinds = Array.isArray(persisted?.state?.grinds)
          ? (persisted.state.grinds as GrindEntry[])
          : [];
        const trophies = Array.isArray(persisted?.state?.trophies)
          ? (persisted.state.trophies as TrophyEntry[])
          : [];
        const sessions = Array.isArray(persisted?.state?.sessions)
          ? (persisted.state.sessions as SessionEntry[])
          : [];

        const healed = selfHealGrinds(grinds.length ? grinds : buildDefaultGrinds());

        return {
          ...persisted,
          state: {
            version: 1,
            grinds: healed,
            trophies,
            sessions,
            activeSession: null,
          },
        };
      },
    }
  )
);
