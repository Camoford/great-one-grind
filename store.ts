import { useState, useEffect, useCallback } from 'react';
import { AppState, MapTiles } from './types';
import { INITIAL_SPECIES } from './constants';

// OLD localStorage key (what you had before)
const STORAGE_KEY = 'hunters_log_data_v3';

// NEW IndexedDB key
const DB_NAME = 'hunterslog-db';
const STORE_NAME = 'appState';
const STATE_KEY = 'hunters_log_state_v4';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// IMPORTANT: Keep your app’s real initial state fields here.
// This version matches the common fields you showed.
function buildInitialState(): AppState {
  return {
    activeReserveId: 'layton',
    customMapTiles: {},
    species: INITIAL_SPECIES as any,
    lastUpdated: Date.now(),
  } as any;
}

export function useHunterStore() {
  const [state, setState] = useState<AppState & { isSyncing: boolean }>(() => {
    // start minimal, load from IDB in effect
    return { ...(buildInitialState() as any), isSyncing: true };
  });

  // LOAD from IndexedDB and migrate old localStorage once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Try IDB first
        const saved = await idbGet<AppState>(STATE_KEY);
        if (saved && !cancelled) {
          setState({ ...(saved as any), isSyncing: false });
          return;
        }

        // 2) If no IDB, try old localStorage (migration)
        const old = localStorage.getItem(STORAGE_KEY);
        if (old && !cancelled) {
          const parsed = JSON.parse(old);
          // Save migrated version into IDB
          await idbSet(STATE_KEY, parsed);
          // Optional: remove old localStorage (prevents future quota issues)
          try { localStorage.removeItem(STORAGE_KEY); } catch {}
          setState({ ...(parsed as any), isSyncing: false });
          return;
        }

        // 3) Otherwise initial
        if (!cancelled) setState(prev => ({ ...prev, isSyncing: false }));
      } catch (e) {
        console.error('Failed to load state', e);
        if (!cancelled) setState(prev => ({ ...prev, isSyncing: false }));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // SAVE to IndexedDB (no 5MB limit like localStorage)
  useEffect(() => {
    if (state.isSyncing) return;

    const { isSyncing, ...persisted } = state as any;

    const t = setTimeout(() => {
      idbSet(STATE_KEY, persisted).catch((e) => {
        console.error('Failed to save state to IDB', e);
      });
    }, 150);

    return () => clearTimeout(t);
  }, [state]);

  const setCustomMapTile = useCallback((reserveId: string, tileKey: keyof MapTiles, value: string) => {
    setState(prev => ({
      ...(prev as any),
      customMapTiles: {
        ...(prev.customMapTiles || {}),
        [reserveId]: {
          ...((prev.customMapTiles?.[reserveId] || {}) as any),
          [tileKey]: value
        }
      },
      lastUpdated: Date.now()
    }));
  }, []);

  const clearCustomMap = useCallback((reserveId: string) => {
    setState(prev => {
      const next = { ...(prev as any) };
      const tiles = { ...(next.customMapTiles || {}) };
      delete tiles[reserveId];
      next.customMapTiles = tiles;
      next.lastUpdated = Date.now();
      return next;
    });
  }, []);

  const importState = useCallback((incoming: AppState) => {
    setState({ ...(incoming as any), isSyncing: false });
  }, []);

  const getShareableLink = useCallback(() => {
    try {
      const { isSyncing, ...persisted } = state as any;
      const data = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(persisted)))));
      return `${window.location.origin}${window.location.pathname}#sync=${data}`;
    } catch {
      return window.location.href;
    }
  }, [state]);

  return {
    state,
    setState,
    importState,
    setCustomMapTile,
    clearCustomMap,
    getShareableLink,
  };
}
