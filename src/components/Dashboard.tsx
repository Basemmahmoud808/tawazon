import React, { useState, useEffect } from "react";

interface DashboardProps {
  completedCount: number;
  totalCount: number;
  moodCount: number;
  todayMood?: "energetic" | "happy" | "calm" | "tired" | "anxious";
}

const calmingQuotes = [
  { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "سورة الشرح: 5-6" },
  { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "سورة الرعد: 28" },
  { text: "وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا", ref: "سورة الطور: 48" },
  { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", ref: "سورة الطلاق: 3" },
  { text: "إِنَّ رَبِّي لَقَرِيبٌ مُّجِيبٌ", ref: "سورة هود: 61" },
  { text: "وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ", ref: "سورة الفرقان: 58" },
  { text: "إِنَّ مَعِيَ رَبِّي سَيَهْدِينِ", ref: "سورة الشعراء: 62" },
  { text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ", ref: "سورة غافر: 60" },
];

const moodReassurances: Record<string, { text: string; ref: string; note: string }> = {
  anxious: {
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    ref: "سورة الرعد: 28",
    note: "عندما تشعر بالقلق والتوتر، رطب لسانك بذكر الله واسأله الطمأنينة والهدوء ليذهب عنك وسواس النفس.",
  },
  tired: {
    text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    ref: "سورة البقرة: 286",
    note: "التعب دليل على سعيك الصالح. لا تحمل نفسك فوق طاقتها وخذ قسطاً من الراحة البدنية والروحية اليوم.",
  },
  energetic: {
    text: "يَخْلُقُ مَا يَشَاءُ ۚ وَهُوَ الْعَلِيمُ الْقَدِيرُ",
    ref: "سورة الروم: 54",
    note: "استثمر هذه الطاقة الإيجابية والنشاط اليوم في إنجاز طاعاتك وأهدافك وكن عوناً لغيرك.",
  },
  happy: {
    text: "فَبِذَٰلِكَ فَلْيَفْرَحُوا هُوَ خَيْرٌ مِّمَّا يَجْمَعُونَ",
    ref: "سورة يونس: 58",
    note: "الحمد لله على نعمة الفرح والسرور. حافظ على بهجتك وشاركها مع أهلك ومن تحب.",
  },
  calm: {
    text: "هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ",
    ref: "سورة الفتح: 4",
    note: "الهدوء نعمة وراحة للبال. استمتع بهذا السلام الداخلي ورتب أفكارك بهدوء وتركيز.",
  },
};

export const Dashboard: React.FC<DashboardProps> = ({ completedCount, totalCount, moodCount, todayMood }) => {
  const [greeting, setGreeting] = useState("");
  const [greetingIcon, setGreetingIcon] = useState("🌿");
  const [quote, setQuote] = useState<{ text: string; ref: string }>({ text: "", ref: "" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      setGreeting("صباح الخير والبركات والنشاط"); setGreetingIcon("🌅");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("طاب يومك بكل خير وسرور"); setGreetingIcon("☀️");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("مساء النور والسكينة والوقار"); setGreetingIcon("🌙");
    } else {
      setGreeting("مساء الخير والراحة والاطمئنان"); setGreetingIcon("✨");
    }
    const idx = Math.floor(Math.random() * calmingQuotes.length);
    setQuote(calmingQuotes[idx]);
  }, []);

  const getEncouragingMessage = () => {
    if (totalCount === 0) return "لا توجد عادات مسجلة اليوم للبدء بها.";
    const pct = Math.round((completedCount / totalCount) * 100);
    if (pct === 0) return "ابحث عن عادة صغيرة وابدأ بها الآن!";
    if (pct < 50) return "بداية ممتازة! خطوة بخطوة نحو عادات أفضل.";
    if (pct < 100) return "رائع! اقتربت من إكمال جميع عاداتك اليوم.";
    return "أحسنت صنعاً! أتممت جميع العادات اليوم بنجاح! 🎉";
  };

  const activeMood = todayMood ? moodReassurances[todayMood] : null;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={wrapper}>

      {/* Hero Card */}
      <div style={heroCard}>
        {/* Decorative gradient orbs */}
        <div style={orb1} />
        <div style={orb2} />

        {/* Content */}
        <div style={heroContent}>
          {/* Greeting */}
          <div style={greetingRow}>
            <span style={greetingEmoji}>{greetingIcon}</span>
            <h2 style={greetingText}>{greeting}</h2>
          </div>
          <p style={heroSub}>توازنك اليومي هو سر نجاحك • {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</p>

          {/* Quranic verse */}
          <div style={verseBox}>
            {activeMood ? (
              <>
                <div style={verseLabel}>
                  <span>💡 توجيه لمزاجك الحالي</span>
                </div>
                <p style={verseText}>"{activeMood.text}"</p>
                <p style={verseRef}>{activeMood.ref}</p>
                <p style={verseNote}>{activeMood.note}</p>
              </>
            ) : (
              <>
                <div style={verseLabel}>
                  <span>📖 آية وتأمل</span>
                </div>
                <p style={verseText}>"{quote.text}"</p>
                <p style={verseRef}>{quote.ref}</p>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div style={heroProgressOuter}>
            <div style={heroProgressHeader}>
              <span style={heroProgressLabel}>إنجاز اليوم</span>
              <span style={heroProgressPct}>{pct}%</span>
            </div>
            <div style={heroProgressTrack}>
              <div style={{ ...heroProgressFill, width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={statsRow}>
        {/* Habits */}
        <div className="card" style={statCard}>
          <div style={{ ...statIconBox, background: "linear-gradient(to bottom, #1a6b4a, #22886b)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div style={statInfo}>
            <span style={statNum}>{completedCount}<span style={statDenom}>/{totalCount}</span></span>
            <span style={statLabel}>العادات المكتملة</span>
          </div>
        </div>

        {/* Mood */}
        <div className="card" style={statCard}>
          <div style={{ ...statIconBox, background: "linear-gradient(to bottom, #1a6b4a, #22886b)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <div style={statInfo}>
            <span style={statNum}>{moodCount}</span>
            <span style={statLabel}>أيام تتبع المزاج</span>
          </div>
        </div>

        {/* Message */}
        <div className="card" style={{ ...statCard, flex: "2 1 220px", backgroundColor: "var(--brand-light)", border: "1px solid rgba(26,107,74,0.12)" }}>
          <div style={{ ...statIconBox, background: "linear-gradient(to bottom, #c8963e, #e6b05a)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <div style={statInfo}>
            <span style={{ ...statLabel, color: "var(--brand)", fontWeight: "700" }}>التحفيز اليومي</span>
            <span style={{ ...statNum, fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginTop: "4px", lineHeight: "1.4" }}>
              {getEncouragingMessage()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const wrapper: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "16px" };

const heroCard: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "24px",
  background: "linear-gradient(to bottom, #0F4D35 0%, #0E4D3C 100%)",
  padding: "24px",
  boxShadow: "0 12px 30px rgba(14,77,53,0.25), 0 4px 10px rgba(0,0,0,0.06)",
};

const orb1: React.CSSProperties = {
  position: "absolute", top: "-40px", left: "-40px",
  width: "160px", height: "160px",
  background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
  borderRadius: "50%", pointerEvents: "none",
};
const orb2: React.CSSProperties = {
  position: "absolute", bottom: "-20px", right: "10%",
  width: "120px", height: "120px",
  background: "radial-gradient(circle, rgba(200,150,62,0.15) 0%, transparent 70%)",
  borderRadius: "50%", pointerEvents: "none",
};

const heroContent: React.CSSProperties = { position: "relative", zIndex: 1 };

const greetingRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px",
};
const greetingEmoji: React.CSSProperties = { fontSize: "24px", lineHeight: 1 };
const greetingText: React.CSSProperties = {
  margin: 0, fontSize: "20px", fontWeight: "800",
  color: "white",
};
const heroSub: React.CSSProperties = {
  margin: "0 0 16px", fontSize: "12px",
  color: "rgba(255,255,255,0.6)", fontWeight: "500",
};

const verseBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(8px)",
  borderRadius: "14px",
  padding: "14px 16px",
  marginBottom: "16px",
  border: "1px solid rgba(255,255,255,0.1)",
};
const verseLabel: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "5px",
  fontSize: "10px", fontWeight: "700",
  color: "rgba(200,150,62,0.9)",
  marginBottom: "8px",
};
const verseText: React.CSSProperties = {
  fontSize: "16px", fontWeight: "700", color: "white",
  lineHeight: "1.8", textAlign: "center", margin: "0 0 4px",
};
const verseRef: React.CSSProperties = {
  fontSize: "11px", color: "rgba(255,255,255,0.5)",
  textAlign: "center", margin: 0,
};
const verseNote: React.CSSProperties = {
  fontSize: "11px", color: "rgba(255,255,255,0.65)",
  textAlign: "center", marginTop: "6px", lineHeight: "1.5",
};

const heroProgressOuter: React.CSSProperties = {};
const heroProgressHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  marginBottom: "6px",
};
const heroProgressLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: "700",
  color: "rgba(255,255,255,0.7)",
};
const heroProgressPct: React.CSSProperties = {
  fontSize: "11px", fontWeight: "800",
  color: "rgba(200,150,62,0.9)",
};
const heroProgressTrack: React.CSSProperties = {
  height: "5px", backgroundColor: "rgba(255,255,255,0.15)",
  borderRadius: "3px", overflow: "hidden",
};
const heroProgressFill: React.CSSProperties = {
  height: "100%",
  background: "linear-gradient(to right, #c8963e, #e6b05a)",
  borderRadius: "3px",
  transition: "width 0.6s ease",
  boxShadow: "0 0 8px rgba(200,150,62,0.5)",
};

const statsRow: React.CSSProperties = {
  display: "flex", gap: "12px", flexWrap: "wrap",
};
const statCard: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "12px",
  padding: "16px", flex: "1 1 140px",
  borderRadius: "14px",
};
const statIconBox: React.CSSProperties = {
  width: "40px", height: "40px", borderRadius: "10px",
  display: "flex", alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};
const statInfo: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "2px",
};
const statNum: React.CSSProperties = {
  fontSize: "22px", fontWeight: "800",
  color: "var(--text-main)", lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
};
const statDenom: React.CSSProperties = {
  fontSize: "13px", fontWeight: "500", color: "var(--text-muted)",
};
const statLabel: React.CSSProperties = {
  fontSize: "11px", color: "var(--text-muted)", fontWeight: "600",
};
