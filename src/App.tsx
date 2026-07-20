import React, { lazy, Suspense, useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAdminGuard } from "./hooks/useAdminGuard";
import type { Habit } from "./components/HabitTracker";
import { Login } from "./components/Login";

// Archive & lazy imports
import type { DailyLog } from "./components/HistoryArchive";

const AdminPanel = lazy(() => import("./components/AdminPanel").then((module) => ({ default: module.AdminPanel })));
const PrayerTimes = lazy(() => import("./components/PrayerTimes").then((module) => ({ default: module.PrayerTimes })));
const Athkar = lazy(() => import("./components/Athkar").then((module) => ({ default: module.Athkar })));
const DailyWird = lazy(() => import("./components/DailyWird").then((module) => ({ default: module.DailyWird })));
const HistoryArchive = lazy(() => import("./components/HistoryArchive").then((module) => ({ default: module.HistoryArchive })));

// Firebase imports
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "شرب كوب من الماء عند الاستيقاظ", completed: false, category: "physical" },
  { id: "2", name: "التنفس بعمق لمدة دقيقتين", completed: false, category: "mindfulness" },
  { id: "3", name: "كتابة فكرة امتنان واحدة", completed: false, category: "mental" },
];

const MOCK_DAILY_LOGS: DailyLog[] = [
  {
    id: (Date.now() - 24 * 60 * 60 * 1000).toString(),
    dateString: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    rawDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString(),
    mood: "happy",
    note: "قضيت يوماً رائعاً في الطبيعة وأنهيت قراءة كتابي المفضل.",
    completedHabits: ["شرب كوب من الماء عند الاستيقاظ", "التنفس بعمق لمدة دقيقتين"],
    totalHabits: 3,
  },
  {
    id: (Date.now() - 2 * 24 * 60 * 60 * 1000).toString(),
    dateString: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    rawDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toDateString(),
    mood: "calm",
    note: "شعور بالهدوء والسلام الداخلي اليوم. تمرين التنفس المربع ساعدني جداً على التركيز والتخلص من توتر العمل.",
    completedHabits: ["التنفس بعمق لمدة دقيقتين", "كتابة فكرة امتنان واحدة", "شرب كوب من الماء عند الاستيقاظ"],
    totalHabits: 3,
  }
];

