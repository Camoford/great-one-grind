// components/SettingsPanel.tsx
import React, { useMemo, useRef, useState } from "react";
import { useHunterStore } from "../store";

/**
 * Feature B — Backup UI in Settings
 * - Export backup (download JSON)
 * - Import backup (upload JSON)
 * - Restore last 5 auto-backups
 *
 * Defensive wiring:
 * We don't assume exact store function/key names.
 * We try common candidates; if missing, we fall back to localStorage scanning.
 */

type AnyObj = Record<string, any>;

function isFn(v: any) {
  return typeof v === "function";
}

function safeGetState(): AnyObj | null {
  try {
    return (useHunterStore as any).getState?.() ?? null;
  } catch {
    return null;
  }
}

function tryCall(fn: any, args: any[] = []) {
  try {
    fn(...args);
    return true;
  } catch {
    return false;
  }
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatDateTime(ms?: number) {
  if (!ms || typeof ms !== "number") return "—";
  const d = new Date(ms);
  return d.toLocaleString();
}

/**
 * Attempt to find an auto-backups list from store state.
 * Common patterns:
 * - state.autoBackups: Backup[]
 * - state.backups: Backup[]
 * - state.recentBackups: Backup[]
 * A "Backup" may be { createdAt, ts, data, payload, json } etc.
 */
function readAutoBackupsFromStore(state: AnyObj | null): any[] {
  if (!state) return [];
  const list =
    state.autoBackups ??
    state.autobackups ??
    state.recentBackups ??
    state.backups ??
    state.lastBackups ??
    null;

  return Array.isArray(list) ? list : [];
}

/**
 * Fallback: scan localStorage for likely backup keys.
 * We prefer a key that contains an array and looks like "auto" + "backup".
 */
function readAutoBackupsFromLocalStorage(): any[] {
  try {
    const keys = Object.keys(localStorage);

    const candidateKeys = keys
      .filter((k) => {
        const lk = k.toLowerCase();
        return (
          (lk.includes("backup") && lk.includes("auto")) ||
          lk.includes("autobackup") ||
          lk.includes("auto_backup") ||
          lk.includes("backups_last") ||
          lk.includes("rolling_backup")
        );
      })
      .sort((a, b) => a.length - b.length);

    for (const k of candidateKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      // sometimes stored as { backups: [...] }
      if (parsed && Array.isArray(parsed.backups) && parsed.backups.length > 0) return parsed.backups;
    }
  } catch {
    // ignore
  }
  return [];
}

export default function SettingsPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional: existing beta disclaimer reset pattern (keep safe)
  const handleViewDisclaimer = () => {
    try {
      localStorage.removeItem("beta_disclaimer_seen");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const handleResetApp = () => {
    const confirmed = window.confirm(
      "This will erase ALL app data including grinds, stats, trophies, and backups.\n\nAre you sure you want to continue?"
    );
    if (!confirmed) return;

    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  // --- Backup wiring (defensive) ---
  const state = safeGetState();

  // We try to find store functions for export/import/restore.
  const exportFn =
    (state && (state.exportBackup ?? state.exportAppBackup ?? state.downloadBackup ?? state.createExport)) ||
    null;

  const importFn =
    (state && (state.importBackup ?? state.importAppBackup ?? state.restoreBackup ?? state.applyBackup)) ||
    null;

  const restoreAutoFn =
    (state &&
      (state.restoreAutoBackup ??
        state.restoreFromAutoBackup ??
        state.restoreBackupByIndex ??
        state.loadAutoBackup)) ||
    null;

  const lastBackupTs: number | undefined =
    state?.lastBackupAt ??
    state?.lastBackupTs ??
    state?.lastBackupTime ??
    state?.backupLastAt ??
    undefined;

  const autoBackups = useMemo(() => {
    const fromStore = readAutoBackupsFromStore(state);
    if (fromStore.length) return fromStore;

    const fromLS = readAutoBackupsFromLocalStorage();
    return fromLS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastBackupTs]); // refresh if store updates timestamp

  const [status, setStatus] = useState<string>("");

  const doExport = () => {
    setStatus("");

    // Preferred: store export function returns an object or string
    if (isFn(exportFn)) {
      // Try common signatures:
      // exportBackup() => object|string
      // exportBackup(true) => include meta
      try {
        const out = exportFn();
        const payload = typeof out === "string" ? out : JSON.stringify(out ?? {}, null, 2);
        const filename = `great-one-grind-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
        downloadTextFile(filename, payload);
        setStatus("Exported backup file.");
        return;
      } catch {
        // fall through
      }
    }

    // Fallback: snapshot localStorage (works even if store export not exposed)
    try {
      const snapshot: AnyObj = {};
      for (const k of Object.keys(localStorage)) {
        snapshot[k] = localStorage.getItem(k);
      }
      const filename = `great-one-grind-localstorage-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
      downloadTextFile(filename, JSON.stringify({ type: "localStorageSnapshot", createdAt: Date.now(), snapshot }, null, 2));
      setStatus("Exported localStorage snapshot (fallback).");
      return;
    } catch {
      setStatus("Export failed. (No export function found and localStorage snapshot failed.)");
    }
  };

  const openImportPicker = () => {
    setStatus("");
    fileInputRef.current?.click();
  };

  const doImportFromText = (text: string) => {
    // Try to parse JSON first
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      setStatus("Import failed: file is not valid JSON.");
      return;
    }

    // Preferred: store import function
    if (isFn(importFn)) {
      // Try common signatures:
      // importBackup(obj)
      // importBackup(jsonString)
      // importBackup(obj, { merge: false })
      const ok =
        tryCall(importFn, [parsed]) ||
        tryCall(importFn, [text]) ||
        tryCall(importFn, [parsed, { merge: false }]) ||
        tryCall(importFn, [parsed, { replace: true }]);

      if (ok) {
        setStatus("Imported backup. Reloading…");
        setTimeout(() => window.location.reload(), 250);
        return;
      }
    }

    // Fallback: if it's a localStorage snapshot, restore keys
    if (parsed?.type === "localStorageSnapshot" && parsed?.snapshot && typeof parsed.snapshot === "object") {
      try {
        // WARNING: This overwrites keys contained in the snapshot
        for (const [k, v] of Object.entries(parsed.snapshot)) {
          if (typeof v === "string") localStorage.setItem(k, v);
          else if (v === null) localStorage.removeItem(k);
          else localStorage.setItem(k, String(v));
        }
        setStatus("Imported localStorage snapshot (fallback). Reloading…");
        setTimeout(() => window.location.reload(), 250);
        return;
      } catch {
        setStatus("Import failed while restoring localStorage snapshot.");
        return;
      }
    }

    setStatus("Import failed: no compatible import method found in store, and file wasn’t a snapshot.");
  };

  const onFilePicked: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      const text = await f.text();
      doImportFromText(text);
    } catch {
      setStatus("Import failed: could not read file.");
    } finally {
      // allow picking the same file again
      e.target.value = "";
    }
  };

  const restoreAutoBackup = (idx: number) => {
    setStatus("");

    const backup = autoBackups[idx];

    if (!backup) {
      setStatus("Restore failed: backup not found.");
      return;
    }

    // Preferred: store restore function (by index or by backup object)
    if (isFn(restoreAutoFn)) {
      const ok = tryCall(restoreAutoFn, [idx]) || tryCall(restoreAutoFn, [backup]);
      if (ok) {
        setStatus(`Restored auto-backup #${idx + 1}. Reloading…`);
        setTimeout(() => window.location.reload(), 250);
        return;
      }
    }

    // Fallback: if backup contains a localStorage snapshot-like payload
    const payload = backup?.snapshot ?? backup?.data ?? backup?.payload ?? backup ?? null;

    // If payload is a stringified JSON snapshot
    if (typeof payload === "string") {
      doImportFromText(payload);
      return;
    }

    // If payload is an object, try treating it as localStorage key map
    if (payload && typeof payload === "object") {
      // Two possibilities:
      // 1) { type: "localStorageSnapshot", snapshot: {...} }
      // 2) { someKey: "value", otherKey: "value" }
      if (payload.type === "localStorageSnapshot" && payload.snapshot) {
        doImportFromText(JSON.stringify(payload));
        return;
      }

      try {
        for (const [k, v] of Object.entries(payload)) {
          if (typeof v === "string") localStorage.setItem(k, v);
        }
        setStatus(`Restored auto-backup #${idx + 1} (fallback). Reloading…`);
        setTimeout(() => window.location.reload(), 250);
        return;
      } catch {
        // ignore
      }
    }

    setStatus("Restore failed: no compatible restore method found.");
  };

  return (
    <div className="space-y-6 px-2">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Backup UI */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Backups</div>
            <div className="mt-1 text-sm text-white/60">
              Last backup: <span className="font-medium text-white/80">{formatDateTime(lastBackupTs)}</span>
            </div>
            <div className="mt-1 text-xs text-white/40">
              Export a backup before big changes. Import restores your data. Auto-backups keep the last 5 snapshots.
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={doExport}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:opacity-90 active:opacity-80"
          >
            Export Backup
          </button>

          <button
            onClick={openImportPicker}
            className="rounded-xl border border-white/15 bg-white/10 text-white px-4 py-2 text-sm font-semibold hover:bg-white/15 active:opacity-90"
          >
            Import Backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFilePicked}
          />
        </div>

        {status && <div className="mt-3 text-sm text-white/80">{status}</div>}

        {/* Auto-backups list */}
        <div className="mt-5">
          <div className="text-sm font-semibold">Restore auto-backup</div>
          {autoBackups.length === 0 ? (
            <div className="mt-2 text-sm text-white/50">No auto-backups found yet.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {autoBackups.slice(0, 5).map((b: any, i: number) => {
                const ts =
                  b?.createdAt ??
                  b?.ts ??
                  b?.time ??
                  b?.timestamp ??
                  b?.at ??
                  null;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Auto-backup #{i + 1}</div>
                      <div className="text-xs text-white/50 truncate">
                        {ts ? `Created: ${formatDateTime(Number(ts))}` : "Created: —"}
                      </div>
                    </div>

                    <button
                      onClick={() => restoreAutoBackup(i)}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                    >
                      Restore
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Utilities */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-lg font-semibold">Utilities</div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleViewDisclaimer}
            className="rounded-xl border border-white/15 bg-white/10 text-white px-4 py-2 text-sm font-semibold hover:bg-white/15"
          >
            View Beta Disclaimer Again
          </button>

          <button
            onClick={handleResetApp}
            className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-100 px-4 py-2 text-sm font-semibold hover:bg-red-500/15"
          >
            Factory Reset App
          </button>
        </div>

        <div className="mt-2 text-xs text-white/45">
          Factory reset clears local data on this device. Export a backup first if you want to keep your progress.
        </div>
      </div>
    </div>
  );
}
