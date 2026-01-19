import React from "react";
import { useHunterStore } from "../store";
import BackupRestorePanel from "./BackupRestorePanel";

export default function Trophy() {
  // Great One Grind store guarantees trophies exists, but we still guard hard.
  const trophies = useHunterStore((s: any) => s.trophies) || [];

  const list = Array.isArray(trophies) ? trophies : [];

  return (
    <div className="p-4 space-y-4 text-slate-100">
      <h2 className="text-xl font-semibold">Trophy Gallery</h2>

      {list.length === 0 && (
        <div className="text-slate-400">
          No trophies yet.
        </div>
      )}

      {list.map((t: any) => (
        <div
          key={t.id}
          className="border border-slate-700 rounded p-3 space-y-1 bg-slate-900"
        >
          <div className="font-semibold">{t.species}</div>

          <div className="text-sm text-slate-400">
            Fur: {t.fur || "—"} | Horn: {t.horn || "—"}
          </div>

          <div className="text-sm text-slate-400">
            Date: {t.date ? new Date(t.date).toLocaleString() : "—"}
          </div>

          {/* If older trophy objects have isGreatOne, keep the badge */}
          {t.isGreatOne && (
            <div className="text-xs text-emerald-400 font-semibold">
              GREAT ONE
            </div>
          )}
        </div>
      ))}

      {/* Phase 1 Backup/Restore */}
      <BackupRestorePanel />
    </div>
  );
}
