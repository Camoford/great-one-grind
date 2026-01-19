import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SPECIES } from "./constants";

/* ---------------- TYPES ---------------- */

export type Species = {
  id: string;
  name: string;
  fabledFurs: string[];
  kills?: number;
  obtained?: string[];
};

export type AppState = {
  version: number;
  species: Species[];
  lastUpdated: number;
  isSyncing: boolean;
  hardcoreMode: boolean;
};

/* ---------------- CONSTANTS ---------------- */

const STORAGE_KEY = "great-one-grind.state";
const STORAGE_VERSION = 1;

/* ---------------- SEED / SELF-HEAL ---------------- */

function buildDefaultState(): AppState {
  return {
    version: STORAGE_VERSION,
    species: DEFAULT_SPECIES.map((s) => ({
      ...s,
      kills: 0,
      obtained: [],
    })),
    lastUpdated: Date.now(),
    isSyncing: false,
    hardcoreMode: false,
  };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function ensureSeeded(): AppState {
  const parsed = safeParse<AppState>(localStorage.getItem(STORAGE_KEY));

  const looksValid =
    parsed &&
    typeof parsed.version === "number" &&
    Array.isArray(parsed.species) &&
    parsed.species.length >= 5;

  if (!looksValid || parsed!.version !== STORAGE_VERSION) {
    const fresh = buildDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  // Merge in new species if constants grew
  const defaultState = buildDefaultState();
  const existingIds = new Set(parsed!.species.map((s) => s.id));
  const mergedSpecies = [
    ...parsed!.species,
    ...defaultState.species.filter((s) => !existingIds.has(s.id)),
  ];

  const merged: AppState = {
    ...parsed!,
    version: STORAGE_VERSION,
    species: mergedSpecies,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/* ---------------- ZUSTAND STORE ---------------- */

type StoreActions = {
  incrementKill: (speciesId: string) => void;
  toggleObtained: (speciesId: string, fur: string) => void;
  resetData: () => void;
  toggleHardcore: () => void;
  importState: (code: string) => void;
  exportState: () => string;
};

export const useHunterStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => {
      const seeded = ensureSeeded();

      return {
        ...seeded,

        incrementKill: (speciesId) =>
          set((state) => ({
            ...state,
            isSyncing: true,
            species: state.species.map((s) =>
              s.id === speciesId ? { ...s, kills: (s.kills || 0) + 1 } : s
            ),
            lastUpdated: Date.now(),
            isSyncing: false,
          })),

        toggleObtained: (speciesId, fur) =>
          set((state) => ({
            ...state,
            isSyncing: true,
            species: state.species.map((s) =>
              s.id === speciesId
                ? {
                    ...s,
                    obtained: s.obtained?.includes(fur)
                      ? s.obtained.filter((f) => f !== fur)
                      : [...(s.obtained || []), fur],
                  }
                : s
            ),
            lastUpdated: Date.now(),
            isSyncing: false,
          })),

        resetData: () => {
          const fresh = buildDefaultState();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          set(fresh);
        },

        toggleHardcore: () =>
          set((state) => ({
            ...state,
            hardcoreMode: !state.hardcoreMode,
            lastUpdated: Date.now(),
          })),

        importState: (code) => {
          try {
            const json = atob(code);
            const parsed = JSON.parse(json) as AppState;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            set(parsed);
          } catch {
            throw new Error("Invalid import data");
          }
        },

        exportState: () => {
          const state = get();
          const json = JSON.stringify(state);
          return btoa(json);
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
    }
  )
);