export default function App() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("tawazon_habits", DEFAULT_HABITS);
  const [activeTab, setActiveTab] = useState<"home" | "archive" | "prayer" | "athkar" | "wird" | "admin">("home");
  const isAdmin = useAdminGuard();
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>("tawazon_last_reset", "");
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>("tawazon_notifications_enabled", false);
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("tawazon_theme", "light");
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>("tawazon_logged_in", false);
  const [userName, setUserName] = useLocalStorage<string>("tawazon_user_name", "");
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog[]>("tawazon_daily_logs", MOCK_DAILY_LOGS);
  const [notifiedCompletionToday, setNotifiedCompletionToday] = useLocalStorage<string>("tawazon_last_notified_date", "");

  // Send desktop notification when all habits are completed
  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

  // 30 Days Habit tracker calendar grid state (1-indexed for date mapping, 30 days)
  const [daysCompleted, setDaysCompleted] = useLocalStorage<boolean[]>("tawazon_30day_completion", Array(30).fill(false));
  const currentDayIndex = new Date().getDate() - 1;

  // Auto-complete day in grid if all daily habits are checked off
  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      setDaysCompleted((prev) => {
        const next = [...prev];
        next[currentDayIndex] = true;
        return next;
      });
    }
  }, [completedCount, totalCount, currentDayIndex]);

  // Helper to show native Web Notification
  const showLocalNotification = (title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>"
      });
    }
  };

  // Toggle notifications and request permissions
  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("متصفحك لا يدعم نظام التنبيهات.");
      return;
    }
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      showLocalNotification("🔔 تم تفعيل التنبيهات بنجاح", "سنقوم بتنبيهك بمواقيت الصلاة والأوراد اليومية.");
    } else {
      alert("يرجى إعطاء صلاحية التنبيهات من إعدادات المتصفح لتفعيل هذه الميزة.");
    }
  };

  // Check and trigger notifications periodically
  useEffect(() => {
    if (!notificationsEnabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const todayDateString = now.toDateString();

      // Check Morning Athkar (5:30 AM)
      if (currentHours === 5 && currentMins === 30) {
        const key = `notified_athkar_morning_${todayDateString}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          showLocalNotification("🌅 موعد أذكار الصباح", "ابدأ يومك بنور الذكر والطمأنينة وحصن نفسك.");
        }
      }

      // Check Evening Athkar (5:00 PM)
      if (currentHours === 17 && currentMins === 0) {
        const key = `notified_athkar_evening_${todayDateString}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          showLocalNotification("🌙 موعد أذكار المساء", "حصّن نفسك واملأ قلبك بالسكينة والسلام قبل مغيب الشمس.");
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // Apply CSS theme variables
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  // Real-time Firebase Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "مستخدم توازن";
        setUserName(name);
        setIsLoggedIn(true);
      }
    });
    return () => unsubscribe();
  }, [setIsLoggedIn, setUserName]);

  // Log user activity to Firestore
  const logUserActivity = async (name: string, method: string) => {
    try {
      let ip = "unknown";
      let city = "";
      let country = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip;
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();
        city = geoData.city || "";
        country = geoData.country_name || "";
      } catch { /* silent — geo is best-effort */ }

      const user = auth.currentUser;
      await addDoc(collection(db, "user_activity"), {
        uid: user?.uid || "guest",
        name,
        email: user?.email || "",
        phone: user?.phoneNumber || "",
        method,
        ip,
        city,
        country,
        timestamp: Date.now(),
        loginCount: 1,
        serverTime: serverTimestamp(),
      });
    } catch { /* silent */ }
  };

  // Login handler
  const handleLoginSuccess = (name: string, method: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    logUserActivity(name, method);
  };

  // Logout handler
  const handleLogout = async () => {
    if (window.confirm("هل ترغب في تسجيل الخروج من تطبيق توازن؟")) {
      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch { /* silent */ }
      setIsLoggedIn(false);
      setUserName("");
      if (activeTab === "admin") setActiveTab("home");
    }
  };

  // Theme toggle helper
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleToggleHabit = (id: string) => {
    const updated = habits.map((h) => 
      h.id === id ? { ...h, completed: !h.completed } : h
    );
    setHabits(updated);
  };

  // Sync completion logs to daily logs
  useEffect(() => {
    if (!isLoggedIn) return;
    const todayRaw = new Date().toDateString();
    const todayEG = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const completedList = habits.filter((h) => h.completed).map((h) => h.name);

    setDailyLogs((prevLogs) => {
      const existingIdx = prevLogs.findIndex((log) => log.rawDate === todayRaw);
      const newLog: DailyLog = {
        id: existingIdx >= 0 ? prevLogs[existingIdx].id : Date.now().toString(),
        dateString: todayEG,
        rawDate: todayRaw,
        mood: existingIdx >= 0 ? prevLogs[existingIdx].mood : "calm",
        note: existingIdx >= 0 ? prevLogs[existingIdx].note : "",
        completedHabits: completedList,
        totalHabits: totalCount,
      };

      const updated = [...prevLogs];
      if (existingIdx >= 0) {
        updated[existingIdx] = newLog;
      } else {
        updated.push(newLog);
      }
      return updated;
    });
  }, [habits, isLoggedIn, totalCount, setDailyLogs]);

  useEffect(() => {
    if (!isLoggedIn || totalCount === 0) return;
    const today = new Date().toDateString();
    if (completedCount === totalCount && notifiedCompletionToday !== today) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🌿 حديقتك في توازن تزدهر!", {
          body: "أحسنت صنعاً! لقد أتممت جميع عاداتك اليوم وتفتحت زهور حديقتك بالكامل. حافظ على هذا التوازن الجميل! ✨",
          tag: "tawazon-complete"
        });
        setNotifiedCompletionToday(today);
      }
    }
  }, [completedCount, totalCount, isLoggedIn, notifiedCompletionToday, setNotifiedCompletionToday]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      const resetHabits = habits.map((h) => ({ ...h, completed: false }));
      setHabits(resetHabits);
      setLastResetDate(today);
    }
  }, [lastResetDate, habits, setHabits, setLastResetDate]);

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      {/* Centered Brand Title */}
      <div style={{ textAlign: "center", marginTop: "36px", marginBottom: "8px" }}>
        <h1 className="logo-text" style={{ fontSize: "38px", color: "var(--brand)", fontFamily: "Thmanyah Serif Display, serif", fontWeight: "bold", letterSpacing: "-0.5px" }}>
          توازن
        </h1>
      </div>

      {/* Centered Navigation Capsule */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
        <nav className="nav-links">
          <button 
            className={`nav-button ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>الرئيسية</span>
          </button>

          <button
            className={`nav-button ${activeTab === "prayer" ? "active" : ""}`}
            onClick={() => setActiveTab("prayer")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C9 5 9 9 9 14h6c0-5 0-9-3-12z" />
              <path d="M6 21h12" />
              <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
            </svg>
            <span>الصلوات</span>
          </button>

          <button
            className={`nav-button ${activeTab === "wird" ? "active" : ""}`}
            onClick={() => setActiveTab("wird")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              <path d="M12 7v14" />
            </svg>
            <span>الورد اليومي</span>
          </button>

          <button
            className={`nav-button ${activeTab === "athkar" ? "active" : ""}`}
            onClick={() => setActiveTab("athkar")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>الأذكار</span>
          </button>

          <button 
            className={`nav-button ${activeTab === "archive" ? "active" : ""}`}
            onClick={() => setActiveTab("archive")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>سجل الأيام</span>
          </button>

          {isAdmin && (
            <button 
              className={`nav-button ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>الإدارة</span>
            </button>
          )}
        </nav>
      </div>

      {/* Main Content layout */}
      <main className="main-content" style={{ padding: "0 24px 48px" }}>
        
        {/* Tab Switcher rendering */}
        {activeTab === "home" && (
          <div className="card" style={mainDashboardCardStyle}>
            {/* Dashboard Header Bar */}
            <div style={cardHeaderBarStyle}>
              <h2 style={{ fontFamily: "Thmanyah Serif Display, serif", color: "var(--brand)", fontSize: "22px", fontWeight: "bold", margin: 0 }}>
                توازن
              </h2>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* User Avatar Circle */}
                <div style={userAvatarCircleMini} onClick={handleLogout} title="تسجيل الخروج">
                  {userName?.charAt(0) || "ب"}
                </div>
                
                {/* Notifications Bell */}
                <button onClick={toggleNotifications} style={cardHeaderIconBtnStyle}>
                  {notificationsEnabled ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--brand)" stroke="var(--brand)" strokeWidth="2">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  )}
                </button>

                {/* Theme Toggle */}
                <button onClick={toggleTheme} style={cardHeaderIconBtnStyle}>
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
              </div>
            </div>

            {/* Dashboard Inner Grid */}
            <div style={dashboardGridInnerStyle}>
              {/* Left Column: Prayer Times Widget & Habit Checklist */}
              <div style={dashboardColumnStyle}>
                {/* Prayer Times Banner */}
                <div style={prayerTimesBannerStyle}>
                  <h4 style={prayerBannerTitleStyle}>مواقيت الصلاة</h4>
                  <div style={prayerBannerTimesGridStyle}>
                    <div style={prayerBannerColStyle}>
                      <span style={prayerValueStyle}>0:10</span>
                      <span style={prayerLabelStyle}>الفجر</span>
                    </div>
                    <div style={prayerBannerColStyle}>
                      <span style={prayerValueStyle}>0:15</span>
                      <span style={prayerLabelStyle}>الظهر</span>
                    </div>
                    <div style={prayerBannerColStyle}>
                      <span style={prayerValueStyle}>0:33</span>
                      <span style={prayerLabelStyle}>العصر</span>
                    </div>
                    <div style={prayerBannerColStyle}>
                      <span style={prayerValueStyle}>0:27</span>
                      <span style={prayerLabelStyle}>المغرب</span>
                    </div>
                    <div style={prayerBannerColStyle}>
                      <span style={prayerValueStyle}>:05</span>
                      <span style={prayerLabelStyle}>العشاء</span>
                    </div>
                  </div>
                </div>

                {/* Habit Checklist (مفردات العادية) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  <h4 style={checklistTitleStyle}>مفردات العادية</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        onClick={() => handleToggleHabit(habit.id)}
                        style={{
                          ...checklistRowStyle,
                          backgroundColor: habit.completed ? "var(--brand-light)" : "transparent",
                          borderColor: habit.completed ? "rgba(17,91,61,0.15)" : "var(--bg-accent)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={checklistIconStyle}>🌿</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                            {habit.name}
                          </span>
                        </div>
                        
                        <div style={{
                          ...checklistCheckboxStyle,
                          backgroundColor: habit.completed ? "var(--brand)" : "transparent",
                          borderColor: habit.completed ? "var(--brand)" : "var(--text-muted)",
                        }}>
                          {habit.completed && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 4 7 9 1" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Habit Tracker Calendar Grid */}
              <div style={dashboardColumnStyle}>
                <div style={habitTrackerHeaderStyle}>
                  <h3 style={columnTitleStyle}>متابع العادات</h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button style={monthArrowBtnStyle}>{"<"}</button>
                    <span style={monthTitleStyle}>يونيو</span>
                    <button style={monthArrowBtnStyle}>{">"}</button>
                  </div>
                </div>

                {/* 30 Days Grid */}
                <div style={calendar30GridStyle}>
                  {daysCompleted.map((isDone, idx) => {
                    const dayNum = idx + 1;
                    const isToday = idx === currentDayIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setDaysCompleted(prev => {
                            const next = [...prev];
                            next[idx] = !next[idx];
                            return next;
                          });
                        }}
                        style={{
                          ...calendarDayCircleStyle,
                          backgroundColor: isDone ? "var(--brand)" : "transparent",
                          borderColor: isDone ? "var(--brand)" : isToday ? "var(--gold)" : "var(--bg-accent)",
                          color: isDone ? "white" : "var(--text-muted)",
                          fontWeight: isToday ? "bold" : "normal",
                          boxShadow: isToday ? "0 0 10px rgba(194, 144, 40, 0.25)" : "none",
                        }}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                  <button style={cardFooterBtnStyle}>المعدل</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "archive" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل سجل الأيام...</div></div>}>
            <div style={focusedContainerStyle}>
              <HistoryArchive logs={dailyLogs} />
            </div>
          </Suspense>
        )}

        {activeTab === "prayer" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل مواقيت الصلاة...</div></div>}>
            <div style={focusedContainerStyle}>
              <PrayerTimes />
            </div>
          </Suspense>
        )}

        {activeTab === "athkar" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل الأذكار...</div></div>}>
            <div style={focusedContainerStyle}>
              <Athkar />
            </div>
          </Suspense>
        )}

        {activeTab === "wird" && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل الورد اليومي...</div></div>}>
            <div style={focusedContainerStyle}>
              <DailyWird />
            </div>
          </Suspense>
        )}

        {activeTab === "admin" && isAdmin && (
          <Suspense fallback={<div style={focusedContainerStyle}><div className="card">جاري تحميل لوحة الإدارة...</div></div>}>
            <div style={focusedContainerStyle}>
              <AdminPanel />
            </div>
          </Suspense>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer style={footerStyle}>
        <div style={footerContactRow}>
          <h4 style={footerBrandName}>منصة توازن</h4>
        </div>
        <p style={footerCredit}>🌿 جميع الحقوق محفوظة لـ توازن © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

// Inline Styles for Redesigned Dashboard
const mainDashboardCardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  borderRadius: "28px",
  padding: "32px",
  border: "1px solid var(--bg-accent)",
  boxShadow: "var(--shadow-md)",
  width: "100%",
  maxWidth: "1000px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const cardHeaderBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid var(--bg-accent)",
  paddingBottom: "16px",
};

const userAvatarCircleMini: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  backgroundColor: "var(--brand)",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(17,91,61,0.15)",
};

const cardHeaderIconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--bg-accent)",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--text-muted)",
  transition: "all 0.2s ease",
  outline: "none",
};

const dashboardGridInnerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "32px",
};

const dashboardColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const habitTrackerHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const columnTitleStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: "900",
  color: "var(--text-main)",
  margin: 0,
};

const monthArrowBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "14px",
  color: "var(--text-muted)",
  cursor: "pointer",
};

const monthTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "800",
  color: "var(--text-main)",
};

const calendar30GridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "12px",
  margin: "12px 0",
};

const calendarDayCircleStyle: React.CSSProperties = {
  aspectRatio: "1/1",
  borderRadius: "50%",
  border: "1.5px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  userSelect: "none",
};

const cardFooterBtnStyle: React.CSSProperties = {
  background: "var(--brand-light)",
  border: "1px solid rgba(17,91,61,0.1)",
  color: "var(--brand)",
  fontSize: "11px",
  fontWeight: "800",
  padding: "6px 16px",
  borderRadius: "30px",
  cursor: "pointer",
};

const prayerTimesBannerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, var(--brand-mid), var(--brand))",
  borderRadius: "20px",
  padding: "20px",
  color: "white",
  boxShadow: "0 8px 24px rgba(17,91,61,0.18)",
};

const prayerBannerTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  margin: "0 0 16px 0",
  textAlign: "right",
};

const prayerBannerTimesGridStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const prayerBannerColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  flex: 1,
};

const prayerValueStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "900",
  color: "white",
};

const prayerLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "rgba(255, 255, 255, 0.75)",
  fontWeight: "700",
};

const checklistTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "800",
  color: "var(--text-main)",
  margin: 0,
};

const checklistRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1.5px solid",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const checklistIconStyle: React.CSSProperties = {
  fontSize: "16px",
};

const checklistCheckboxStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "6px",
  border: "2px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease",
};

const focusedContainerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1000px",
  margin: "0 auto",
};

// ─── Footer Styles (minimal & clean) ────────────────────────────────────────
const footerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(28,108,77,0.08)",
  padding: "24px 24px 22px",
  marginTop: "32px",
  textAlign: "center",
};

const footerBrandName: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "15px",
  fontWeight: "800",
  color: "var(--text-main)",
};

const footerContactRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "12px",
};

const footerCredit: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "var(--text-muted)",
  opacity: 0.7,
};
