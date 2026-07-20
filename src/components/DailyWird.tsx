import React, { useState, useEffect, useCallback } from "react";

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

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

interface SurahDetails {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: Ayah[];
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

const SURAHS_LIST = [
  { number: 1, name: "الفاتحة", type: "Meccan", ayahs: 7 },
  { number: 2, name: "البقرة", type: "Medinan", ayahs: 286 },
  { number: 3, name: "آل عمران", type: "Medinan", ayahs: 200 },
  { number: 4, name: "النساء", type: "Medinan", ayahs: 176 },
  { number: 5, name: "المائدة", type: "Medinan", ayahs: 120 },
  { number: 6, name: "الأنعام", type: "Meccan", ayahs: 165 },
  { number: 7, name: "الأعراف", type: "Meccan", ayahs: 206 },
  { number: 8, name: "الأنفال", type: "Medinan", ayahs: 75 },
  { number: 9, name: "التوبة", type: "Medinan", ayahs: 129 },
  { number: 10, name: "يونس", type: "Meccan", ayahs: 109 },
  { number: 11, name: "هود", type: "Meccan", ayahs: 123 },
  { number: 12, name: "يوسف", type: "Meccan", ayahs: 111 },
  { number: 13, name: "الرعد", type: "Medinan", ayahs: 43 },
  { number: 14, name: "إبراهيم", type: "Meccan", ayahs: 52 },
  { number: 15, name: "الحجر", type: "Meccan", ayahs: 99 },
  { number: 16, name: "النحل", type: "Meccan", ayahs: 128 },
  { number: 17, name: "الإسراء", type: "Meccan", ayahs: 111 },
  { number: 18, name: "الكهف", type: "Meccan", ayahs: 110 },
  { number: 19, name: "مريم", type: "Meccan", ayahs: 98 },
  { number: 20, name: "طه", type: "Meccan", ayahs: 135 },
  { number: 21, name: "الأنبياء", type: "Meccan", ayahs: 112 },
  { number: 22, name: "الحج", type: "Medinan", ayahs: 78 },
  { number: 23, name: "المؤمنون", type: "Meccan", ayahs: 118 },
  { number: 24, name: "النور", type: "Medinan", ayahs: 64 },
  { number: 25, name: "الفرقان", type: "Meccan", ayahs: 77 },
  { number: 26, name: "الشعراء", type: "Meccan", ayahs: 227 },
  { number: 27, name: "النمل", type: "Meccan", ayahs: 93 },
  { number: 28, name: "القصص", type: "Meccan", ayahs: 88 },
  { number: 29, name: "العنكبوت", type: "Meccan", ayahs: 69 },
  { number: 30, name: "الروم", type: "Meccan", ayahs: 60 },
  { number: 31, name: "لقمان", type: "Meccan", ayahs: 34 },
  { number: 32, name: "السجدة", type: "Meccan", ayahs: 30 },
  { number: 33, name: "الأحزاب", type: "Medinan", ayahs: 73 },
  { number: 34, name: "سبأ", type: "Meccan", ayahs: 54 },
  { number: 35, name: "فاطر", type: "Meccan", ayahs: 45 },
  { number: 36, name: "يس", type: "Meccan", ayahs: 83 },
  { number: 37, name: "الصافات", type: "Meccan", ayahs: 182 },
  { number: 38, name: "ص", type: "Meccan", ayahs: 88 },
  { number: 39, name: "الزمر", type: "Meccan", ayahs: 75 },
  { number: 40, name: "غافر", type: "Meccan", ayahs: 85 },
  { number: 41, name: "فصلت", type: "Meccan", ayahs: 54 },
  { number: 42, name: "الشورى", type: "Meccan", ayahs: 53 },
  { number: 43, name: "الزخرف", type: "Meccan", ayahs: 89 },
  { number: 44, name: "الدخان", type: "Meccan", ayahs: 59 },
  { number: 45, name: "الجاثية", type: "Meccan", ayahs: 37 },
  { number: 46, name: "الأحقاف", type: "Meccan", ayahs: 35 },
  { number: 47, name: "محمد", type: "Medinan", ayahs: 38 },
  { number: 48, name: "الفتح", type: "Medinan", ayahs: 29 },
  { number: 49, name: "الحجرات", type: "Medinan", ayahs: 18 },
  { number: 50, name: "ق", type: "Meccan", ayahs: 45 },
  { number: 51, name: "الذاريات", type: "Meccan", ayahs: 60 },
  { number: 52, name: "الطور", type: "Meccan", ayahs: 49 },
  { number: 53, name: "النجم", type: "Meccan", ayahs: 62 },
  { number: 54, name: "القمر", type: "Meccan", ayahs: 55 },
  { number: 55, name: "الرحمن", type: "Medinan", ayahs: 78 },
  { number: 56, name: "الواقعة", type: "Meccan", ayahs: 96 },
  { number: 57, name: "الحديد", type: "Medinan", ayahs: 29 },
  { number: 58, name: "المجادلة", type: "Medinan", ayahs: 22 },
  { number: 59, name: "الحشر", type: "Medinan", ayahs: 24 },
  { number: 60, name: "الممتحنة", type: "Medinan", ayahs: 13 },
  { number: 61, name: "الصف", type: "Medinan", ayahs: 14 },
  { number: 62, name: "الجمعة", type: "Medinan", ayahs: 11 },
  { number: 63, name: "المنافقون", type: "Medinan", ayahs: 11 },
  { number: 64, name: "التغابن", type: "Medinan", ayahs: 18 },
  { number: 65, name: "الطلاق", type: "Medinan", ayahs: 12 },
  { number: 66, name: "التحريم", type: "Medinan", ayahs: 12 },
  { number: 67, name: "الملك", type: "Meccan", ayahs: 30 },
  { number: 68, name: "القلم", type: "Meccan", ayahs: 52 },
  { number: 69, name: "الحاقة", type: "Meccan", ayahs: 52 },
  { number: 70, name: "المعارج", type: "Meccan", ayahs: 44 },
  { number: 71, name: "نوح", type: "Meccan", ayahs: 28 },
  { number: 72, name: "الجن", type: "Meccan", ayahs: 28 },
  { number: 73, name: "المزمل", type: "Meccan", ayahs: 20 },
  { number: 74, name: "المدثر", type: "Meccan", ayahs: 56 },
  { number: 75, name: "القيامة", type: "Meccan", ayahs: 40 },
  { number: 76, name: "الإنسان", type: "Medinan", ayahs: 31 },
  { number: 77, name: "المرسلات", type: "Meccan", ayahs: 50 },
  { number: 78, name: "النبأ", type: "Meccan", ayahs: 40 },
  { number: 79, name: "النازعات", type: "Meccan", ayahs: 46 },
  { number: 80, name: "عبس", type: "Meccan", ayahs: 42 },
  { number: 81, name: "التكوير", type: "Meccan", ayahs: 29 },
  { number: 82, name: "الانفطار", type: "Meccan", ayahs: 19 },
  { number: 83, name: "المطففين", type: "Meccan", ayahs: 36 },
  { number: 84, name: "الانشقاق", type: "Meccan", ayahs: 25 },
  { number: 85, name: "البروج", type: "Meccan", ayahs: 22 },
  { number: 86, name: "الطارق", type: "Meccan", ayahs: 17 },
  { number: 87, name: "الأعلى", type: "Meccan", ayahs: 19 },
  { number: 88, name: "الغاشية", type: "Meccan", ayahs: 26 },
  { number: 89, name: "الفجر", type: "Meccan", ayahs: 30 },
  { number: 90, name: "البلد", type: "Meccan", ayahs: 20 },
  { number: 91, name: "الشمس", type: "Meccan", ayahs: 15 },
  { number: 92, name: "الليل", type: "Meccan", ayahs: 21 },
  { number: 93, name: "الضحى", type: "Meccan", ayahs: 11 },
  { number: 94, name: "الشرح", type: "Meccan", ayahs: 8 },
  { number: 95, name: "التين", type: "Meccan", ayahs: 8 },
  { number: 96, name: "العلق", type: "Meccan", ayahs: 19 },
  { number: 97, name: "القدر", type: "Meccan", ayahs: 5 },
  { number: 98, name: "البينة", type: "Medinan", ayahs: 8 },
  { number: 99, name: "الزلزلة", type: "Medinan", ayahs: 8 },
  { number: 100, name: "العاديات", type: "Meccan", ayahs: 11 },
  { number: 101, name: "القارعة", type: "Meccan", ayahs: 11 },
  { number: 102, name: "التكاثر", type: "Meccan", ayahs: 8 },
  { number: 103, name: "العصر", type: "Meccan", ayahs: 3 },
  { number: 104, name: "الهمزة", type: "Meccan", ayahs: 9 },
  { number: 105, name: "الفيل", type: "Meccan", ayahs: 5 },
  { number: 106, name: "قريش", type: "Meccan", ayahs: 4 },
  { number: 107, name: "الماعون", type: "Meccan", ayahs: 7 },
  { number: 108, name: "الكوثر", type: "Meccan", ayahs: 3 },
  { number: 109, name: "الكافرون", type: "Meccan", ayahs: 6 },
  { number: 110, name: "النصر", type: "Medinan", ayahs: 3 },
  { number: 111, name: "المسد", type: "Meccan", ayahs: 5 },
  { number: 112, name: "الإخلاص", type: "Meccan", ayahs: 4 },
  { number: 113, name: "الفلق", type: "Meccan", ayahs: 5 },
  { number: 114, name: "الناس", type: "Meccan", ayahs: 6 },
];

const STORAGE_KEY = "tawazon_wird_dhikr";
const QURAN_KEY   = "tawazon_quran_wird";
const BOOKMARK_KEY = "tawazon_quran_bookmark";
const WIRD_COLOR  = "#115B3D";
const QURAN_COLOR = "#C29028";

// ─── Quran Tracker & Mushaf Sub-component ─────────────────────────────────────
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

