// store.ts
// Phase 1 Backup/Restore wiring (export/import + factory reset + last backup timestamp)
// This file is intentionally self-contained and defensive.

import { create } from "zustand";

const STORAGE_KEY = "greatonegrind_v1";
const LAST_BACKUP_KEY = "greatonegrind_last_backup_v1";

// ---------- Types ----------
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
  updatedAt: number;
  createdAt: number;
};

export type TrophyEntry = {
  id: string;
  species: GreatOneSpecies;
  fur?: string;
  horn?: string;
  score?: string;
  date?: string;
  imageDataUrl?: string;
  createdAt: number;
};

export type AppState = {
  version: 1;
  grinds: GrindEntry[];
  trophies: TrophyEntry[];
  lastBackupAt: number | null;

  setKills: (id: string, kills: number) => void;
  setObtained: (id: string, obtained: boolean) => void;
  setFur: (id: string, fur: string) => void;

  addTrophy: (trophy: Omit<TrophyEntry, "id" | "createdAt"> & { id?: string; createdAt?: number }) => void;
  clearTrophies: () => void;

  exportBackup: () => string;
  importBackup: (text: string) => { ok: true } | { ok: false; error: string };
  markBackupNow: () => void;
  factoryReset: () => void;

  _persist: () => void;
  _selfHeal: () => void;
};

// ---------- Helpers ----------
function now() {
  return Date.now();
}

