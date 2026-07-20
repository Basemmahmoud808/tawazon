import React, { lazy, Suspense, useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAdminGuard } from "./hooks/useAdminGuard";
import { Dashboard } from "./components/Dashboard";
import { HabitTracker } from "./components/HabitTracker";
import type { Habit } from "./components/HabitTracker";
import { GardenView } from "./components/GardenView";
import { MoodJournal } from "./components/MoodJournal";
import type { JournalEntry } from "./components/MoodJournal";
import { Login } from "./components/Login";
import { Challenge90Days } from "./components/Challenge90Days";

// Archive imports
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
  { id: "4", name: "قراءة أذكار الصباح", completed: false, category: "spiritual" },
  { id: "5", name: "قراءة ورد يومي من القرآن الكريم", completed: false, category: "spiritual" },
];

// Pre-populated mock past logs to showcase the archive history immediately
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
  const [journalEntries, setJournalEntries] = useLocalStorage<JournalEntry[]>("tawazon_journal", []);
  const [activeTab, setActiveTab] = useState<"home" | "archive" | "prayer" | "athkar" | "wird" | "admin">("home");
  const isAdmin = useAdminGuard();
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>("tawazon_last_reset", "");
  const [scrolled, setScrolled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>("tawazon_notifications_enabled", false);

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
      const currentMinsTotal = currentHours * 60 + currentMins;
      const todayDateString = now.toDateString();

      // 1. Check Prayer Times
      try {
        const storedPrayers = localStorage.getItem("tawazon_prayers");
        if (storedPrayers) {
          const parsed = JSON.parse(storedPrayers);
          if (parsed.date === todayDateString) {
            const obligatory = parsed.prayers.filter((p: any) => p.name !== "Sunrise");
            obligatory.forEach((prayer: any) => {
              const [h, m] = prayer.time.split(":").map(Number);
              const prayerMinsTotal = h * 60 + m;

              if (currentMinsTotal === prayerMinsTotal) {
                const key = `notified_prayer_${prayer.name}_${todayDateString}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, "true");
                  showLocalNotification(
                    `حان الآن موعد صلاة ${prayer.arabicName} 🕌`,
                    `أقم صلاتك لوقتها، بارك الله فيك ونفع بك.`
                  );

                  // Try playing adhan audio
                  try {
                    const soundEnabled = localStorage.getItem("tawazon_adhan_enabled") === "true";
                    if (soundEnabled) {
                      const soundType = localStorage.getItem("tawazon_adhan_sound") || "takbeer";
                      const url = soundType === "chime"
                        ? "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav"
                        : "https://raw.githubusercontent.com/ahmed-hussein/adhan-mp3/main/takbeer.mp3";
                      const audio = new Audio(url);
                      audio.volume = 0.8;
                      audio.play().catch(() => { /* autoplay policy blocker silent */ });
                    }
                  } catch (err) { /* silent fallback */ }
                }
              }
            });
          }
        }
      } catch (e) { /* ignore errors */ }

      // 2. Check Morning Athkar (8:00 AM)
      if (currentHours === 8 && currentMins === 0) {
        const key = `notified_athkar_morning_${todayDateString}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          showLocalNotification(
            "🌅 موعد أذكار الصباح",
            "ابدأ يومك بنور الذكر والطمأنينة وحصن نفسك."
          );
        }
      }

      // 3. Check Evening Athkar (5:00 PM)
      if (currentHours === 17 && currentMins === 0) {
        const key = `notified_athkar_evening_${todayDateString}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          showLocalNotification(
            "🌙 موعد أذكار المساء",
            "حصّن نفسك واملأ قلبك بالسكينة والسلام قبل مغيب الشمس."
          );
        }
      }

      // 4. Check Daily Wird (8:30 PM)
      if (currentHours === 20 && currentMins === 30) {
        const key = `notified_quran_wird_${todayDateString}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          let quranDone = false;
          try {
            const storedQuran = localStorage.getItem("tawazon_quran_wird");
            if (storedQuran) {
              const p = JSON.parse(storedQuran);
              if (p.date === todayDateString && p.done >= p.goal) {
                quranDone = true;
              }
            }
          } catch {}
          if (!quranDone) {
            showLocalNotification(
              "📖 الورد اليومي للقرآن",
              "لا تهجر مصحفك اليوم، رطب قلبك بوردك اليومي من كتاب الله."
            );
          }
        }
      }

    }, 60000); // check every 60 seconds

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // Monitor scroll to shrink header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Theme State
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("tawazon_theme", "light");

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>("tawazon_logged_in", false);
  const [userName, setUserName] = useLocalStorage<string>("tawazon_user_name", "");

  // History logs state
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog[]>("tawazon_daily_logs", MOCK_DAILY_LOGS);

  // Notification state to avoid duplicate triggers
  const [notifiedCompletionToday, setNotifiedCompletionToday] = useLocalStorage<string>("tawazon_last_notified_date", "");

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
        // Firebase user authenticated
        const name = firebaseUser.displayName || 
                     firebaseUser.email?.split("@")[0] || 
                     (firebaseUser.phoneNumber ? `هاتف ${firebaseUser.phoneNumber.slice(-4)}` : "مستخدم توازن");
        setUserName(name);
        setIsLoggedIn(true);
      } else {
        // Firebase session is null. 
        if (isLoggedIn && userName !== "ضيف توازن") {
          setIsLoggedIn(false);
          setUserName("");
        }
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn, userName, setIsLoggedIn, setUserName]);

  // Browser Desktop Notifications Request
  useEffect(() => {
    if (isLoggedIn && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isLoggedIn]);

  // Welcome Reminder Notification (Fires 10 seconds after user enters the dashboard)
  useEffect(() => {
    if (isLoggedIn && "Notification" in window && Notification.permission === "granted") {
      const timer = setTimeout(() => {
        new Notification("مرحباً بك في توازن 🌿", {
          body: "تذكير: خذ دقيقة من يومك الآن لممارسة تنفس الاسترخاء والاطمئنان على عاداتك.",
          tag: "tawazon-welcome"
        });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // Sync today's activity (habits & mood notes) to the dailyLogs history reactively
  useEffect(() => {
    if (!isLoggedIn) return;

    const todayRaw = new Date().toDateString();
    const todayDateStr = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    
    // Grab the latest logged mood & note written today
    const todayEntries = journalEntries.filter((entry) => entry.rawDate === todayRaw);
    const latestEntry = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
    
    const completedHabitNames = habits.filter((h) => h.completed).map((h) => h.name);
    
    setDailyLogs((prevLogs) => {
      const existingIdx = prevLogs.findIndex((log) => log.rawDate === todayRaw);
      
      const newLog: DailyLog = {
        id: existingIdx >= 0 ? prevLogs[existingIdx].id : Date.now().toString(),
        dateString: todayDateStr,
        rawDate: todayRaw,
        mood: latestEntry ? latestEntry.mood : (existingIdx >= 0 ? prevLogs[existingIdx].mood : undefined),
        note: latestEntry ? latestEntry.note : (existingIdx >= 0 ? prevLogs[existingIdx].note : undefined),
        completedHabits: completedHabitNames,
        totalHabits: habits.length,
      };

      const updated = [...prevLogs];
      if (existingIdx >= 0) {
        updated[existingIdx] = newLog;
      } else {
        updated.push(newLog);
      }
      return updated;
    });
  }, [habits, journalEntries, isLoggedIn, setDailyLogs]);

  // Send desktop notification when all habits are completed
  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

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

  // Automatic daily habits reset
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      // It's a new day! Reset habit checkmarks
      const resetHabits = habits.map((h) => ({ ...h, completed: false }));
      setHabits(resetHabits);
      setLastResetDate(today);
    }
  }, [lastResetDate, habits, setHabits, setLastResetDate]);

  // Formatter for current Arabic Date
  const getArabicDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    return new Date().toLocaleDateString("ar-EG", options);
  };

  // Log user activity to Firestore
  const logUserActivity = async (name: string, method: string) => {
    try {
      // Get IP + location
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
    } catch { /* silent — don't block login on Firestore errors */ }
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

  // Habits handlers
  const handleAddHabit = (name: string, category: Habit["category"]) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completed: false,
      category,
    };
    setHabits([...habits, newHabit]);
  };

  const handleToggleHabit = (id: string) => {
    const updated = habits.map((h) => 
      h.id === id ? { ...h, completed: !h.completed } : h
    );
    setHabits(updated);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  // Journal handlers (now supports image)
  const handleAddJournalEntry = (mood: JournalEntry["mood"], note: string, imageUrl?: string, rawDate?: string) => {
    const entryDate = rawDate ?? new Date().toDateString();
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      rawDate: entryDate,
      mood,
      note,
      imageUrl,
    };
    setJournalEntries([...journalEntries, newEntry]);
  };

  const handleManualReset = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين عادات اليوم؟")) {
      setHabits(habits.map((h) => ({ ...h, completed: false })));
    }
  };

  // Extract today's logged mood to pass to Dashboard for targeted comforting phrases
  const todayRaw = new Date().toDateString();
  const todayLog = dailyLogs.find((log) => log.rawDate === todayRaw);
  const todayMood = todayLog?.mood;

  // Render Login page first if not authenticated
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      {/* Header section */}
      <header className={scrolled ? "header header-scrolled" : "header"}>
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-section">
              {/* Crescent + Star Logo */}
              <div className="logo-icon" style={{ cursor: "default" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="white" opacity="0.9" />
                  <circle cx="17.5" cy="4.5" r="1.2" fill="white" opacity="0.7" />
                </svg>
              </div>
              <h1 className="logo-text">توازن</h1>
            </div>
          </div>

          <div className="header-center">
            <nav className="nav-links">
              <button 
                className={`nav-button ${activeTab === "home" ? "active" : ""}`}
                onClick={() => setActiveTab("home")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                <span>الرئيسية</span>
              </button>

              {/* Prayer Times tab */}
              <button
                className={`nav-button ${activeTab === "prayer" ? "active" : ""}`}
                onClick={() => setActiveTab("prayer")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C9 5 9 9 9 14h6c0-5 0-9-3-12z" />
                  <path d="M6 21h12" />
                  <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
                  <path d="M8 14v7" />
                  <path d="M16 14v7" />
                  <circle cx="12" cy="2" r="0.8" fill="currentColor" />
                </svg>
                <span>الصلوات</span>
              </button>

              {/* Daily Wird tab */}
              <button
                className={`nav-button ${activeTab === "wird" ? "active" : ""}`}
                onClick={() => setActiveTab("wird")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  <path d="M12 7v14" />
                </svg>
                <span>الورد اليومي</span>
              </button>

              {/* Athkar tab */}
              <button
                className={`nav-button ${activeTab === "athkar" ? "active" : ""}`}
                onClick={() => setActiveTab("athkar")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="1.5" />
                  <circle cx="15.5" cy="8.5" r="1.5" />
                  <circle cx="17.5" cy="12" r="1.5" />
                  <circle cx="15.5" cy="15.5" r="1.5" />
                  <circle cx="12" cy="17" r="1.5" />
                  <circle cx="8.5" cy="15.5" r="1.5" />
                  <circle cx="6.5" cy="12" r="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M12 18.5v3M10.5 21.5h3" />
                </svg>
                <span>الأذكار</span>
              </button>

              <button 
                className={`nav-button ${activeTab === "archive" ? "active" : ""}`}
                onClick={() => setActiveTab("archive")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <circle cx="12" cy="16" r="3" />
                  <polyline points="12 15 12 16 13 17" />
                </svg>
                <span>سجل الأيام</span>
              </button>

              {/* Admin tab — only visible to admin */}
              {isAdmin && (
                <button 
                  className={`nav-button ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => setActiveTab("admin")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  <span>الإدارة</span>
                </button>
              )}
            </nav>
          </div>

          <div className="header-right">
            {/* Notifications Toggle */}
            <button
              onClick={toggleNotifications}
              style={{
                ...themeToggleStyle,
                color: notificationsEnabled ? "var(--brand)" : "var(--text-muted)",
                backgroundColor: notificationsEnabled ? "var(--brand-light)" : "var(--bg-card)",
                borderColor: notificationsEnabled ? "rgba(26,107,74,0.2)" : "var(--bg-accent)"
              }}
              title={notificationsEnabled ? "تعطيل التنبيهات" : "تفعيل التنبيهات"}
            >
              {notificationsEnabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={themeToggleStyle}
              title={theme === "dark" ? "الوضع المضيء" : "الوضع الداكن"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
                </svg>
              )}
            </button>

            {/* User Avatar */}
            <div style={userAvatarRow} className="user-avatar-row">
              <div style={{ ...userAvatarCircle, cursor: "pointer" }} className="user-avatar-circle" onClick={handleLogout} title="تسجيل الخروج">
                {userName?.charAt(0) || "م"}
              </div>
              <div className="user-profile-details" style={{ display: "flex", flexDirection: "column" }}>
                <span style={userNameStyle}>{userName}</span>
                <button onClick={handleLogout} style={logoutBtnStyle}>تسجيل الخروج</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content layout */}
      <main className="main-content">
        {/* Arabic formatted calendar date */}
        <div style={dateBarStyle}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {getArabicDate()}
          </span>
          {activeTab === "home" && totalCount > 0 && (
            <button 
              onClick={handleManualReset}
              style={resetBtnStyle}
              title="إعادة تعيين العادات لتبدأ من جديد اليوم"
            >
              إعادة تعيين اليوم
            </button>
          )}
        </div>

        {/* Tab Switcher rendering */}
        {activeTab === "home" && (
          <div className="dashboard-grid">
            {/* Right Column: Habits & Plant Garden */}
            <div style={columnStyle}>
              <GardenView completedCount={completedCount} totalCount={totalCount} />
              <HabitTracker 
                habits={habits}
                onAddHabit={handleAddHabit}
                onToggleHabit={handleToggleHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            </div>
            {/* Left Column: Greeting & Mood journal */}
            <div style={columnStyle}>
              <Dashboard 
                completedCount={completedCount} 
                totalCount={totalCount}
                moodCount={new Set(journalEntries.map((entry) => entry.rawDate)).size}
                todayMood={todayMood}
              />
              <Challenge90Days />
              <MoodJournal 
                entries={journalEntries}
                onAddEntry={handleAddJournalEntry}
              />
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
          <Suspense fallback={<div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%" }}><div className="card">جاري تحميل لوحة الإدارة...</div></div>}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
              <AdminPanel />
            </div>
          </Suspense>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={footerStyle}>
        <p style={footerBrandName}>توازن</p>

        {/* Contact row */}
        <div style={footerContactRow}>
          <a href="tel:+201092610252" style={footerLink}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.41 2 2 0 0 1 3.55 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            01092610252
          </a>

          <span style={footerSep}>·</span>

          <a href="https://wa.me/201092610252" target="_blank" rel="noopener noreferrer" style={footerLink}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            واتساب
          </a>

          <span style={footerSep}>·</span>

          <a href="mailto:basemmahmoud545@gmail.com" style={footerLink}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            basemmahmoud545@gmail.com
          </a>
        </div>

        <p style={footerCredit}>صمم بواسطة <strong>باسم محمود</strong> · صُنع بـ ❤️</p>
      </footer>
    </div>
  );
}

// ─── Styles (World-Class Design System) ──────────────────────────────────────
const dateBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "11px",
  color: "var(--text-muted)",
  marginBottom: "12px",
  padding: "4px 10px",
  fontWeight: "600",
  background: "linear-gradient(180deg, rgba(231,235,221,0.70), rgba(220,228,206,0.45))",
  border: "1px solid rgba(28,108,77,0.08)",
  borderRadius: "16px",
};

const resetBtnStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(231,235,221,0.95), rgba(220,228,206,0.98))",
  border: "1px solid rgba(28,108,77,0.12)",
  color: "var(--brand)",
  padding: "5px 12px",
  borderRadius: "12px",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "var(--transition)",
  boxShadow: "0 6px 14px rgba(22,38,31,0.05)",
};

const columnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const focusedContainerStyle: React.CSSProperties = {
  maxWidth: "640px",
  margin: "40px auto 0",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};


// User Avatar (new design)
const userAvatarRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "linear-gradient(180deg, rgba(231,235,221,0.90), rgba(220,228,206,0.98))",
  padding: "5px 10px 5px 5px",
  borderRadius: "999px",
  border: "1px solid rgba(28,108,77,0.10)",
  transition: "var(--transition)",
  boxShadow: "0 6px 14px rgba(22,38,31,0.05)",
};

const userAvatarCircle: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "12px",
  flexShrink: 0,
  boxShadow: "0 3px 8px rgba(28,108,77,0.20)",
};

const userNameStyle: React.CSSProperties = {
  color: "var(--text-main)",
  fontSize: "12px",
  fontWeight: "700",
  lineHeight: 1.2,
};

const logoutBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  fontSize: "10px",
  fontFamily: "inherit",
  padding: 0,
  fontWeight: "500",
  transition: "color 0.2s ease",
};

const themeToggleStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(231,235,221,0.96), rgba(220,228,206,0.98))",
  border: "1px solid rgba(28,108,77,0.10)",
  borderRadius: "12px",
  width: "32px",
  height: "32px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 6px 14px rgba(22,38,31,0.05)",
  outline: "none",
  transition: "var(--transition)",
  color: "var(--text-muted)",
  flexShrink: 0,
};

// ─── Footer Styles (minimal & clean) ────────────────────────────────────────
const footerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(28,108,77,0.08)",
  padding: "24px 24px 22px",
  marginTop: "32px",
  textAlign: "center",
  background: "linear-gradient(180deg, rgba(255,255,255,0.40), rgba(255,255,255,0.16))",
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
  marginBottom: "20px",
};

const footerLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  color: "var(--text-muted)",
  textDecoration: "none",
  fontWeight: "500",
  transition: "color 0.2s ease",
};

const footerSep: React.CSSProperties = {
  color: "var(--bg-accent)",
  fontSize: "18px",
  lineHeight: 1,
  userSelect: "none",
};

const footerCredit: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "var(--text-muted)",
  opacity: 0.7,
};
