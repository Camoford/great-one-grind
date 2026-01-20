// components/SettingsPanel.tsx
import React, { useMemo, useRef, useState } from "react";
import { useHunterStore } from "../store";

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

// We will ALWAYS store rolling auto-backups here (guaranteed).
const FALLBACK_AUTO_BACKUPS_KEY = "greatonegrind_auto_backups_v1";

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

function readAutoBackupsFromLocalStorageSmart(): { backups: any[]; debugKeys: string[] } {
  const debugKeys: string[] = [];
  let best: any[] = [];

  try {
    const keys = Object.keys(localStorage);

    // 1) Always check our fallback key first
    if (keys.includes(FALLBACK_AUTO_BACKUPS_KEY)) {
      debugKeys.push(FALLBACK_AUTO_BACKUPS_KEY);
      const raw = localStorage.getItem(FALLBACK_AUTO_BACKUPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { backups: parsed, debugKeys };
        if (parsed?.backups && Array.isArray(parsed.backups)) return { backups: parsed.backups, debugKeys };
      }
    }

    // 2) Scan ANY key containing "backup" (not only "auto")
    const candidateKeys = keys
      .filter((k) => k.toLowerCase().includes("backup"))
      .sort((a, b) => a.length - b.length);

    for (const k of candidateKeys) {
      debugKeys.push(k);
      const raw = localStorage.getItem(k);
      if (!raw) continue;

      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }

      // Common shapes:
      // - [ ... ] array
      // - { backups: [ ... ] }
      // - { autoBackups: [ ... ] }
      // - { recentBackups: [ ... ] }
      if (Array.isArray(parsed) && parsed.length) {
        best = parsed;
        break;
      }
      if (parsed?.backups && Array.isArray(parsed.backups) && parsed.backups.length) {
        best = parsed.backups;
        break;
      }
      if (parsed?.autoBackups && Array.isArray(parsed.autoBackups) && parsed.autoBackups.length) {
        best = parsed.autoBackups;
        break;
      }
      if (parsed?.recentBackups && Array.isArray(parsed.recentBackups) && parsed.recentBackups.length) {
        best = parsed.recentBackups;
        break;
      }
    }
  } catch {
    // ignore
  }

  return { backups: best, debugKeys };
}

function takeLocalStorageSnapshot() {
  const snapshot: AnyObj = {};
  for (const k of Object.keys(localStorage)) {
    snapshot[k] = localStorage.getItem(k);
  }
  return { type: "localStorageSnapshot", createdAt: Date.now(), snapshot };
}

function appendFallbackAutoBackup(payload: any) {
  const entry = {
    createdAt: Date.now(),
    payload, // can be object or string
  };

  let list: any[] = [];
  try {
    const raw = localStorage.getItem(FALLBACK_AUTO_BACKUPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed?.backups && Array.isArray(parsed.backups)) list = parsed.backups;
    }
  } catch {
    // ignore
  }

  list.unshift(entry);
  list = list.slice(0, 5);

  localStorage.setItem(FALLBACK_AUTO_BACKUPS_KEY, JSON.stringify(list));
  return list;
}

