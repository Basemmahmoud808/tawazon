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

function normalizeArabic(text: string): string {
  return text
    .trim()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

// Surah Starting Page Numbers in the standard Madinah Mushaf (604 pages)
const SURAHS_STARTING_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
  41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
  61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
  71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 586, 80: 588,
  81: 589, 82: 590, 83: 591, 84: 593, 85: 595, 86: 597, 87: 598, 88: 599, 89: 599, 90: 601,
  91: 601, 92: 602, 93: 602, 94: 603, 95: 603, 96: 603, 97: 604, 98: 604, 99: 604, 100: 604,
  101: 604, 102: 604, 103: 604, 104: 604, 105: 604, 106: 604, 107: 604, 108: 604, 109: 604, 110: 604,
  111: 604, 112: 604, 113: 604, 114: 604
};

const SURAHS_LIST = [
  { number: 1, name: "الفاتحة" }, { number: 2, name: "البقرة" }, { number: 3, name: "آل عمران" },
  { number: 4, name: "النساء" }, { number: 5, name: "المائدة" }, { number: 6, name: "الأنعام" },
  { number: 7, name: "الأعراف" }, { number: 8, name: "الأنفال" }, { number: 9, name: "التوبة" },
  { number: 10, name: "يونس" }, { number: 11, name: "هود" }, { number: 12, name: "يوسف" },
  { number: 13, name: "الرعد" }, { number: 14, name: "إبراهيم" }, { number: 15, name: "الحجر" },
  { number: 16, name: "النحل" }, { number: 17, name: "الإسراء" }, { number: 18, name: "الكهف" },
  { number: 19, name: "مريم" }, { number: 20, name: "طه" }, { number: 21, name: "الأنبياء" },
  { number: 22, name: "الحج" }, { number: 23, name: "المؤمنون" }, { number: 24, name: "النور" },
  { number: 25, name: "الفرقان" }, { number: 26, name: "الشعراء" }, { number: 27, name: "النمل" },
  { number: 28, name: "القصص" }, { number: 29, name: "العنكبوت" }, { number: 30, name: "الروم" },
  { number: 31, name: "لقمان" }, { number: 32, name: "السجدة" }, { number: 33, name: "الأحزاب" },
  { number: 34, name: "سبأ" }, { number: 35, name: "فاطر" }, { number: 36, name: "يس" },
  { number: 37, name: "الصافات" }, { number: 38, name: "ص" }, { number: 39, name: "الزمر" },
  { number: 40, name: "غافر" }, { number: 41, name: "فصلت" }, { number: 42, name: "الشورى" },
  { number: 43, name: "الزخرف" }, { number: 44, name: "الدخان" }, { number: 45, name: "الجاثية" },
  { number: 46, name: "الأحقاف" }, { number: 47, name: "محمد" }, { number: 48, name: "الفتح" },
  { number: 49, name: "الحجرات" }, { number: 50, name: "ق" }, { number: 51, name: "الذاريات" },
  { number: 52, name: "الطور" }, { number: 53, name: "النجم" }, { number: 54, name: "القمر" },
  { number: 55, name: "الرحمن" }, { number: 56, name: "الواقعة" }, { number: 57, name: "الحديد" },
  { number: 58, name: "المجادلة" }, { number: 59, name: "الحشر" }, { number: 60, name: "الممتحنة" },
  { number: 61, name: "الصف" }, { number: 62, name: "الجمعة" }, { number: 63, name: "المنافقون" },
  { number: 64, name: "التغابن" }, { number: 65, name: "الطلاق" }, { number: 66, name: "التحريم" },
  { number: 67, name: "الملك" }, { number: 68, name: "القلم" }, { number: 69, name: "الحاقة" },
  { number: 70, name: "المعارج" }, { number: 71, name: "نوح" }, { number: 72, name: "الجن" },
  { number: 73, name: "المزمل" }, { number: 74, name: "المدثر" }, { number: 75, name: "القيامة" },
  { number: 76, name: "الإنسان" }, { number: 77, name: "المرسلات" }, { number: 78, name: "النبأ" },
  { number: 79, name: "النازعات" }, { number: 80, name: "عبس" }, { number: 81, name: "التكوير" },
  { number: 82, name: "الانفطار" }, { number: 83, name: "المطففين" }, { number: 84, name: "الانشقاق" },
  { number: 85, name: "البروج" }, { number: 86, name: "الطارق" }, { number: 87, name: "الأعلى" },
  { number: 88, name: "الغاشية" }, { number: 89, name: "الفجر" }, { number: 90, name: "البلد" },
  { number: 91, name: "الشمس" }, { number: 92, name: "الليل" }, { number: 93, name: "الضحى" },
  { number: 94, name: "الشرح" }, { number: 95, name: "التين" }, { number: 96, name: "العلق" },
  { number: 97, name: "القدر" }, { number: 98, name: "البينة" }, { number: 99, name: "الزلزلة" },
  { number: 100, name: "العاديات" }, { number: 101, name: "القارعة" }, { number: 102, name: "التكاثر" },
  { number: 103, name: "العصر" }, { number: 104, name: "الهمزة" }, { number: 105, name: "الفيل" },
  { number: 106, name: "قريش" }, { number: 107, name: "الماعون" }, { number: 108, name: "الكوثر" },
  { number: 109, name: "الكافرون" }, { number: 110, name: "النصر" }, { number: 111, name: "المسد" },
  { number: 112, name: "الإخلاص" }, { number: 113, name: "الفلق" }, { number: 114, name: "الناس" }
];