  // Mushaf Reader States
  const [activeSurahNum, setActiveSurahNum] = useState<number>(1);
  const [surahContent, setSurahContent] = useState<SurahDetails | null>(null);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(18);
  const [bookmark, setBookmark] = useState<{ surah: number; verse: number; surahName: string } | null>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  // Fetch Surah Text
  const fetchSurah = useCallback(async (num: number) => {
    setLoadingSurah(true);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}`);
      const json = await res.json();
      setSurahContent(json.data);
    } catch {
      alert("فشل تحميل آيات السورة، يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setLoadingSurah(false);
    }
  }, []);

  useEffect(() => {
    fetchSurah(activeSurahNum);
  }, [activeSurahNum, fetchSurah]);

  const handleSaveBookmark = (surahName: string, verseNum: number) => {
    const data = { surah: activeSurahNum, verse: verseNum, surahName };
    setBookmark(data);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(data));
  };

  const handleLoadBookmark = () => {
    if (bookmark) {
      setActiveSurahNum(bookmark.surah);
      setTimeout(() => {
        const el = document.getElementById(`ayah-${bookmark.verse}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  };

  const progress = Math.min((quran.done / quran.goal) * 100, 100);
  const done = quran.done >= quran.goal;
  const unitLabel = quran.unit === "pages" ? "صفحة" : "جزء";

