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
  fur?: string; // keep flexible
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

  // UI/data safety
  lastBackupAt: number | null;

  // Actions
  setKills: (id: string, kills: number) => void;
  setObtained: (id: string, obtained: boolean) => void;
  setFur: (id: string, fur: string) => void;

  exportBackup: () => string;
  importBackup: (text: string) => { ok: true } | { ok: false; error: string };
  markBackupNow: () => void;
  factoryReset: () => void;

  // internal helpers
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
  } catch {
    // ignore
  }
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
  } catch {
    // ignore
  }
}

function sanitizeIncomingState(
  anyState: any
):
  | { ok: true; value: Pick<AppState, "version" | "grinds" | "trophies"> }
  | { ok: false; error: string } {
  if (!isObject(anyState)) return { ok: false, error: "Backup is not an object." };

  const version = anyState.version;
  if (version !== 1) return { ok: false, error: "Unsupported backup version." };

  const grindsRaw = Array.isArray(anyState.grinds) ? anyState.grinds : [];
  const trophiesRaw = Array.isArray(anyState.trophies) ? anyState.trophies : [];

  // Grinds: keep only valid entries & enforce pinned species structure
  const bySpecies = new Map<string, GrindEntry>();

  for (const g of grindsRaw) {
    if (!isObject(g)) continue;
    const species = g.species;
    if (!PINNED_SPECIES.includes(species)) continue;

    const id = typeof g.id === "string" && g.id.length ? g.id : makeId("grind");
    const createdAt = Number.isFinite(Number(g.createdAt)) ? Number(g.createdAt) : now();
    const updatedAt = Number.isFinite(Number(g.updatedAt)) ? Number(g.updatedAt) : now();

    bySpecies.set(species, {
      id,
      species,
      kills: clampInt(g.kills, 0, 10_000_000),
      obtained: Boolean(g.obtained),
      fur: typeof g.fur === "string" ? g.fur : "",
      notes: typeof g.notes === "string" ? g.notes : "",
      createdAt,
      updatedAt,
    });
  }

  const healedGrinds: GrindEntry[] = PINNED_SPECIES.map((species) => {
    const existing = bySpecies.get(species);
    return (
      existing ?? {
        id: makeId("grind"),
        species,
        kills: 0,
        obtained: false,
        fur: "",
        notes: "",
        createdAt: now(),
        updatedAt: now(),
      }
    );
  });

  // Trophies: accept array, sanitize shape
  const healedTrophies: TrophyEntry[] = [];
  for (const t of trophiesRaw) {
    if (!isObject(t)) continue;
    const species = t.species;
    if (!PINNED_SPECIES.includes(species)) continue;

    healedTrophies.push({
      id: typeof t.id === "string" && t.id.length ? t.id : makeId("trophy"),
      species,
      fur: typeof t.fur === "string" ? t.fur : "",
      horn: typeof t.horn === "string" ? t.horn : "",
      score: typeof t.score === "string" ? t.score : "",
      date: typeof t.date === "string" ? t.date : "",
      imageDataUrl: typeof t.imageDataUrl === "string" ? t.imageDataUrl : undefined,
      createdAt: Number.isFinite(Number(t.createdAt)) ? Number(t.createdAt) : now(),
    });
  }

  return { ok: true, value: { version: 1, grinds: healedGrinds, trophies: healedTrophies } };
}

// ---------- Store ----------
const initialPersisted = loadPersisted();

const initialStateBase = {
  version: 1 as const,
  grinds: buildDefaultGrinds(),
  trophies: [] as TrophyEntry[],
};

const mergedInitial = (() => {
  // merge persisted if usable
  const candidate = initialPersisted;
  if (!candidate || !isObject(candidate) || candidate.version !== 1) return initialStateBase;

  const sanitized = sanitizeIncomingState(candidate);
  if (!sanitized.ok) return initialStateBase;
  return { ...initialStateBase, ...sanitized.value };
})();

export const useStore = create<AppState>((set, get) => ({
  version: 1,
  grinds: mergedInitial.grinds,
  trophies: mergedInitial.trophies,

  lastBackupAt: loadLastBackupAt(),

  _persist: () => {
    persistState(get());
  },

  _selfHeal: () => {
    // Ensure pinned grinds always exist exactly once
    const state = get();
    const bySpecies = new Map<string, GrindEntry>();
    for (const g of state.grinds) {
      if (!PINNED_SPECIES.includes(g.species)) continue;
      if (!bySpecies.has(g.species)) bySpecies.set(g.species, g);
    }
    const defaults = buildDefaultGrinds();
    const healed = PINNED_SPECIES.map((s) => bySpecies.get(s) ?? defaults.find((x) => x.species === s)!);
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
      grinds: s.grinds.map((g) => (g.id === id ? { ...g, obtained: Boolean(obtained), updatedAt: now() } : g)),
    }));
    get()._persist();
  },

  setFur: (id, fur) => {
    set((s) => ({
      grinds: s.grinds.map((g) => (g.id === id ? { ...g, fur: String(fur ?? ""), updatedAt: now() } : g)),
    }));
    get()._persist();
  },

  exportBackup: () => {
    // export ONLY the persisted payload (not UI fields)
    const s = get();
    const payload = {
      version: s.version,
      grinds: s.grinds,
      trophies: s.trophies,
      exportedAt: new Date().toISOString(),
      app: "Great One Grind",
    };
    return JSON.stringify(payload, null, 2);
  },

  importBackup: (text) => {
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return { ok: false, error: `Invalid JSON: ${parsed.error}` };

    const sanitized = sanitizeIncomingState(parsed.value);
    if (!sanitized.ok) return { ok: false, error: sanitized.error };

    set({
      version: 1,
      grinds: sanitized.value.grinds,
      trophies: sanitized.value.trophies,
    });

    // mark backup time as "now" since user restored successfully
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
    // Hard reset: wipe storage + reset store
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_BACKUP_KEY);
    } catch {
      // ignore
    }

    set({
      version: 1,
      grinds: buildDefaultGrinds(),
      trophies: [],
      lastBackupAt: null,
    });

    // persist fresh defaults
    get()._persist();
  },
}));

// ✅ Compatibility export: some components expect useHunterStore
export const useHunterStore = useStore;

// Self-heal once on load (safe no-op if already correct)
try {
  useStore.getState()._selfHeal();
} catch {
  // ignore
}
