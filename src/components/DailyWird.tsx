import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dhikr {
  id: string;
  text: string;
  count: number;
  remaining: number;
  source?: string;
}

interface QuranGoal {
  unit: "pages" | "juz";
  goal: number;
  done: number;
  date: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const WIRD_ITEMS: Omit<Dhikr, "remaining">[] = [
  { id: "w1", count: 33,  text: "سُبْحَانَ اللهِ",        source: "33 مرة" },
  { id: "w2", count: 33,  text: "الْحَمْدُ للهِ",         source: "33 مرة" },
  { id: "w3", count: 34,  text: "اللهُ أَكْبَرُ",          source: "34 مرة (المجموع 100)" },
  { id: "w4", count: 100, text: "لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", source: "مئة مرة — أفضل الذكر" },
  { id: "w5", count: 100, text: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ", source: "الاستغفار مئة مرة" },
  { id: "w6", count: 100, text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", source: "الصلاة على النبي ﷺ مئة مرة" },
];

const STORAGE_KEY = "tawazon_wird_dhikr";
const QURAN_KEY   = "tawazon_quran_wird";
const WIRD_COLOR  = "#059669";
const QURAN_COLOR = "#7c3aed";

// ─── Quran Tracker Sub-component ──────────────────────────────────────────────
const QuranTracker: React.FC = () => {
  const todayStr = new Date().toDateString();

  const loadGoal = (): QuranGoal => {
    try {
      const s = localStorage.getItem(QURAN_KEY);
      if (s) {
        const p: QuranGoal = JSON.parse(s);
        if (p.date === todayStr) return p;
        return { ...p, done: 0, date: todayStr };
      }
    } catch { /* ignore */ }
    return { unit: "pages", goal: 5, done: 0, date: todayStr };
  };

  const [quran, setQuran] = useState<QuranGoal>(loadGoal);
  const [editMode, setEditMode] = useState(false);
  const [draftGoal, setDraftGoal] = useState(quran.goal);
  const [draftUnit, setDraftUnit] = useState<"pages" | "juz">(quran.unit);

  useEffect(() => {
    localStorage.setItem(QURAN_KEY, JSON.stringify(quran));
  }, [quran]);

  const addOne = () => {
    if (quran.done >= quran.goal) return;
    setQuran(q => ({ ...q, done: q.done + 1 }));
  };

  const removeOne = () => {
    if (quran.done <= 0) return;
    setQuran(q => ({ ...q, done: q.done - 1 }));
  };

  const saveGoal = () => {
    setQuran(q => ({ ...q, goal: draftGoal, unit: draftUnit, done: 0 }));
    setEditMode(false);
  };

  const progress = Math.min((quran.done / quran.goal) * 100, 100);
  const done = quran.done >= quran.goal;
  const unitLabel = quran.unit === "pages" ? "صفحة" : "جزء";

  return (
    <div style={{
      ...quranCard,
      borderColor: done ? QURAN_COLOR + "40" : "var(--bg-accent)",
      background: done ? QURAN_COLOR + "06" : "var(--bg-card)",
    }}>
      {/* Header */}
      <div style={quranHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={quranEmoji}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={QURAN_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <div>
            <p style={quranTitle}>ورد القرآن اليومي</p>
            <p style={quranSub}>
              {done
                ? "✨ أتممت وردك اليوم — بارك الله فيك"
                : `الهدف: ${quran.goal} ${unitLabel} يومياً`
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditMode(!editMode); setDraftGoal(quran.goal); setDraftUnit(quran.unit); }}
          style={settingsBtn}
          title="تعديل الهدف"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
        </button>
      </div>

      {/* Edit goal panel */}
      {editMode && (
        <div style={editPanel}>
          <p style={editTitle}>🎯 حدد هدفك اليومي</p>
          <div style={editRow}>
            <div style={editGroup}>
              <label style={editLabel}>الوحدة</label>
              <div style={unitBtnRow}>
                {(["pages", "juz"] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setDraftUnit(u)}
                    style={{
                      ...unitBtn,
                      backgroundColor: draftUnit === u ? QURAN_COLOR : "transparent",
                      color: draftUnit === u ? "white" : "var(--text-muted)",
                      borderColor: draftUnit === u ? QURAN_COLOR : "var(--bg-accent)",
                    }}
                  >
                    {u === "pages" ? "📄 صفحات" : "📚 أجزاء"}
                  </button>
                ))}
              </div>
            </div>
            <div style={editGroup}>
              <label style={editLabel}>العدد</label>
              <div style={numRow}>
                <button onClick={() => setDraftGoal(Math.max(1, draftGoal - 1))} style={numBtn}>−</button>
                <span style={numDisplay}>{draftGoal}</span>
                <button onClick={() => setDraftGoal(Math.min(draftUnit === "pages" ? 100 : 30, draftGoal + 1))} style={numBtn}>+</button>
              </div>
            </div>
          </div>
          <button onClick={saveGoal} style={{ ...saveBtn, backgroundColor: QURAN_COLOR }}>حفظ الهدف</button>
        </div>
      )}

      {/* Progress ring + counter */}
      {!editMode && (
        <>
          <div style={quranProgressRow}>
            {/* Circular progress */}
            <div style={ringWrap}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="var(--bg-accent)" strokeWidth="7" />
                <circle
                  cx="45" cy="45" r="36"
                  fill="none"
                  stroke={QURAN_COLOR}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  transform="rotate(-90 45 45)"
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
                <text x="45" y="45" textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: "13px", fontWeight: "bold", fill: QURAN_COLOR, fontFamily: "inherit" }}>
                  {quran.done}/{quran.goal}
                </text>
              </svg>
            </div>

            {/* Counter buttons */}
            <div style={counterBtns}>
              <p style={counterLabel}>
                {quran.done} {unitLabel} من {quran.goal}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={removeOne} disabled={quran.done === 0} style={{ ...adjustBtn, opacity: quran.done === 0 ? 0.4 : 1 }}>−</button>
                <button
                  onClick={addOne}
                  disabled={done}
                  style={{
                    ...mainAddBtn,
                    backgroundColor: done ? "var(--bg-accent)" : QURAN_COLOR,
                    cursor: done ? "not-allowed" : "pointer",
                  }}
                >
                  {done ? "✓ مكتمل" : `+ ${unitLabel}`}
                </button>
              </div>
            </div>
          </div>

          {/* Linear progress */}
          <div style={linearBar}>
            <div style={{ ...linearFill, width: `${progress}%`, backgroundColor: QURAN_COLOR }} />
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Daily Wird Component ────────────────────────────────────────────────
export const DailyWird: React.FC = () => {
  const todayStr = new Date().toDateString();

  const initWird = (items: Omit<Dhikr, "remaining">[]): Dhikr[] =>
    items.map(d => ({ ...d, remaining: d.count }));

  const [wird, setWird] = useState<Dhikr[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const p = JSON.parse(s); if (p.date === todayStr) return p.data; }
    } catch { /* ignore */ }
    return initWird(WIRD_ITEMS);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, data: wird }));
  }, [wird, todayStr]);

  const tap = (id: string) => {
    setWird(prev => prev.map(d => d.id === id && d.remaining > 0 ? { ...d, remaining: d.remaining - 1 } : d));
  };

  const resetAll = () => {
    setWird(initWird(WIRD_ITEMS));
  };

  const doneCount = wird.filter(d => d.remaining === 0).length;
  const totalCount = wird.length;
  const allDone = doneCount === totalCount;

  return (
    <div style={container}>
      {/* Quran tracker (placed always at top of Wird page) */}
      <QuranTracker />

      {/* Rosary Header */}
      <div style={{ ...progressOuter, borderColor: WIRD_COLOR + "30" }}>
        <div style={progressInner}>
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${(doneCount / totalCount) * 100}%`, backgroundColor: WIRD_COLOR }} />
          </div>
          <p style={progressText}>
            {allDone ? "✨ أحسنت! أتممت الأوراد" : `${doneCount} من ${totalCount} مكتمل`}
          </p>
        </div>
        <button onClick={resetAll} style={resetBtn} title="إعادة تعيين">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Wird list */}
      <div style={cardList}>
        {wird.map(d => {
          const done = d.remaining === 0;
          const progress = ((d.count - d.remaining) / d.count) * 100;

          return (
            <div
              key={d.id}
              style={{
                ...dhikrCard,
                opacity: done ? 0.75 : 1,
                borderColor: done ? WIRD_COLOR + "60" : "var(--bg-accent)",
                backgroundColor: done ? WIRD_COLOR + "08" : "var(--bg-card)",
              }}
            >
              <p style={dhikrText}>{d.text}</p>
              {d.source && <p style={dhikrSource}>{d.source}</p>}

              <div style={counterRow}>
                <div style={miniProgressOuter}>
                  <div style={{ ...miniProgressFill, width: `${progress}%`, backgroundColor: WIRD_COLOR }} />
                </div>
                <div style={counterRight}>
                  <span style={{ ...countBadge, backgroundColor: done ? WIRD_COLOR : "var(--bg-accent)", color: done ? "white" : "var(--text-muted)" }}>
                    {done ? "✓" : d.remaining}
                  </span>
                  <button
                    onClick={() => tap(d.id)}
                    disabled={done}
                    style={{ ...tapBtn, backgroundColor: done ? "var(--bg-accent)" : WIRD_COLOR, cursor: done ? "not-allowed" : "pointer" }}
                  >
                    {done ? "تم" : "اضغط"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const container: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "14px" };

const progressOuter: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "12px",
  backgroundColor: "var(--bg-card)", border: "1px solid",
  borderRadius: "12px", padding: "12px 16px",
};
const progressInner: React.CSSProperties = { flex: 1 };
const progressBar: React.CSSProperties   = {
  height: "6px", backgroundColor: "var(--bg-accent)",
  borderRadius: "3px", overflow: "hidden", marginBottom: "6px",
};
const progressFill: React.CSSProperties  = { height: "100%", borderRadius: "3px", transition: "width 0.3s ease" };
const progressText: React.CSSProperties  = { margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" };

const resetBtn: React.CSSProperties = {
  background: "none", border: "1px solid var(--bg-accent)",
  borderRadius: "8px", padding: "6px 8px", cursor: "pointer",
  color: "var(--text-muted)", display: "flex", alignItems: "center",
};

const cardList: React.CSSProperties  = { display: "flex", flexDirection: "column", gap: "10px" };
const dhikrCard: React.CSSProperties = { padding: "16px", borderRadius: "12px", border: "1px solid", transition: "all 0.2s ease" };

const dhikrText: React.CSSProperties = {
  margin: "0 0 6px", fontSize: "16px", fontWeight: "700",
  lineHeight: "1.9", color: "var(--text-main)", textAlign: "center", whiteSpace: "pre-line",
};
const dhikrSource: React.CSSProperties = {
  margin: "0 0 12px", fontSize: "11px", color: "var(--text-muted)",
  textAlign: "center", fontStyle: "italic",
};

const counterRow: React.CSSProperties   = { display: "flex", alignItems: "center", gap: "10px" };
const miniProgressOuter: React.CSSProperties = {
  flex: 1, height: "4px", backgroundColor: "var(--bg-accent)", borderRadius: "2px", overflow: "hidden",
};
const miniProgressFill: React.CSSProperties  = { height: "100%", borderRadius: "2px", transition: "width 0.2s ease" };
const counterRight: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 };
const countBadge: React.CSSProperties   = {
  minWidth: "32px", height: "32px", borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "13px", fontWeight: "800", transition: "all 0.2s ease",
};
const tapBtn: React.CSSProperties = {
  padding: "6px 16px", color: "white", border: "none",
  borderRadius: "8px", fontFamily: "inherit", fontSize: "13px",
  fontWeight: "700", transition: "all 0.2s ease",
};

// ── Quran Tracker styles ──────────────────────────────────────────────────────
const quranCard: React.CSSProperties = {
  borderRadius: "14px", border: "1px solid",
  padding: "18px", transition: "all 0.2s ease",
};
const quranHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  marginBottom: "14px",
};
const quranEmoji: React.CSSProperties   = { fontSize: "22px", lineHeight: 1 };
const quranTitle: React.CSSProperties   = { margin: "0 0 2px", fontWeight: "800", fontSize: "15px", color: "var(--text-main)" };
const quranSub: React.CSSProperties     = { margin: 0, fontSize: "12px", color: "var(--text-muted)" };

const settingsBtn: React.CSSProperties = {
  background: "none", border: "1px solid var(--bg-accent)",
  borderRadius: "8px", padding: "6px 8px", cursor: "pointer",
  color: "var(--text-muted)", display: "flex", alignItems: "center",
};

const editPanel: React.CSSProperties = {
  backgroundColor: "var(--bg-primary)", borderRadius: "10px",
  padding: "14px", display: "flex", flexDirection: "column", gap: "12px",
};
const editTitle: React.CSSProperties  = { margin: 0, fontWeight: "700", fontSize: "14px", color: "var(--text-main)" };
const editRow: React.CSSProperties    = { display: "flex", gap: "16px", flexWrap: "wrap" };
const editGroup: React.CSSProperties  = { display: "flex", flexDirection: "column", gap: "6px", flex: 1 };
const editLabel: React.CSSProperties  = { fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" };
const unitBtnRow: React.CSSProperties = { display: "flex", gap: "6px" };
const unitBtn: React.CSSProperties    = {
  padding: "6px 12px", border: "1px solid", borderRadius: "8px",
  cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: "600",
  transition: "all 0.2s ease", flex: 1, textAlign: "center" as const,
};
const numRow: React.CSSProperties     = { display: "flex", alignItems: "center", gap: "8px" };
const numBtn: React.CSSProperties     = {
  width: "32px", height: "32px", borderRadius: "8px",
  border: "1px solid var(--bg-accent)", backgroundColor: "var(--bg-card)",
  cursor: "pointer", fontSize: "18px", fontWeight: "700",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--text-main)",
};
const numDisplay: React.CSSProperties = {
  minWidth: "36px", textAlign: "center" as const,
  fontSize: "20px", fontWeight: "800", color: "var(--text-main)",
};
const saveBtn: React.CSSProperties    = {
  color: "white", border: "none",
  borderRadius: "8px", padding: "8px 20px", cursor: "pointer",
  fontFamily: "inherit", fontSize: "13px", fontWeight: "700",
  alignSelf: "flex-end",
};

const quranProgressRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px",
};
const ringWrap: React.CSSProperties   = { flexShrink: 0 };
const counterBtns: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px", flex: 1 };
const counterLabel: React.CSSProperties = {
  margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "var(--text-main)",
};
const adjustBtn: React.CSSProperties   = {
  width: "36px", height: "36px", borderRadius: "50%",
  border: "2px solid var(--bg-accent)", backgroundColor: "transparent",
  cursor: "pointer", fontSize: "20px", fontWeight: "700",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--text-muted)",
};
const mainAddBtn: React.CSSProperties  = {
  padding: "8px 18px", color: "white", border: "none",
  borderRadius: "10px", fontFamily: "inherit", fontSize: "13px",
  fontWeight: "700", transition: "all 0.2s ease",
};
const linearBar: React.CSSProperties   = {
  height: "5px", backgroundColor: "var(--bg-accent)",
  borderRadius: "3px", overflow: "hidden",
};
const linearFill: React.CSSProperties  = { height: "100%", borderRadius: "3px", transition: "width 0.4s ease" };
