
// Great One Grind - Self-Healing Store
// If browser storage resets, this file auto-rebuilds all animals + rare furs

import { DEFAULT_SPECIES } from "./constants";

export type Species = {
  id: string;
  name: string;
  fabledFurs: string[];
};

export type AppState = {
  version: number;
  species: Species[];
};

const STORAGE_KEY = "great-one-grind.state";
const STORAGE_VERSION = 1;

// Build a fresh default state (used when storage is empty or corrupt)
export function buildDefaultState(): AppState {
  return {
    version: STORAGE_VERSION,
    species: DEFAULT_SPECIES as Species[],
  };
}

// Safe JSON parse (never crashes)
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// MAIN self-heal function
export function ensureSeeded(): AppState {
  const parsed = safeParse<AppState>(localStorage.getItem(STORAGE_KEY));

  const looksValid =
    parsed &&
    typeof parsed.version === "number" &&
    Array.isArray(parsed.species) &&
    parsed.species.length >= 5;

  // If storage is missing, corrupt, or empty → rebuild it
  if (!looksValid) {
    const fresh = buildDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  // If version mismatch → rebuild (future-proofing)
  if (parsed.version !== STORAGE_VERSION) {
    const fresh = buildDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  // If new species were added in code, merge them into existing storage
  const defaultState = buildDefaultState();
  const existingIds = new Set(parsed.species.map((s) => s.id));
  const mergedSpecies = [
    ...parsed.species,
    ...defaultState.species.filter((s) => !existingIds.has(s.id)),
  ];

  const merged: AppState = {
    ...parsed,
    version: STORAGE_VERSION,
    species: mergedSpecies,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

// Load state (always self-heals first)
export function loadState(): AppState {
  return ensureSeeded();
}

// Save state helper
export function saveState(next: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
