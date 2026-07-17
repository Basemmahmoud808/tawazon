import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dhikr {
  id: string;
  text: string;
  count: number;
  remaining: number;
  source?: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const MORNING_ATHKAR: Omit<Dhikr, "remaining">[] = [
  { id: "m1", count: 3,   text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\nاللهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ...\n(آية الكرسي)", source: "من قالها حين يصبح حُفظ حتى يمسي" },
  { id: "m2", count: 3,   text: "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ\n(قُلْ هُوَ اللَّهُ أَحَدٌ) و (المعوذتان)", source: "من قالها ثلاثاً كفته من كل شيء" },
  { id: "m3", count: 1,   text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ للهِ، وَالْحَمْدُ للهِ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ" },
  { id: "m4", count: 7,   text: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ", source: "من قالها سبعاً أجاره الله من النار" },
  { id: "m5", count: 3,   text: "بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", source: "من قالها ثلاثاً لم يضره شيء" },
  { id: "m6", count: 10,  text: "لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", source: "عشر مرات — كتب له عشر حسنات" },
  { id: "m7", count: 1,   text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ" },
  { id: "m8", count: 1,   text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ" },
  { id: "m9", count: 100, text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", source: "من قالها مئة حُطَّت خطاياه" },
];

const EVENING_ATHKAR: Omit<Dhikr, "remaining">[] = [
  { id: "e1", count: 3,   text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\nاللهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ...\n(آية الكرسي)", source: "من قالها حين يمسي حُفظ حتى يصبح" },
  { id: "e2", count: 3,   text: "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ\n(قُلْ هُوَ اللَّهُ أَحَدٌ) و (المعوذتان)", source: "من قالها ثلاثاً كفته من كل شيء" },
  { id: "e3", count: 1,   text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ للهِ، وَالْحَمْدُ للهِ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ" },
  { id: "e4", count: 7,   text: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ", source: "من قالها سبعاً أجاره الله من النار" },
  { id: "e5", count: 3,   text: "بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", source: "من قالها ثلاثاً لم يضره شيء" },
  { id: "e6", count: 1,   text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ" },
  { id: "e7", count: 1,   text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ" },
  { id: "e8", count: 100, text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", source: "من قالها مئة حُطَّت خطاياه" },
];

type Tab = "morning" | "evening";
const STORAGE_KEY = "tawazon_athkar_only";

const tabColors: Record<Tab, string> = {
  morning: "#f59e0b",
  evening: "#6366f1",
};

// ─── Main Athkar Component ────────────────────────────────────────────────────
export const Athkar: React.FC = () => {
  const [tab, setTab] = useState<Tab>("morning");
  const todayStr = new Date().toDateString();

  const initDhikr = (items: Omit<Dhikr, "remaining">[]): Dhikr[] =>
    items.map(d => ({ ...d, remaining: d.count }));

  const [morning, setMorning] = useState<Dhikr[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY + "_morning");
      if (s) { const p = JSON.parse(s); if (p.date === todayStr) return p.data; }
    } catch { /* ignore */ }
    return initDhikr(MORNING_ATHKAR);
  });

  const [evening, setEvening] = useState<Dhikr[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY + "_evening");
      if (s) { const p = JSON.parse(s); if (p.date === todayStr) return p.data; }
    } catch { /* ignore */ }
    return initDhikr(EVENING_ATHKAR);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "_morning", JSON.stringify({ date: todayStr, data: morning }));
  }, [morning, todayStr]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "_evening", JSON.stringify({ date: todayStr, data: evening }));
  }, [evening, todayStr]);

  const tap = (list: Dhikr[], setList: React.Dispatch<React.SetStateAction<Dhikr[]>>, id: string) => {
    setList(list.map(d => d.id === id && d.remaining > 0 ? { ...d, remaining: d.remaining - 1 } : d));
  };

  const reset = (base: Omit<Dhikr, "remaining">[], setList: React.Dispatch<React.SetStateAction<Dhikr[]>>) => {
    setList(initDhikr(base));
  };

  const currentList = tab === "morning" ? morning : evening;
  const currentBase = tab === "morning" ? MORNING_ATHKAR : EVENING_ATHKAR;
  const currentSet  = tab === "morning" ? setMorning : setEvening;

  const doneCount = currentList.filter(d => d.remaining === 0).length;
  const totalCount = currentList.length;
  const allDone = doneCount === totalCount;
  const color = tabColors[tab];

  const tabsList: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "morning",
      label: "أذكار الصباح",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )
    },
    {
      id: "evening",
      label: "أذكار المساء",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )
    }
  ];

  return (
    <div style={container}>
      {/* Tabs */}
      <div style={tabRow}>
        {tabsList.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              backgroundColor: tab === t.id ? tabColors[t.id] : "transparent",
              color: tab === t.id ? "white" : "var(--text-muted)",
              borderColor: tab === t.id ? tabColors[t.id] : "var(--bg-accent)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ ...progressOuter, borderColor: color + "30" }}>
        <div style={progressInner}>
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${(doneCount / totalCount) * 100}%`, backgroundColor: color }} />
          </div>
          <p style={progressText}>
            {allDone ? "✨ أحسنت! أتممت الذكر" : `${doneCount} من ${totalCount} مكتمل`}
          </p>
        </div>
        <button onClick={() => reset(currentBase, currentSet)} style={resetBtn} title="إعادة تعيين">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Dhikr cards */}
      <div style={cardList}>
        {currentList.map(d => {
          const done = d.remaining === 0;
          const progress = ((d.count - d.remaining) / d.count) * 100;

          return (
            <div
              key={d.id}
              style={{
                ...dhikrCard,
                opacity: done ? 0.75 : 1,
                borderColor: done ? color + "60" : "var(--bg-accent)",
                backgroundColor: done ? color + "08" : "var(--bg-card)",
              }}
            >
              <p style={dhikrText}>{d.text}</p>
              {d.source && <p style={dhikrSource}>{d.source}</p>}

              <div style={counterRow}>
                <div style={miniProgressOuter}>
                  <div style={{ ...miniProgressFill, width: `${progress}%`, backgroundColor: color }} />
                </div>
                <div style={counterRight}>
                  <span style={{ ...countBadge, backgroundColor: done ? color : "var(--bg-accent)", color: done ? "white" : "var(--text-muted)" }}>
                    {done ? "✓" : d.remaining}
                  </span>
                  <button
                    onClick={() => tap(currentList, currentSet, d.id)}
                    disabled={done}
                    style={{ ...tapBtn, backgroundColor: done ? "var(--bg-accent)" : color, cursor: done ? "not-allowed" : "pointer" }}
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
const tabRow: React.CSSProperties    = { display: "flex", gap: "8px", flexWrap: "wrap" };

const tabBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "8px 16px", borderRadius: "20px",
  border: "1px solid", cursor: "pointer",
  fontFamily: "inherit", fontSize: "13px", fontWeight: "600",
  transition: "all 0.2s ease", flex: "1 1 100px", justifyContent: "center",
};

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