  // Filter Surahs
  const filteredSurahs = SURAHS_LIST.filter(s =>
    s.name.includes(searchQuery) || s.number.toString() === searchQuery
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Target Tracker Widget */}
      <div style={{
        ...quranCard,
        borderColor: done ? QURAN_COLOR + "40" : "var(--bg-accent)",
        background: done ? "var(--brand-light)" : "var(--bg-card)",
      }}>
        <div style={quranHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={quranEmoji}>🌿</span>
            <div>
              <p style={quranTitle}>ورد القرآن اليومي</p>
              <p style={quranSub}>
                {done
                  ? "✨ أتممت وردك اليوم — بارك الله فيك"
                  : `الهدف الحالي: ${quran.goal} ${unitLabel} يومياً`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEditMode(!editMode); setDraftGoal(quran.goal); setDraftUnit(quran.unit); }}
            style={settingsBtn}
            title="تعديل الهدف"
          >
            ⚙️
          </button>
        </div>

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
                        backgroundColor: draftUnit === u ? WIRD_COLOR : "transparent",
                        color: draftUnit === u ? "white" : "var(--text-muted)",
                        borderColor: draftUnit === u ? WIRD_COLOR : "var(--bg-accent)",
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
            <button onClick={saveGoal} style={{ ...saveBtn, backgroundColor: WIRD_COLOR }}>حفظ الهدف</button>
          </div>
        )}

        {!editMode && (
          <>
            <div style={quranProgressRow}>
              <div style={ringWrap}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="36" fill="none" stroke="var(--bg-accent)" strokeWidth="7" />
                  <circle
                    cx="45" cy="45" r="36"
                    fill="none"
                    stroke={WIRD_COLOR}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                    transform="rotate(-90 45 45)"
                    style={{ transition: "stroke-dashoffset 0.4s ease" }}
                  />
                  <text x="45" y="45" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: "13px", fontWeight: "bold", fill: WIRD_COLOR, fontFamily: "inherit" }}>
                    {quran.done}/{quran.goal}
                  </text>
                </svg>
              </div>

              <div style={counterBtns}>
                <p style={counterLabel}>
                  أنجزت {quran.done} {unitLabel} اليوم
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={removeOne} disabled={quran.done === 0} style={{ ...adjustBtn, opacity: quran.done === 0 ? 0.4 : 1 }}>−</button>
                  <button
                    onClick={addOne}
                    disabled={done}
                    style={{
                      ...mainAddBtn,
                      backgroundColor: done ? "var(--bg-accent)" : WIRD_COLOR,
                      cursor: done ? "not-allowed" : "pointer",
                    }}
                  >
                    {done ? "✓ مكتمل" : `+ تسجيل ${unitLabel}`}
                  </button>
                </div>
              </div>
            </div>

            <div style={linearBar}>
              <div style={{ ...linearFill, width: `${progress}%`, backgroundColor: WIRD_COLOR }} />
            </div>
          </>
        )}
      </div>

      {/* Embedded Mushaf Card */}
      <div className="card" style={{ padding: "24px", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--bg-accent)" }}>
        
        {/* Mushaf Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--bg-accent)", paddingBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>📖</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "var(--brand)", fontFamily: "Thmanyah Serif Display, serif" }}>المصحف الإلكتروني كامل</h3>
              <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--gold)", fontWeight: "bold" }}>
                النص القرآني بالرسم العثماني المعتمد من مشروع تنزيل (Tanzil.net)
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setFontSize(prev => Math.max(14, prev - 2))} style={actionCircleBtn} title="تصغير الخط">A-</button>
            <button onClick={() => setFontSize(prev => Math.min(32, prev + 2))} style={actionCircleBtn} title="تكبير الخط">A+</button>
            
            {bookmark && (
              <button onClick={handleLoadBookmark} style={bookmarkJumpBtn}>
                🔖 انتقل إلى {bookmark.surahName} ({bookmark.verse})
              </button>
            )}
          </div>
        </div>

        {/* Surah List & Selector Dropdown */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Dropdown Select */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <select
              value={activeSurahNum}
              onChange={(e) => setActiveSurahNum(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1.5px solid var(--bg-accent)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-main)",
                fontWeight: "700",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              {SURAHS_LIST.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.type === "Meccan" ? "مكية" : "مدنية"} - {s.ayahs} آية)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filter Search */}
          <div style={{ width: "150px" }}>
            <input
              type="text"
              placeholder="ابحث عن سورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1.5px solid var(--bg-accent)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-main)",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Quick Filter Selection results */}
        {searchQuery && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxHeight: "100px", overflowY: "auto", padding: "8px", border: "1px dashed var(--bg-accent)", borderRadius: "10px" }}>
            {filteredSurahs.map(s => (
              <button
                key={s.number}
                onClick={() => { setActiveSurahNum(s.number); setSearchQuery(""); }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: "var(--bg-accent)",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "var(--text-main)",
                  cursor: "pointer"
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Quran Reading Area Card */}
        <div style={{
          backgroundColor: "var(--bg-primary)",
          borderRadius: "16px",
          padding: "24px",
          maxHeight: "450px",
          overflowY: "auto",
          direction: "rtl",
          border: "1px solid var(--bg-accent)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.03)"
        }}>
          {loadingSurah ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "14px" }}>
              ⏳ جاري تحميل آيات السورة الكريمة...
            </div>
          ) : surahContent ? (
            <div>
              {/* Surah Title Calligraphy Card */}
              <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "1px dashed var(--bg-accent)", paddingBottom: "16px" }}>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "var(--brand)", fontFamily: "Thmanyah Serif Display, serif" }}>
                  سُورَةُ {surahContent.name}
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                  {surahContent.revelationType === "Meccan" ? "مكية" : "مدنية"} • عدد آياتها {surahContent.ayahs.length}
                </p>

                {/* Basmalah (don't display for At-Tawbah (9) and Al-Fatihah (1) has it inside its text) */}
                {activeSurahNum !== 9 && activeSurahNum !== 1 && (
                  <p style={{ margin: "20px 0 0", fontSize: "18px", fontWeight: "bold", color: "var(--text-main)", fontFamily: "system-ui" }}>
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </p>
                )}
              </div>

              {/* Verses Flow block */}
              <div style={{
                lineHeight: "2.4",
                fontSize: `${fontSize}px`,
                color: "var(--text-main)",
                textAlign: "justify",
                fontFamily: "'Inter', sans-serif"
              }}>
                {surahContent.ayahs.map((ayah) => {
                  // Clean up Al-Fatihah Basmalah from rendering twice
                  let text = ayah.text;
                  if (activeSurahNum !== 1 && ayah.numberInSurah === 1) {
                    const clean = text.replace(/[\u064B-\u065F\u0670]/g, "");
                    if (clean.startsWith("بسم الله الرحمن الرحيم")) {
                      const cleanWord = "الرحيم";
                      const cleanIdx = clean.indexOf(cleanWord);
                      if (cleanIdx !== -1) {
                        let originalIdx = 0;
                        let matchedLetters = 0;
                        const targetLetters = cleanIdx + cleanWord.length;
                        while (originalIdx < text.length && matchedLetters < targetLetters) {
                          const char = text[originalIdx];
                          if (!/[\u064B-\u065F\u0670]/.test(char)) {
                            matchedLetters++;
                          }
                          originalIdx++;
                        }
                        text = text.substring(originalIdx).trim();
                      }
                    }
                  }

                  return (
                    <span
                      key={ayah.number}
                      id={`ayah-${ayah.numberInSurah}`}
                      onClick={() => handleSaveBookmark(surahContent.name, ayah.numberInSurah)}
                      style={{
                        cursor: "pointer",
                        padding: "2px 4px",
                        borderRadius: "6px",
                        transition: "background 0.2s ease"
                      }}
                      title="اضغط لحفظ علامة القراءة (بوكمارك)"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(194, 144, 40, 0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {text}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1.5px solid var(--gold)",
                        fontSize: "11px",
                        fontWeight: "bold",
                        color: "var(--gold)",
                        margin: "0 6px",
                        textAlign: "center"
                      }}>
                        {ayah.numberInSurah}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
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
      {/* Quran tracker + Embedded complete Mushaf */}
      <QuranTracker />

      {/* Sebha Rosary Header */}
      <div style={{ ...progressOuter, borderColor: WIRD_COLOR + "30" }}>
        <div style={progressInner}>
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${(doneCount / totalCount) * 100}%`, backgroundColor: WIRD_COLOR }} />
          </div>
          <p style={progressText}>
            {allDone ? "✨ أحسنت! أتممت الأوراد والأذكار اليومية" : `${doneCount} من ${totalCount} مكتمل`}
          </p>
        </div>
        <button onClick={resetAll} style={resetBtn} title="إعادة تعيين">
          🔄
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
                backgroundColor: done ? "rgba(17,91,61,0.03)" : "var(--bg-card)",
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
  backgroundColor: "var(--bg-card)", border: "1px solid var(--bg-accent)",
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
const dhikrCard: React.CSSProperties = { padding: "16px", borderRadius: "12px", border: "1px solid var(--bg-accent)", transition: "all 0.2s ease" };

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
  borderRadius: "14px", border: "1px solid var(--bg-accent)",
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

const actionCircleBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  border: "1.5px solid var(--bg-accent)",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-main)",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease"
};

const bookmarkJumpBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "20px",
  border: "1.5px solid var(--gold)",
  backgroundColor: "rgba(194, 144, 40, 0.05)",
  color: "var(--gold)",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px"
};