const STORAGE_KEY = "tawazon_wird_dhikr";
const QURAN_KEY   = "tawazon_quran_wird";
const BOOKMARK_KEY = "tawazon_quran_page_bookmark_v1";
const WIRD_COLOR  = "#115B3D";
const QURAN_COLOR = "#C29028";

const QURAN_WORDS_DICTIONARY: Record<number, { word: string; meaning: string }[]> = {
  582: [
    { word: "النبأ العظيم", meaning: "الخبر الهام وهو البعث بعد الموت" },
    { word: "مهادا", meaning: "ممهدة صالحة للاستقرار والسير عليها" },
    { word: "أوتادا", meaning: "كالأوتاد تثبت الأرض لئلا تضطرب" },
    { word: "سباتا", meaning: "راحة لأبدانكم وقطعاً لعملكم" },
    { word: "سبعا شدادا", meaning: "سبع سماوات متينة محكمة البناء" },
    { word: "سراجا وهاجا", meaning: "شمساً مضيئة متقدة بالحرارة" },
    { word: "المعصرات", meaning: "السحاب الممتلئ بالماء الذي شارف على الهطول" },
    { word: "ثجاجا", meaning: "صباباً متدفقاً بغزارة" },
    { word: "كأسا دهاقا", meaning: "كأساً مملوءة صافية" }
  ],
  583: [
    { word: "مفازا", meaning: "فوزاً وظفراً بالجنة والنجاة من النار" },
    { word: "كواعب أترابا", meaning: "فتيات حسناوات متساويات في السن" },
    { word: "والنازعات غرقا", meaning: "الملائكة تنزع أرواح الكفار بشدة وعنف" },
    { word: "والناشطات نشطا", meaning: "الملائكة تسل أرواح المؤمنين برفق وسهولة" },
    { word: "والسابحات سبحا", meaning: "الملائكة تسبح في النزول والصعود بأمر الله" },
    { word: "الراجفة", meaning: "النفخة الأولى التي تهتز وترتجف لها الأرض والجبال" },
    { word: "الرادفة", meaning: "النفخة الثانية التي تتبع الأولى للبعث" },
    { word: "واجفة", meaning: "خائفة مضطربة شديدة الفزع" },
    { word: "الحافرة", meaning: "الحالة الأولى التي كنا عليها في الدنيا (أحياء)" },
    { word: "نخرة", meaning: "بالية مفتتة" },
    { word: "الساهرة", meaning: "وجه الأرض أحياء بعد موتهم في المحشر" }
  ],
  584: [
    { word: "طوى", meaning: "اسم الوادي المقدس في سيناء" },
    { word: "طغى", meaning: "جاوز الحد في الكبر والظلم والفساد" },
    { word: "تزكى", meaning: "تتطهر من الكفر والذنوب وتؤمن بربك" },
    { word: "أدبر يسعى", meaning: "ولى معرضاً عن الحق ومجتهداً في محاربة نبي الله موسى" },
    { word: "نكال الآخرة", meaning: "عقوبة الآخرة وعذابها الشديد" },
    { word: "سمكها فسواها", meaning: "رفع بناء السماء في الفضاء وأحكم خلقه دون عيب" },
    { word: "وأغطش ليلها", meaning: "أظلم ليلها بعد غروب الشمس" },
    { word: "وأخرج ضحاها", meaning: "أظهر نهارها وضياءها بالشمس" },
    { word: "دحاها", meaning: "بسطها ومهدها للاستقرار والعيش عليها" },
    { word: "الطامة الكبرى", meaning: "القيامة والبعث حين تطم وتغلب أهوالها كل شيء" }
  ],
  585: [
    { word: "عبس وتولى", meaning: "قطب وجهه وضيق جبهته وأعرض" },
    { word: "بأيدي سفرة", meaning: "ملائكة يكتبون الوحي وينقلونه، وهم سفراء بين الله وخلقه" },
    { word: "كرام بررة", meaning: "مطهرين أتقياء صادقين" },
    { word: "قتل الإنسان", meaning: "لعن الإنسان الكافر وعذب كفره الشديد" },
    { word: "صببنا الماء صبا", meaning: "أنزلنا المطر بغزارة وتدفق" },
    { word: "شققنا الأرض شقا", meaning: "شققناها بالنبات النامي الخارج منها" },
    { word: "وقضبا", meaning: "علَفاً رطباً للدواب والأنعام (كالبرسيم)" },
    { word: "حدائق غلبا", meaning: "بساتين كثيرة الأشجار ملتفة الأغصان" },
    { word: "وأبا", meaning: "كلاً وعشباً للدواب والأنعام" },
    { word: "الصاخة", meaning: "الصيحة العظيمة المدوية التي تصم الآذان وهي نفخة البعث" },
    { word: "قترة", meaning: "ظلمة وغبرة وسواد" }
  ],
  586: [
    { word: "كورت", meaning: "جمعت ولف ذهاب ضيائها وأظلمت" },
    { word: "انكدرت", meaning: "تساقطت وتناثرت وتغير لونها وذهب ضوؤها" },
    { word: "سيرت", meaning: "نسفت من أماكنها وصارت هباءً منبثاً" },
    { word: "العشار عطلت", meaning: "النوق الحوامل الثمينة أهملت وتركها أصحابها بلا راعٍ" },
    { word: "حشرت", meaning: "جمع الوحوش ليتناصف بعضها من بعض" },
    { word: "سجرت", meaning: "أوقدت وصارت ناراً تتأجج" },
    { word: "النفوس زوجت", meaning: "قرن كل صاحب عمل بنظيره" },
    { word: "الموؤودة سئلت", meaning: "الطفلة التي دفنت حية في التراب خوف العار أو الفقر" },
    { word: "الصحف نشرت", meaning: "بسطت صحف الأعمال لتقرأ" },
    { word: "كشطت", meaning: "نزعت وأزيلت عن أماكنها كما ينزع الجلد" },
    { word: "سعرت", meaning: "أوقدت بشدة وضوعف لهيبها" }
  ],
  604: [
    { word: "الوسواس الخناس", meaning: "الشيطان الذي يوسوس عند الغفلة ويختفي ويتراجع عند ذكر الله" },
    { word: "الجنة والناس", meaning: "شياطين الجن وشياطين الإنس" }
  ]
};

