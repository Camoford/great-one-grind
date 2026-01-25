// src/features/archive/GreatOnesArchive.tsx
import React, { useMemo, useState } from "react";

// ✅ READ-ONLY store/history access (no mutations)
import { useHunterStore } from "../../../store";
import { readSessionHistory } from "../../../utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateTime(ts: number) {
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    const min = pad2(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${h}:${min} ${ampm}`;
  } catch {
    return "";
  }
}

/* ---------------- component ---------------- */

export default function GreatOnesArchive() {
  // READ-ONLY store
  const trophies = useHunterStore((s) => s.trophies);

  // UI-only modal state
  const [showCodex, setShowCodex] = useState(false);

  // Keep session history read-only (no changes)
  const sessionHistory = useMemo(() => {
    try {
      const list = readSessionHistory();
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, []);

  const isEmpty = !trophies || trophies.length === 0;

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Great One Tracker
        </h1>
        <div style={{ opacity: 0.65, fontSize: 13 }}>
          Read-only history & archive
        </div>
      </div>

      {/* EMPTY STATE */}
      {isEmpty ? (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            History → Great One Tracker is empty.
          </div>
          <div
            style={{
              marginTop: 6,
              opacity: 0.75,
              fontSize: 13,
              lineHeight: 1.35,
            }}
          >
            Here’s a fun Codex image to look at (read-only). This does not affect
            trophies, sessions, history, or anything locked.
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setShowCodex(true)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              View Great One Codex
            </button>

            <div style={{ opacity: 0.55, fontSize: 12, alignSelf: "center" }}>
              (Visual only — no tracking)
            </div>
          </div>

          <div style={{ marginTop: 12, opacity: 0.55, fontSize: 12 }}>
            Session history entries: {pretty(sessionHistory.length)}
          </div>
        </div>
      ) : (
        /* NON-EMPTY STATE (simple read-only list) */
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800 }}>
              Obtained Great Ones
            </div>

            <button
              type="button"
              onClick={() => setShowCodex(true)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Codex
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {[...trophies]
              .slice()
              .sort((a: any, b: any) => (b.obtainedAt || 0) - (a.obtainedAt || 0))
              .map((t: any, idx: number) => (
                <div
                  key={`${t.species}-${t.obtainedAt || idx}-${idx}`}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>
                      {t.species || "Unknown"}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>
                      {t.obtainedAt ? formatDateTime(t.obtainedAt) : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      opacity: 0.8,
                      fontSize: 13,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {typeof t.killsAtObtained === "number" ? (
                      <div>
                        <span style={{ opacity: 0.7 }}>Kills:</span>{" "}
                        <span style={{ fontWeight: 800 }}>
                          {pretty(t.killsAtObtained)}
                        </span>
                      </div>
                    ) : null}
                    {t.fur ? (
                      <div>
                        <span style={{ opacity: 0.7 }}>Fur:</span>{" "}
                        <span style={{ fontWeight: 800 }}>{t.fur}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* CODEX MODAL (UI ONLY) */}
      {showCodex ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCodex(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(980px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(18,18,18,0.92)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: "12px 12px",
                background: "rgba(18,18,18,0.92)",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontWeight: 900 }}>
                Great One Codex (Visual)
              </div>
              <button
                type="button"
                onClick={() => setShowCodex(false)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 12 }}>
              <img
                src="/great-one-codex.png"
                alt="Great One Codex"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
              <div
                style={{
                  marginTop: 10,
                  opacity: 0.7,
                  fontSize: 12,
                  lineHeight: 1.35,
                }}
              >
                Read-only visual reference. This does not affect tracking,
                trophies, sessions, or history.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
