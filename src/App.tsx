import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAdminGuard } from "./hooks/useAdminGuard";
import { useAppData } from "./hooks/useAppData";
import { useNotifications } from "./hooks/useNotifications";
import { useDeveloperContact } from "./hooks/useDeveloperContact";
import { Login } from "./components/Login";
import type { DailyLog } from "./components/HistoryArchive";

// ─── Lazy imports ──────────────────────────────────────────────────────────────
const AdminPanel    = lazy(() => import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel })));
const PrayerTimes   = lazy(() => import("./components/PrayerTimes").then((m) => ({ default: m.PrayerTimes })));
const Athkar        = lazy(() => import("./components/Athkar").then((m) => ({ default: m.Athkar })));
const DailyWird     = lazy(() => import("./components/DailyWird").then((m) => ({ default: m.DailyWird })));
const HistoryArchive = lazy(() => import("./components/HistoryArchive").then((m) => ({ default: m.HistoryArchive })));
const GardenView    = lazy(() => import("./components/GardenView").then((m) => ({ default: m.GardenView })));

// ─── Firebase ────────────────────────────────────────────────────────────────
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── Quran Verses ─────────────────────────────────────────────────────────────
const QURANIC_VERSES = [
  { ayah: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", surah: "سورة الرعد - الآية 28" },
  { ayah: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا * وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", surah: "سورة الطلاق - الآية 2-3" },
  { ayah: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "سورة الشرح - الآية 6" },
  { ayah: "فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ", surah: "سورة البقرة - الآية 186" },
  { ayah: "ادْعُونِي أَسْتَجِبْ لَكُمْ", surah: "سورة غافر - الآية 60" },
  { ayah: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ", surah: "سورة البقرة - الآية 45" },
  { ayah: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", surah: "سورة إبراهيم - الآية 7" },
  { ayah: "لا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", surah: "سورة التوبة - الآية 40" },
  { ayah: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", surah: "سورة الطلاق - الآية 3" },
  { ayah: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", surah: "سورة البقرة - الآية 153" },
  { ayah: "وَوَجَدَكَ ضَالًّا فَهَدَىٰ", surah: "سورة الضحى - الآية 7" },
  { ayah: "وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا", surah: "سورة الأحزاب - الآية 35" },
];

function randomAyah() {
  return QURANIC_VERSES[Math.floor(Math.random() * QURANIC_VERSES.length)];
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth & User ────────────────────────────────────────────────────────────
  const [userId, setUserId]       = useState<string>(() => localStorage.getItem("tawazon_current_uid") || "guest");
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>("tawazon_logged_in", false);
  const [userName, setUserName]   = useLocalStorage<string>("tawazon_user_name", "");
  const [theme, setTheme]         = useLocalStorage<"light" | "dark">("tawazon_theme", "light");
  const [activeTab, setActiveTab] = useState<"home" | "archive" | "prayer" | "athkar" | "wird" | "admin">("home");
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>("tawazon_last_reset", "");
  const isAdmin = useAdminGuard();

  // ── Data (habits, days, logs) via dedicated hook ───────────────────────────
  const {
    habits, setHabits,
    daysCompleted, setDaysCompleted,
    challengeStartDate, setChallengeStartDate,
    challengeTitle, setChallengeTitle,
    dailyLogs, setDailyLogs,
    isDataReady,
  } = useAppData(userId);

  // ── Ayah ───────────────────────────────────────────────────────────────────
  const [currentAyah, setCurrentAyah] = useState(randomAyah);
  const handleNextAyah = () => {
    let next = randomAyah();
    while (next.ayah === currentAyah.ayah && QURANIC_VERSES.length > 1) next = randomAyah();
    setCurrentAyah(next);
  };

  // ── Habit helpers ──────────────────────────────────────────────────────────
  const [newHabitName, setNewHabitName] = useState("");
  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

  const handleToggleHabit = (id: string) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    setHabits([...habits, { id: Date.now().toString(), name: newHabitName.trim(), completed: false, category: "mindfulness" as const }]);
    setNewHabitName("");
  };

  // ── Challenge day index ────────────────────────────────────────────────────
  const getChallengeDayIndex = () => {
    const start = new Date(challengeStartDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };
  const currentDayIndex = getChallengeDayIndex();
  const todayPhase      = Math.floor(currentDayIndex / 30) + 1;
  const todayLocalIdx   = currentDayIndex % 30;

  const [activePhase, setActivePhase] = useState<number>(() => {
    const elapsed = getChallengeDayIndex();
    return Math.max(1, Math.min(3, Math.floor(elapsed / 30) + 1));
  });

  const handleResetChallenge = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة بدء التحدي من اليوم وتصفير التقدم؟")) {
      setChallengeStartDate(new Date().toISOString());
      setDaysCompleted(Array(90).fill(false));
    }
  };

  // Auto-complete today in grid when all habits done
  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      if (currentDayIndex >= 0 && currentDayIndex < 90) {
        setDaysCompleted((prev) => {
          const next = [...prev];
          next[currentDayIndex] = true;
          return next;
        });
      }
    }
  }, [completedCount, totalCount, currentDayIndex]);

  // ── Notifications ──────────────────────────────────────────────────────────
  const { notificationsEnabled, toggleNotifications } = useNotifications(isLoggedIn, completedCount, totalCount);

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // ── Firebase Auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || user.email?.split("@")[0] || "مستخدم توازن";
        setUserName(name);
        setIsLoggedIn(true);
        setUserId(user.uid);
        localStorage.setItem("tawazon_current_uid", user.uid);
      } else {
        setUserId("guest");
        localStorage.setItem("tawazon_current_uid", "guest");
      }
    });
    return unsub;
  }, [setIsLoggedIn, setUserName]);

  // ── Log user activity ──────────────────────────────────────────────────────
  const logUserActivity = async (name: string, method: string) => {
    if (!auth || !db) return;
    try {
      let ip = "unknown", city = "", country = "";
      try {
        const ipRes  = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip;
        const geoRes  = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();
        city = geoData.city || "";
        country = geoData.country_name || "";
      } catch {}
      await addDoc(collection(db, "user_activity"), {
        uid: auth.currentUser?.uid || "guest",
        name, email: auth.currentUser?.email || "",
        phone: auth.currentUser?.phoneNumber || "",
        method, ip, city, country,
        timestamp: Date.now(), loginCount: 1,
        serverTime: serverTimestamp(),
      });
    } catch {}
  };

  const handleLoginSuccess = (name: string, method: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    if (auth?.currentUser) {
      setUserId(auth.currentUser.uid);
      localStorage.setItem("tawazon_current_uid", auth.currentUser.uid);
    }
    logUserActivity(name, method);
  };

  const handleLogout = async () => {
    if (!window.confirm("هل ترغب في تسجيل الخروج من تطبيق توازن؟")) return;
    try { if (auth?.currentUser) await signOut(auth); } catch {}
    setIsLoggedIn(false);
    setUserName("");
    setUserId("guest");
    localStorage.setItem("tawazon_current_uid", "guest");
    if (activeTab === "admin") setActiveTab("home");
  };

  // ── Daily reset ────────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      setHabits(habits.map((h) => ({ ...h, completed: false })));
      setLastResetDate(today);
    }
  }, [lastResetDate, habits, setHabits, setLastResetDate]);

  // ── Today's note ───────────────────────────────────────────────────────────
  const [todayNote, setTodayNote]           = useState("");
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const hasInitializedNote = useRef(false);

  useEffect(() => {
    if (!isDataReady || hasInitializedNote.current) return;
    const todayRaw = new Date().toDateString();
    const log = dailyLogs.find((l) => l.rawDate === todayRaw);
    if (log) { setTodayNote(log.note || ""); hasInitializedNote.current = true; }
  }, [dailyLogs, isDataReady]);

  const handleSaveDay = () => {
    if (!isLoggedIn) return;
    const todayRaw = new Date().toDateString();
    const todayEG  = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const completedList = habits.filter((h) => h.completed).map((h) => h.name);
    setDailyLogs((prev) => {
      const idx = prev.findIndex((l) => l.rawDate === todayRaw);
      const newLog: DailyLog = {
        id: idx >= 0 ? prev[idx].id : Date.now().toString(),
        dateString: todayEG, rawDate: todayRaw, mood: "calm",
        note: todayNote, completedHabits: completedList, totalHabits: habits.length,
      };
      const updated = [...prev];
      idx >= 0 ? (updated[idx] = newLog) : updated.push(newLog);
      return updated;
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  // ── Challenge title editing ────────────────────────────────────────────────
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // ── Welcome / Onboarding Modal ─────────────────────────────────────────────
  const [showDuaModal, setShowDuaModal] = useState<boolean>(() => {
    try { return !localStorage.getItem("tawazon_welcome_dua_v2"); } catch { return true; }
  });
  const [onboardingStep, setOnboardingStep] = useState(1);
  const handleDismissDua = () => {
    setShowDuaModal(false);
    try { localStorage.setItem("tawazon_welcome_dua_v2", "true"); } catch {}
  };

  // ── Developer Contact ──────────────────────────────────────────────────────
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const devContact = useDeveloperContact(userId, userName);

  // ─────────────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      {/* ── Welcome Modal ── */}
      {showDuaModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...duaModalContentStyle, maxWidth: "460px", padding: "28px 24px" }}>
            {onboardingStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: "46px", marginBottom: "12px", animation: "floatLeaf 3s infinite ease-in-out" }} className="leaf-animation">🌿</span>
                <h3 style={{ margin: "0 0 12px", color: "var(--brand)", fontSize: "20px", fontWeight: "900", fontFamily: "Thmanyah Serif Display, serif" }}>
                  مرحباً بك في توازن
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "13px", lineHeight: "1.8", color: "var(--text-main)", textAlign: "center" }}>
                  مساحتك الشخصية للارتقاء الروحي والذاتي. يهدف تطبيق <strong>توازن</strong> إلى مساعدتك في العثور على السكينة اليومية والتوازن من خلال تنظيم عباداتك وبناء عادات تدوم طويلاً.
                </p>
                <button onClick={() => setOnboardingStep(2)} style={duaModalBtnStyle}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  الخطوة التالية ➔
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: "46px", marginBottom: "12px" }}>🤲</span>
                <h3 style={{ margin: "0 0 12px", color: "var(--brand)", fontSize: "19px", fontWeight: "900", fontFamily: "Thmanyah Serif Display, serif" }}>
                  دعاء من القلب
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "13px", lineHeight: "1.8", color: "var(--text-main)", fontWeight: "800", textAlign: "center" }}>
                  نرجو منك التكرم بالدعاء بالخير والرزق الحلال والبركة والتوفيق لصاحب هذا الموقع وعائلته.
                </p>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", textAlign: "center" }}>
                  💡 يمكنك التواصل مع المطور وإرسال اقتراحات تعديل الألوان أو الميزات بالضغط على أيقونة الرسالة بالواجهة.
                </div>
                <button onClick={handleDismissDua} style={duaModalBtnStyle}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  اللهم آمين، دعنا نبدأ! ✨
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: onboardingStep === 1 ? "var(--brand)" : "var(--bg-accent)", transition: "all 0.2s" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: onboardingStep === 2 ? "var(--brand)" : "var(--bg-accent)", transition: "all 0.2s" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Brand Title ── */}
      <div style={{ textAlign: "center", marginTop: "36px", marginBottom: "8px" }}>
        <h1 className="logo-text" style={{ fontSize: "38px", color: "var(--brand)", fontFamily: "Thmanyah Serif Display, serif", fontWeight: "bold", letterSpacing: "-0.5px" }}>
          توازن
        </h1>
      </div>

      {/* ── Navigation ── */}
      <nav className="nav-links">
        {[
          { id: "home",    label: "الرئيسية" },
          { id: "prayer",  label: "الصلوات" },
          { id: "wird",    label: "الورد" },
          { id: "athkar",  label: "الأذكار" },
          { id: "archive", label: "سجل الأيام" },
        ].map(({ id, label }) => (
          <button
            key={id}
            className={`nav-button ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id as typeof activeTab)}
          >
            <span>{label}</span>
          </button>
        ))}
        {isAdmin && (
          <button
            className={`nav-button ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <span>الإدارة</span>
          </button>
        )}
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        {activeTab === "home" && (
          <div className="card" style={mainDashboardCardStyle}>
            {/* Header Bar */}
            <div style={cardHeaderBarStyle}>
              <h2 style={{ fontFamily: "Thmanyah Serif Display, serif", color: "var(--brand)", fontSize: "22px", fontWeight: "bold", margin: 0 }}>
                توازن
              </h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={userAvatarCircleMini} onClick={handleLogout} title="تسجيل الخروج">
                  {userName?.charAt(0) || "ب"}
                </div>
                <button onClick={toggleNotifications} style={cardHeaderIconBtnStyle} title={notificationsEnabled ? "إيقاف الإشعارات" : "تفعيل الإشعارات"}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={notificationsEnabled ? "var(--brand)" : "none"} stroke={notificationsEnabled ? "var(--brand)" : "var(--text-muted)"} strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </button>
                <button onClick={toggleTheme} style={cardHeaderIconBtnStyle} title="تبديل السمة">
                  {theme === "dark" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button onClick={() => setShowDeveloperModal(true)} style={cardHeaderIconBtnStyle} title="أرسل رسالة أو اقتراحاً للمطور">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid-inner">
              {/* Left Column */}
              <div style={dashboardColumnStyle}>
                {/* Ayah Card */}
                <div className="card" style={{
                  background: "linear-gradient(135deg, #105b3d 0%, #0d462f 100%)",
                  color: "white", borderRadius: "20px", padding: "24px 20px",
                  boxShadow: "0 10px 25px rgba(16, 91, 61, 0.25)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  textAlign: "center", position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "20px" }}>📖 آية اليوم</span>
                    <button onClick={handleNextAyah} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "12px", padding: "5px 12px", color: "white", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>🔄 آية أخرى</button>
                  </div>
                  <p style={{ fontFamily: "Thmanyah Serif Display, serif", fontSize: "18px", fontWeight: "bold", lineHeight: "1.9", margin: "12px 0 14px", color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>
                    ﴿ {currentAyah.ayah} ﴾
                  </p>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>{currentAyah.surah}</span>
                </div>

                {/* Habits */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>

                {/* GardenView — حديقة تتفتح مع إكمال العادات */}
                <Suspense fallback={null}>
                  <GardenView completedCount={completedCount} totalCount={totalCount} theme={theme} />
                </Suspense>
                  <h4 style={checklistTitleStyle}>المهام اليومية</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {habits.map((habit) => (
                      <div key={habit.id} onClick={() => handleToggleHabit(habit.id)}
                        style={{ ...checklistRowStyle, backgroundColor: habit.completed ? "var(--brand-light)" : "transparent", borderColor: habit.completed ? "rgba(17,91,61,0.15)" : "var(--bg-accent)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                          <span style={checklistIconStyle}>🌿</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", textAlign: "right" }}>{habit.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button onClick={(e) => { e.stopPropagation(); setHabits(habits.filter((h) => h.id !== habit.id)); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", display: "flex", alignItems: "center" }}
                            title="حذف العادة"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                          <div style={{ ...checklistCheckboxStyle, backgroundColor: habit.completed ? "var(--brand)" : "transparent", borderColor: habit.completed ? "var(--brand)" : "var(--text-muted)" }}>
                            {habit.completed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 4 7 9 1" /></svg>}
                          </div>
                        </div>
                      </div>
                    ))}

                    <form onSubmit={handleAddCustomHabit} className="add-habit-form">
                      <input type="text" placeholder="إضافة مهام اليوم..." value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className="add-habit-input" />
                      <button type="submit" className="add-habit-btn">إضافة</button>
                    </form>

                    {/* Daily Note */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", padding: "16px", backgroundColor: "var(--bg-primary)", borderRadius: "12px", border: "1px solid var(--bg-accent)" }}>
                      <h5 style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "var(--text-main)", textAlign: "right" }}>كتابة مذكرة أو رسالة لليوم 📝</h5>
                      <textarea
                        value={todayNote}
                        onChange={(e) => setTodayNote(e.target.value)}
                        placeholder="اكتب مذكراتك أو امتنانك لليوم هنا..."
                        rows={3} maxLength={300}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--bg-accent)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", fontFamily: "inherit", fontSize: "12.5px", outline: "none", resize: "none", textAlign: "right" }}
                      />
                      <button onClick={handleSaveDay}
                        style={{ backgroundColor: "var(--brand)", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s ease", textAlign: "center" }}
                      >
                        {isSavedRecently ? "تم حفظ اليوم بنجاح! 🌿" : "حفظ المذكرات والعادات"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column — 90 Day Challenge */}
              <div style={dashboardColumnStyle}>
                <div style={habitTrackerHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isEditingTitle ? (
                      <input type="text" value={challengeTitle} onChange={(e) => setChallengeTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => { if (e.key === "Enter") setIsEditingTitle(false); }}
                        autoFocus
                        style={{ fontSize: "13px", fontWeight: "bold", border: "1px solid var(--gold)", borderRadius: "8px", padding: "4px 8px", backgroundColor: "var(--bg-primary)", color: "var(--text-main)", outline: "none" }}
                      />
                    ) : (
                      <span onClick={() => setIsEditingTitle(true)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }} title="اضغط لتعديل عنوان التحدي">
                        <h3 style={{ ...columnTitleStyle, borderBottom: "1px dashed var(--gold)", paddingBottom: "2px" }}>{challengeTitle}</h3>
                        <span style={{ fontSize: "12px" }}>✏️</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button onClick={() => setActivePhase(p => Math.max(1, p - 1))} disabled={activePhase === 1}
                      style={{ background: "none", border: "none", color: activePhase === 1 ? "var(--text-muted)" : "var(--gold)", cursor: activePhase === 1 ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "bold" }}>{"<"}</button>
                    <span style={{ ...monthTitleStyle, color: "var(--gold)" }}>
                      المرحلة {activePhase} (اليوم {currentDayIndex >= 0 && currentDayIndex < 90 ? currentDayIndex + 1 : 90} من 90)
                    </span>
                    <button onClick={() => setActivePhase(p => Math.min(3, p + 1))} disabled={activePhase === 3}
                      style={{ background: "none", border: "none", color: activePhase === 3 ? "var(--text-muted)" : "var(--gold)", cursor: activePhase === 3 ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "bold" }}>{">"}</button>
                    <button onClick={handleResetChallenge} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px 4px", color: "var(--text-muted)" }} title="إعادة بدء التحدي">🔄</button>
                  </div>
                </div>

                <div className="calendar-grid">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const globalIdx  = (activePhase - 1) * 30 + idx;
                    const isDone     = daysCompleted[globalIdx];
                    const isToday    = activePhase === todayPhase && idx === todayLocalIdx;
                    return (
                      <div key={idx}
                        onClick={() => setDaysCompleted(prev => { const next = [...prev]; next[globalIdx] = !next[globalIdx]; return next; })}
                        style={{ ...calendarDayCircleStyle, fontSize: "13px", backgroundColor: isDone ? "var(--brand)" : "transparent", borderColor: isDone ? "var(--brand)" : isToday ? "var(--gold)" : "var(--bg-accent)", color: isDone ? "white" : "var(--text-muted)", fontWeight: isToday ? "bold" : "normal", boxShadow: isToday ? "0 0 10px rgba(194,144,40,0.25)" : "none" }}
                        title={`اليوم ${globalIdx + 1}`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>
                    معدل الالتزام: {Math.round((daysCompleted.filter(Boolean).length / 90) * 100)}%
                  </span>
                  <button onClick={() => { if (window.confirm("هل ترغب في تصفير تقدم التحدي بالكامل؟")) setDaysCompleted(Array(90).fill(false)); }} style={cardFooterBtnStyle}>
                    إعادة تعيين التقويم 🔄
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "archive" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل سجل الأيام...</div></div>}>
            <div style={focusedContainerStyle}><HistoryArchive logs={dailyLogs} /></div>
          </Suspense>
        )}
        {activeTab === "prayer" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل مواقيت الصلاة...</div></div>}>
            <div style={focusedContainerStyle}><PrayerTimes /></div>
          </Suspense>
        )}
        {activeTab === "athkar" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل الأذكار...</div></div>}>
            <div style={focusedContainerStyle}><Athkar /></div>
          </Suspense>
        )}
        {activeTab === "wird" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل الورد اليومي...</div></div>}>
            <div style={focusedContainerStyle}><DailyWird /></div>
          </Suspense>
        )}
        {activeTab === "admin" && isAdmin && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل لوحة الإدارة...</div></div>}>
            <div style={focusedContainerStyle}><AdminPanel /></div>
          </Suspense>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h4 style={{ ...footerBrandName, margin: 0 }}>منصة توازن</h4>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
            <a href="https://wa.me/201092610252" target="_blank" rel="noopener noreferrer" style={footerContactIconStyle} title="واتساب">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </a>
            <a href="mailto:basemmahmoud545@gmail.com" style={footerContactIconStyle} title="البريد الإلكتروني">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>
        <p style={{ ...footerCredit, marginTop: "8px", fontWeight: "bold", color: "var(--brand)" }}>تم التطوير بواسطة باسم محمود 🌿</p>
        <p style={footerCredit}>جميع الحقوق محفوظة لـ توازن © {new Date().getFullYear()}</p>
      </footer>

      {/* ── Developer Modal ── */}
      {showDeveloperModal && (
        <div style={modalOverlayStyle} onClick={() => setShowDeveloperModal(false)}>
          <div style={{ ...duaModalContentStyle, maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontFamily: "Thmanyah Serif Display, serif", color: "var(--brand)" }}>تواصل مع المطور 🌿</h3>
              <button onClick={() => setShowDeveloperModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            {devContact.sentSuccess ? (
              <div style={{ padding: "30px 10px", color: "var(--brand)", fontWeight: "bold" }}>
                <p style={{ fontSize: "16px", marginBottom: "8px" }}>تم إرسال اقتراحك بنجاح! 🎉</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>شكراً لك على مساعدتنا في تحسين توازن.</p>
              </div>
            ) : (
              <form onSubmit={devContact.submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px", textAlign: "right" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>نوع الرسالة</label>
                  <select value={devContact.msgType} onChange={(e: any) => devContact.setMsgType(e.target.value)}
                    style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--bg-accent)", backgroundColor: "var(--bg-primary)", color: "var(--text-main)", fontFamily: "inherit", outline: "none" }}
                  >
                    <option value="color_theme">تعديل ألوان وتصميم</option>
                    <option value="add_feature">طلب إضافة ميزة</option>
                    <option value="report_bug">الإبلاغ عن مشكلة</option>
                    <option value="other">اقتراح عام / أخرى</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>اقتراحك أو رسالتك</label>
                  <textarea rows={4} value={devContact.msgText} onChange={(e) => devContact.setMsgText(e.target.value)}
                    placeholder="اكتب هنا ما تحتاجه..." required
                    style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--bg-accent)", backgroundColor: "var(--bg-primary)", color: "var(--text-main)", fontFamily: "inherit", outline: "none", resize: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>طريقة التواصل معك (اختياري)</label>
                  <input type="text" value={devContact.contact} onChange={(e) => devContact.setContact(e.target.value)}
                    placeholder="رقم هاتف أو بريد إلكتروني"
                    style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--bg-accent)", backgroundColor: "var(--bg-primary)", color: "var(--text-main)", fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <button type="submit" disabled={devContact.sending}
                  style={{ ...duaModalBtnStyle, marginTop: "10px", opacity: devContact.sending ? 0.7 : 1, cursor: devContact.sending ? "not-allowed" : "pointer" }}
                >
                  {devContact.sending ? "جاري الإرسال..." : "إرسال الرسالة للمطور (مباشر)"}
                </button>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button type="button" onClick={devContact.sendWhatsApp}
                    style={{ flex: 1, padding: "10px", borderRadius: "10px", backgroundColor: "#25D366", color: "#ffffff", border: "none", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                  >💬 إرسال عبر واتساب</button>
                  <button type="button" onClick={devContact.sendEmail}
                    style={{ flex: 1, padding: "10px", borderRadius: "10px", backgroundColor: "#ea4335", color: "#ffffff", border: "none", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                  >✉️ إرسال عبر الإيميل</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const mainDashboardCardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)", borderRadius: "28px", padding: "32px",
  border: "1px solid var(--bg-accent)", boxShadow: "var(--shadow-md)",
  width: "100%", maxWidth: "1000px", margin: "0 auto",
  display: "flex", flexDirection: "column", gap: "24px",
};
const cardHeaderBarStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  borderBottom: "1px solid var(--bg-accent)", paddingBottom: "16px",
};
const userAvatarCircleMini: React.CSSProperties = {
  width: "36px", height: "36px", borderRadius: "50%",
  backgroundColor: "var(--brand)", color: "white",
  fontWeight: "800", fontSize: "14px",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", boxShadow: "0 4px 10px rgba(17,91,61,0.15)",
};
const cardHeaderIconBtnStyle: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--bg-accent)",
  borderRadius: "50%", width: "36px", height: "36px",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: "var(--text-muted)", transition: "all 0.2s ease", outline: "none",
};
const dashboardColumnStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "20px" };
const habitTrackerHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const columnTitleStyle: React.CSSProperties = { fontSize: "17px", fontWeight: "900", color: "var(--text-main)", margin: 0 };
const monthTitleStyle: React.CSSProperties = { fontSize: "13px", fontWeight: "800", color: "var(--text-main)" };
const calendarDayCircleStyle: React.CSSProperties = {
  aspectRatio: "1/1", borderRadius: "50%", border: "1.5px solid",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "13px", cursor: "pointer", transition: "all 0.2s ease", userSelect: "none",
};
const cardFooterBtnStyle: React.CSSProperties = {
  background: "var(--brand-light)", border: "1px solid rgba(17,91,61,0.1)",
  color: "var(--brand)", fontSize: "11px", fontWeight: "800",
  padding: "6px 16px", borderRadius: "30px", cursor: "pointer",
};
const checklistTitleStyle: React.CSSProperties = { fontSize: "14px", fontWeight: "800", color: "var(--text-main)", margin: 0 };
const checklistRowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 16px", borderRadius: "14px", border: "1.5px solid",
  cursor: "pointer", transition: "all 0.2s ease",
};
const checklistIconStyle: React.CSSProperties = { fontSize: "16px" };
const checklistCheckboxStyle: React.CSSProperties = {
  width: "20px", height: "20px", borderRadius: "6px", border: "2px solid",
  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease",
};
const focusedContainerStyle: React.CSSProperties = { width: "100%", maxWidth: "1000px", margin: "0 auto" };
const footerBrandName: React.CSSProperties = { margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "var(--text-main)" };
const footerContactIconStyle: React.CSSProperties = {
  width: "36px", height: "36px", borderRadius: "50%",
  border: "1.5px solid var(--bg-accent)", backgroundColor: "var(--bg-card)",
  color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", transition: "all 0.2s ease", outline: "none",
};
const footerCredit: React.CSSProperties = { margin: 0, fontSize: "11px", color: "var(--text-muted)", opacity: 0.7 };
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 10000, padding: "20px",
};
const duaModalContentStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)", borderRadius: "24px", padding: "32px 24px",
  maxWidth: "380px", width: "100%", maxHeight: "90vh", overflowY: "auto",
  boxShadow: "0 20px 40px rgba(0,0,0,0.18)", border: "1.5px solid var(--bg-accent)",
  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
};
const duaModalBtnStyle: React.CSSProperties = {
  width: "100%", padding: "12px", borderRadius: "14px",
  backgroundColor: "var(--brand)", color: "white", border: "none",
  fontWeight: "900", fontSize: "14px", cursor: "pointer",
  boxShadow: "0 4px 12px rgba(17,91,61,0.2)", transition: "all 0.2s ease", outline: "none",
};