export default function SettingsPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleViewDisclaimer = () => {
    try {
      localStorage.removeItem("beta_disclaimer_seen");
    } catch {}
    window.location.reload();
  };

  const handleResetApp = () => {
    const confirmed = window.confirm(
      "This will erase ALL app data including grinds, stats, trophies, and backups.\n\nAre you sure you want to continue?"
    );
    if (!confirmed) return;

    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  const state = safeGetState();

  // Try to use store functions if they exist
  const exportFn =
    (state && (state.exportBackup ?? state.exportAppBackup ?? state.downloadBackup ?? state.createExport)) || null;

  const importFn =
    (state && (state.importBackup ?? state.importAppBackup ?? state.restoreBackup ?? state.applyBackup)) || null;

  const restoreAutoFn =
    (state &&
      (state.restoreAutoBackup ??
        state.restoreFromAutoBackup ??
        state.restoreBackupByIndex ??
        state.loadAutoBackup)) ||
    null;

  const lastBackupTs: number | undefined =
    state?.lastBackupAt ?? state?.lastBackupTs ?? state?.lastBackupTime ?? state?.backupLastAt ?? undefined;

  const { autoBackups, debugKeys } = useMemo(() => {
    const fromStore = readAutoBackupsFromStore(state);
    if (fromStore.length) return { autoBackups: fromStore, debugKeys: ["(from store)"] };

    const fromLS = readAutoBackupsFromLocalStorageSmart();
    return { autoBackups: fromLS.backups, debugKeys: fromLS.debugKeys };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastBackupTs]);

  const [status, setStatus] = useState<string>("");
  const [showDebug, setShowDebug] = useState<boolean>(false);

  const doExport = () => {
    setStatus("");

    // Preferred: store export function returns object|string
    if (isFn(exportFn)) {
      try {
        const out = exportFn();
        const payloadObj = typeof out === "string" ? out : JSON.stringify(out ?? {}, null, 2);
        const filename = `great-one-grind-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
        downloadTextFile(filename, payloadObj);
        setStatus("Exported backup file.");
        return;
      } catch {
        // fall through
      }
    }

    // Fallback: localStorage snapshot export
    try {
      const snap = takeLocalStorageSnapshot();
      const filename = `great-one-grind-localstorage-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
      downloadTextFile(filename, JSON.stringify(snap, null, 2));
      setStatus("Exported localStorage snapshot (fallback).");
    } catch {
      setStatus("Export failed.");
    }
  };

  const createAutoBackupNow = () => {
    setStatus("");

    // If store has a dedicated function, use it
    const maybeCreate =
      state?.createAutoBackup ?? state?.makeAutoBackup ?? state?.saveAutoBackup ?? state?.addAutoBackup ?? null;

    if (isFn(maybeCreate)) {
      const ok = tryCall(maybeCreate, []);
      if (ok) {
        setStatus("Created auto-backup (store). Go back to this screen or refresh.");
        return;
      }
    }

    // Otherwise: force-create a rolling auto-backup ourselves (guaranteed)
    // Prefer store export payload if available; else snapshot localStorage
    let payload: any = null;

    if (isFn(exportFn)) {
      try {
        const out = exportFn();
        payload = out;
      } catch {
        payload = null;
      }
    }

    if (!payload) payload = takeLocalStorageSnapshot();

    try {
      appendFallbackAutoBackup(payload);
      setStatus("Created auto-backup (fallback).");
    } catch {
      setStatus("Failed to create auto-backup.");
    }
  };

  const openImportPicker = () => {
    setStatus("");
    fileInputRef.current?.click();
  };

  const doImportFromText = (text: string) => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      setStatus("Import failed: file is not valid JSON.");
      return;
    }

    // Preferred: store import
    if (isFn(importFn)) {
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

    // Fallback: restore localStorage snapshot
    if (parsed?.type === "localStorageSnapshot" && parsed?.snapshot && typeof parsed.snapshot === "object") {
      try {
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

    setStatus("Import failed: no compatible import method found.");
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

    // Preferred: store restore
    if (isFn(restoreAutoFn)) {
      const ok = tryCall(restoreAutoFn, [idx]) || tryCall(restoreAutoFn, [backup]);
      if (ok) {
        setStatus(`Restored auto-backup #${idx + 1}. Reloading…`);
        setTimeout(() => window.location.reload(), 250);
        return;
      }
    }

    // Fallback: if backup has payload, import it
    const payload = backup?.payload ?? backup?.snapshot ?? backup?.data ?? backup?.payload ?? backup ?? null;

    if (typeof payload === "string") {
      doImportFromText(payload);
      return;
    }

    if (payload && typeof payload === "object") {
      if (payload.type === "localStorageSnapshot" && payload.snapshot) {
        doImportFromText(JSON.stringify(payload));
        return;
      }

      // treat as localStorage map
      try {
        for (const [k, v] of Object.entries(payload)) {
          if (typeof v === "string") localStorage.setItem(k, v);
        }
        setStatus(`Restored auto-backup #${idx + 1} (fallback). Reloading…`);
        setTimeout(() => window.location.reload(), 250);
        return;
      } catch {}
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

          <button
            onClick={createAutoBackupNow}
            className="rounded-xl border border-white/15 bg-white/10 text-white px-4 py-2 text-sm font-semibold hover:bg-white/15 active:opacity-90"
          >
            Create Auto-backup Now
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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Restore auto-backup</div>
            <button
              onClick={() => setShowDebug((v) => !v)}
              className="text-xs text-white/50 hover:text-white/80"
            >
              {showDebug ? "Hide debug" : "Show debug"}
            </button>
          </div>

          {autoBackups.length === 0 ? (
            <div className="mt-2 text-sm text-white/50">No auto-backups found yet.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {autoBackups.slice(0, 5).map((b: any, i: number) => {
                const ts =
                  b?.createdAt ?? b?.ts ?? b?.time ?? b?.timestamp ?? b?.at ?? null;

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

          {showDebug && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/55">
              <div className="font-semibold text-white/70">Debug</div>
              <div className="mt-1">Scanned localStorage keys containing “backup”:</div>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                {(debugKeys.length ? debugKeys : ["(none)"]).map((k, idx) => (
                  <li key={idx}>{k}</li>
                ))}
              </ul>
              <div className="mt-2">Fallback auto-backups key:</div>
              <div className="mt-1 font-mono text-white/70">{FALLBACK_AUTO_BACKUPS_KEY}</div>
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