function safeJsonParse(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    const v = JSON.parse(text);
    return { ok: true, value: v };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

function isObject(v: any) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function clampInt(n: any, min: number, max: number) {
  const x = Number.isFinite(Number(n)) ? Math.floor(Number(n)) : min;
  return Math.max(min, Math.min(max, x));
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const PINNED_SPECIES: GreatOneSpecies[] = [
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

function buildDefaultGrinds(): GrindEntry[] {
  const t = now();
  return PINNED_SPECIES.map((species) => ({
    id: makeId("grind"),
    species,
    kills: 0,
    obtained: false,
    fur: "",
    notes: "",
    createdAt: t,
    updatedAt: t,
  }));
}

function loadLastBackupAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function saveLastBackupAt(ts: number | null) {
  try {
    if (!ts) {
      localStorage.removeItem(LAST_BACKUP_KEY);
      return;
    }
    localStorage.setItem(LAST_BACKUP_KEY, String(ts));
  } catch {}
}

function loadPersisted(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    if (!parsed.ok) return null;
    return parsed.value as Partial<AppState>;
  } catch {
    return null;
  }
}

function persistState(state: AppState) {
  try {
    const toSave = {
      version: state.version,
      grinds: state.grinds,
      trophies: state.trophies,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

function sanitizeIncomingState(anyState: any) {
  if (!isObject(anyState)) return null;
  if (anyState.version !== 1) return null;

  const grindsRaw = Array.isArray(anyState.grinds) ? anyState.grinds : [];
  const trophiesRaw = Array.isArray(anyState.trophies) ? anyState.trophies : [];

  const bySpecies = new Map<string, GrindEntry>();

  for (const g of grindsRaw) {
    if (!isObject(g)) continue;
    const species = g.species;
    if (!PINNED_SPECIES.includes(species)) continue;

    bySpecies.set(species, {
      id: typeof g.id === "string" ? g.id : makeId("grind"),
      species,
      kills: clampInt(g.kills, 0, 10_000_000),
      obtained: !!g.obtained,
      fur: typeof g.fur === "string" ? g.fur : "",
      notes: typeof g.notes === "string" ? g.notes : "",
      createdAt: Number(g.createdAt) || now(),
      updatedAt: Number(g.updatedAt) || now(),
    });
  }

  const healedGrinds = PINNED_SPECIES.map(
    (s) =>
      bySpecies.get(s) ?? {
        id: makeId("grind"),
        species: s,
        kills: 0,
        obtained: false,
        fur: "",
        notes: "",
        createdAt: now(),
        updatedAt: now(),
      }
  );

  const healedTrophies: TrophyEntry[] = [];
  for (const t of trophiesRaw) {
    if (!isObject(t)) continue;
    if (!PINNED_SPECIES.includes(t.species)) continue;

    healedTrophies.push({
      id: typeof t.id === "string" ? t.id : makeId("trophy"),
      species: t.species,
      fur: typeof t.fur === "string" ? t.fur : "",
      horn: typeof t.horn === "string" ? t.horn : "",
      score: typeof t.score === "string" ? t.score : "",
      date: typeof t.date === "string" ? t.date : "",
      imageDataUrl: typeof t.imageDataUrl === "string" ? t.imageDataUrl : undefined,
      createdAt: Number(t.createdAt) || now(),
    });
  }

  return { version: 1, grinds: healedGrinds, trophies: healedTrophies };
}

// ---------- Store ----------
const initialPersisted = loadPersisted();
const sanitized = sanitizeIncomingState(initialPersisted);

export const useStore = create<AppState>((set, get) => ({
  version: 1,
  grinds: sanitized?.grinds ?? buildDefaultGrinds(),
  trophies: sanitized?.trophies ?? [],
  lastBackupAt: loadLastBackupAt(),

  _persist: () => persistState(get()),

  _selfHeal: () => {
    const bySpecies = new Map(get().grinds.map((g) => [g.species, g]));
    const healed = PINNED_SPECIES.map((s) => bySpecies.get(s) ?? buildDefaultGrinds().find((x) => x.species === s)!);
    set({ grinds: healed });
    get()._persist();
  },

  setKills: (id, kills) => {
    set((s) => ({
      grinds: s.grinds.map((g) =>
        g.id === id ? { ...g, kills: clampInt(kills, 0, 10_000_000), updatedAt: now() } : g
      ),
    }));
    get()._persist();
  },

  setObtained: (id, obtained) => {
    set((s) => ({
      grinds: s.grinds.map((g) =>
        g.id === id ? { ...g, obtained: !!obtained, updatedAt: now() } : g
      ),
    }));
    get()._persist();
  },

  setFur: (id, fur) => {
    set((s) => ({
      grinds: s.grinds.map((g) =>
        g.id === id ? { ...g, fur: String(fur ?? ""), updatedAt: now() } : g
      ),
    }));
    get()._persist();
  },

  addTrophy: (t) => {
    const entry: TrophyEntry = {
      id: t.id ?? makeId("trophy"),
      species: t.species,
      fur: t.fur ?? "",
      horn: t.horn ?? "",
      score: t.score ?? "",
      date: t.date ?? new Date().toISOString(),
      imageDataUrl: t.imageDataUrl,
      createdAt: t.createdAt ?? now(),
    };

    set((s) => ({ trophies: [entry, ...s.trophies] }));
    get()._persist();
  },

  clearTrophies: () => {
    set({ trophies: [] });
    get()._persist();
  },

  exportBackup: () => JSON.stringify({ version: 1, grinds: get().grinds, trophies: get().trophies }, null, 2),

  importBackup: (text) => {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    const healed = sanitizeIncomingState(parsed.value);
    if (!healed) return { ok: false, error: "Invalid backup data" };

    set({ version: 1, grinds: healed.grinds, trophies: healed.trophies });
    const ts = now();
    set({ lastBackupAt: ts });
    saveLastBackupAt(ts);
    get()._persist();
    return { ok: true };
  },

  markBackupNow: () => {
    const ts = now();
    set({ lastBackupAt: ts });
    saveLastBackupAt(ts);
  },

  factoryReset: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_BACKUP_KEY);
    set({ version: 1, grinds: buildDefaultGrinds(), trophies: [], lastBackupAt: null });
    get()._persist();
  },
}));

export const useHunterStore = useStore;

try {
  useStore.getState()._selfHeal();
} catch {}