// ─── Quran Tracker & Visual Mushaf ────────────────────────────────────────────
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

  // Visual Mushaf States (1 to 604 pages)
  const [activePage, setActivePage] = useState<number>(1);
  const [activeSurahNum, setActiveSurahNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmark, setBookmark] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      return saved ? Math.min(Number(saved), 604) : null;
    } catch {
      return null;
    }
  });

  // Clamp activePage to maximum 604 pages of Madinah Mushaf
  useEffect(() => {
    if (activePage > 604) {
      setActivePage(604);
      setActiveSurahNum(114);
    }
  }, [activePage]);

  const safePage = Math.min(Math.max(activePage, 1), 604);

  const [tafsirAyahs, setTafsirAyahs] = useState<{ number: number; text: string }[]>([]);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [tafsirError, setTafsirError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingTafsir(true);
    setTafsirError("");
    setTafsirAyahs([]);
    
    fetch(`https://api.alquran.cloud/v1/page/${safePage}/ar.muyassar`)
      .then(res => {
        if (!res.ok) throw new Error("فشل تحميل التفسير");
        return res.json();
      })
      .then(json => {
        if (active && json.code === 200 && json.data && json.data.ayahs) {
          setTafsirAyahs(json.data.ayahs.map((a: any) => ({
            number: a.numberInSurah,
            text: a.text
          })));
        }
      })
      .catch(() => {
        if (active) setTafsirError("تعذر تحميل التفسير المباشر للصفحة.");
      })
      .finally(() => {
        if (active) setLoadingTafsir(false);
      });

    return () => {
      active = false;
    };
  }, [safePage]);

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

  const handleSaveBookmark = () => {
    setBookmark(activePage);
    localStorage.setItem(BOOKMARK_KEY, activePage.toString());
  };

  const handleLoadBookmark = () => {
    if (bookmark) {
      setActivePage(bookmark);
      // Determine which Surah corresponds to this bookmarked page
      let foundSurah = 1;
      for (let sNum = 1; sNum <= 114; sNum++) {
        const startPage = SURAHS_STARTING_PAGES[sNum];
        if (bookmark >= startPage) {
          foundSurah = sNum;
        }
      }
      setActiveSurahNum(foundSurah);
    }
  };

  const progress = Math.min((quran.done / quran.goal) * 100, 100);
  const done = quran.done >= quran.goal;
  const unitLabel = quran.unit === "pages" ? "صفحة" : "جزء";

  // Filter Surahs with normalized Arabic text matching
  const normalizedQuery = normalizeArabic(searchQuery);
  const filteredSurahs = SURAHS_LIST.filter(s => {
    if (!searchQuery.trim()) return true;
    const normalizedName = normalizeArabic(s.name);
    return normalizedName.includes(normalizedQuery) || s.number.toString() === searchQuery.trim();
  });

  const turnPageNext = () => {
    if (activePage < 604) {
      const nextPage = activePage + 1;
      setActivePage(nextPage);
      // Auto-update Surah dropdown based on page boundaries
      let foundSurah = 1;
      for (let sNum = 1; sNum <= 114; sNum++) {
        if (nextPage >= SURAHS_STARTING_PAGES[sNum]) {
          foundSurah = sNum;
        }
      }
      setActiveSurahNum(foundSurah);
    }
  };

  const turnPagePrev = () => {
    if (activePage > 1) {
      const prevPage = activePage - 1;
      setActivePage(prevPage);
      // Auto-update Surah dropdown based on page boundaries
      let foundSurah = 1;
      for (let sNum = 1; sNum <= 114; sNum++) {
        if (prevPage >= SURAHS_STARTING_PAGES[sNum]) {
          foundSurah = sNum;
        }
      }
      setActiveSurahNum(foundSurah);
    }
  };

  const handleSurahSelect = (sNum: number) => {
    setActiveSurahNum(sNum);
    const startPage = SURAHS_STARTING_PAGES[sNum];
    if (startPage) {
      setActivePage(startPage);
    }
  };

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

      {/* Embedded 100% Authentic Madinah Mushaf (King Fahd Complex Scanned Pages) */}
      <div className="card" style={{ padding: "24px", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--bg-accent)", boxShadow: "var(--shadow-sm)" }}>
        
        {/* Mushaf Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--bg-accent)", paddingBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "var(--brand)", fontFamily: "Thmanyah Serif Display, serif" }}>مصحف المدينة النبوية الشريفة</h3>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--gold)", fontWeight: "bold" }}>
              نسخة مصورة ومطابقة 100% لمجمع الملك فهد لطباعة المصحف الشريف بالرسم العثماني وعلامات التجويد الكاملة
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={handleSaveBookmark} style={bookmarkSaveBtn} title="احفظ الصفحة الحالية كعلامة قراءة">
              🔖 حفظ العلامة
            </button>
            {bookmark && (
              <button onClick={handleLoadBookmark} style={bookmarkJumpBtn}>
                انتقل للعلامة (صفحة {bookmark})
              </button>
            )}
          </div>
        </div>

        {/* Surah List & Selector Dropdown */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <select
              value={activeSurahNum}
              onChange={(e) => handleSurahSelect(Number(e.target.value))}
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
              {(searchQuery.trim() ? filteredSurahs : SURAHS_LIST).map((s) => (
                <option key={s.number} value={s.number}>
                  سورة {s.name} (صفحة {SURAHS_STARTING_PAGES[s.number]})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "160px" }}>
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم أو الرقم..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                // If query matches exact number or single surah name, auto select
                const matched = SURAHS_LIST.find(s =>
                  s.number.toString() === val.trim() || normalizeArabic(s.name) === normalizeArabic(val)
                );
                if (matched) {
                  handleSurahSelect(matched.number);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1.5px solid var(--bg-accent)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-main)",
                fontSize: "13px",
                fontWeight: "600",
                outline: "none",
              }}
            />
          </div>
        </div>

        {searchQuery.trim() && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxHeight: "120px", overflowY: "auto", padding: "10px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--bg-accent)", borderRadius: "12px" }}>
            {filteredSurahs.length === 0 ? (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", padding: "4px" }}>لا توجد سورة تطابق بحثك</span>
            ) : (
              filteredSurahs.map(s => (
                <button
                  key={s.number}
                  onClick={() => { handleSurahSelect(s.number); setSearchQuery(""); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    backgroundColor: activeSurahNum === s.number ? QURAN_COLOR : "var(--bg-accent)",
                    color: activeSurahNum === s.number ? "white" : "var(--text-main)",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  سورة {s.name} (صفحة {SURAHS_STARTING_PAGES[s.number]})
                </button>
              ))
            )}
          </div>
        )}

        {/* Mushaf + Tafsir Side-by-Side Flex Layout */}
        <div style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          width: "100%",
          justifyContent: "center",
          alignItems: "stretch"
        }}>
          
          {/* Left/Center Column: Mushaf Page Frame */}
          <div style={{
            flex: "1 1 480px",
            maxWidth: "500px",
            backgroundColor: "#f7f5ed", // warm paper page color
            borderRadius: "16px",
            padding: "16px",
            border: "2px solid #e5dec9",
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            position: "relative"
          }}>
            {/* Page Image */}
            <div style={{
              maxWidth: "100%",
              width: "480px",
              minHeight: "500px",
              backgroundColor: "white",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #d4ccb6"
            }}>
              <img
                src={`https://cdn.jsdelivr.net/gh/GovarJabbar/Quran-PNG@master/${safePage.toString().padStart(3, '0')}.png`}
                alt={`مصحف المدينة صفحة ${safePage}`}
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = `https://everyayah.com/data/quranpages/page${safePage.toString().padStart(3, '0')}.png`;
                }}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  filter: "contrast(1.05) saturate(0.95)"
                }}
                loading="eager"
              />
            </div>

            {/* Hidden Image Preloader for instant page turning */}
            <div style={{ display: "none" }}>
              {safePage < 604 && (
                <img src={`https://cdn.jsdelivr.net/gh/GovarJabbar/Quran-PNG@master/${(safePage + 1).toString().padStart(3, '0')}.png`} />
              )}
              {safePage < 603 && (
                <img src={`https://cdn.jsdelivr.net/gh/GovarJabbar/Quran-PNG@master/${(safePage + 2).toString().padStart(3, '0')}.png`} />
              )}
              {activePage > 1 && (
                <img src={`https://cdn.jsdelivr.net/gh/GovarJabbar/Quran-PNG@master/${(activePage - 1).toString().padStart(3, '0')}.png`} />
              )}
            </div>

            {/* Navigation Controls Bar */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center", width: "100%", justifyContent: "center" }}>
              {/* Prev Page Button (turns to page with lower index - right to left navigation) */}
              <button
                onClick={turnPagePrev}
                disabled={activePage === 1}
                style={{
                  ...navArrowBtn,
                  opacity: activePage === 1 ? 0.4 : 1,
                  cursor: activePage === 1 ? "not-allowed" : "pointer"
                }}
                title="الصفحة السابقة"
              >
                السابق (يمين) →
              </button>

              <span style={{ fontSize: "14px", fontWeight: "800", color: "#4b4435", fontFamily: "system-ui" }}>
                صفحة {activePage} من 604
              </span>

              {/* Next Page Button (turns to page with higher index) */}
              <button
                onClick={turnPageNext}
                disabled={activePage === 604}
                style={{
                  ...navArrowBtn,
                  opacity: activePage === 604 ? 0.4 : 1,
                  cursor: activePage === 604 ? "not-allowed" : "pointer"
                }}
                title="الصفحة التالية"
              >
                ← التالي (يسار)
              </button>
            </div>
          </div>

          {/* Right Column: Words Meanings & Tafsir Card */}
          <div style={{
            flex: "1 1 350px",
            minWidth: "300px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid var(--bg-accent)",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            textAlign: "right"
          }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "var(--brand)", borderBottom: "2.5px solid var(--bg-accent)", paddingBottom: "10px" }}>
              تفسير وكلمات الصفحة {activePage}
            </h4>

            {/* Part 1: Word Meanings (Local Dictionary) */}
            {QURAN_WORDS_DICTIONARY[activePage] && QURAN_WORDS_DICTIONARY[activePage].length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid var(--bg-accent)", paddingBottom: "14px" }}>
                <h5 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "bold", color: "var(--gold)" }}>غريب كلمات الصفحة:</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {QURAN_WORDS_DICTIONARY[activePage].map((item, idx) => (
                    <div key={idx} style={{ padding: "8px 12px", backgroundColor: "var(--bg-primary)", borderRadius: "8px", borderRight: "3px solid var(--gold)", fontSize: "13px" }}>
                      <span style={{ fontWeight: "800", color: "var(--text-main)" }}>{item.word}</span>:{" "}
                      <span style={{ color: "var(--text-muted)" }}>{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ borderBottom: "1px solid var(--bg-accent)", paddingBottom: "14px" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  لا توجد كلمات غريبة مسجلة لهذه الصفحة. يمكنك قراءة التفسير الميسر للآيات بالأسفل.
                </p>
              </div>
            )}

            {/* Part 2: Tafsir Al-Muyassar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <h5 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "bold", color: "var(--color-sage)" }}>تفسير آيات الصفحة (الميسر):</h5>
              {loadingTafsir ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 10px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    border: "3px solid var(--bg-accent)",
                    borderTop: "3px solid var(--color-sage)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>جاري تحميل التفسير...</p>
                </div>
              ) : tafsirError ? (
                <p style={{ fontSize: "12px", color: "var(--color-terracotta)", textAlign: "center", padding: "20px 0" }}>{tafsirError}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingLeft: "8px" }}>
                  {tafsirAyahs.map((a) => (
                    <p key={a.number} style={{ margin: 0, fontSize: "13px", lineHeight: "1.7", textAlign: "right", color: "var(--text-main)" }}>
                      <strong style={{ color: "var(--color-sage)", marginLeft: "4px" }}>({a.number})</strong> {a.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
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
      {/* Quran tracker + Embedded complete verified Mushaf */}
      <QuranTracker />

      {/* Sebha Rosary Header */}
      <div style={{ ...progressOuter, borderColor: WIRD_COLOR + "30" }}>
        <div style={progressInner}>
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${(doneCount / totalCount) * 100}%`, backgroundColor: WIRD_COLOR }} />
          </div>
          <p style={progressText}>
            {allDone ? "✨ أتممت الأوراد والأذكار اليومية" : `${doneCount} من ${totalCount} مكتمل`}
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

const bookmarkSaveBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "12px",
  border: "1.5px solid var(--gold)",
  backgroundColor: "transparent",
  color: "var(--gold)",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer"
};

const bookmarkJumpBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "12px",
  border: "1.5px solid var(--brand)",
  backgroundColor: "var(--brand-light)",
  color: "var(--brand)",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer"
};

const navArrowBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "1.5px solid #d4ccb6",
  backgroundColor: "#fcfbf7",
  color: "#4b4435",
  fontSize: "12px",
  fontWeight: "bold",
  outline: "none"
};
