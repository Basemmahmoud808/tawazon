import React, { lazy, Suspense, useState, useEffect } from "react";
import { useLocalStorage, obfuscate, deobfuscate } from "./hooks/useLocalStorage";
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
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
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
  const [isSummerTime, setIsSummerTime] = useLocalStorage<boolean>("tawazon_use_summer_time", true);
  const [challengeTitle, setChallengeTitle] = useState<string>("التزام بالرياضة والقراءة اليومية");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Shift timing by 1 hour if summer time (DST) is active
  const adjustPrayerTime = (timeStr: string) => {
    if (!isSummerTime || !timeStr || timeStr === "--:--" || timeStr.includes("unknown")) return timeStr;
    const [h, m] = timeStr.split(":").map(Number);
    const adjustedH = (h + 1) % 24;
    return `${adjustedH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const [newHabitName, setNewHabitName] = useState("");
  const [prayers, setPrayers] = useState<{ arabicName: string; time: string }[]>([]);

  // Fetch real prayer times for Cairo/Egypt or fallback
  useEffect(() => {
    const stored = localStorage.getItem("tawazon_prayers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === new Date().toDateString()) {
          setPrayers(parsed.prayers);
          return;
        }
      } catch {}
    }

    fetch("https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5")
      .then(res => res.json())
      .then(json => {
        const timings = json.data.timings;
        const PRAYER_NAMES = [
          { name: "Fajr",   arabicName: "الفجر" },
          { name: "Dhuhr",  arabicName: "الظهر" },
          { name: "Asr",    arabicName: "العصر" },
          { name: "Maghrib",arabicName: "المغرب" },
          { name: "Isha",   arabicName: "العشاء" },
        ];
        const built = PRAYER_NAMES.map(p => ({
          arabicName: p.arabicName,
          time: timings[p.name]?.slice(0, 5) || "--:--",
        }));
        setPrayers(built);
        localStorage.setItem("tawazon_prayers", JSON.stringify({ date: new Date().toDateString(), prayers: built }));
      })
      .catch(() => {
        setPrayers([
          { arabicName: "الفجر", time: "03:32" },
          { arabicName: "الظهر", time: "12:02" },
          { arabicName: "العصر", time: "15:39" },
          { arabicName: "المغرب", time: "19:01" },
          { arabicName: "العشاء", time: "20:31" },
        ]);
      });
  }, []);

  const handleAddCustomHabit = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newHabitName.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      completed: false,
      category: "mindfulness" as const,
    };
    setHabits([...habits, newHabit]);
    setNewHabitName("");
  };

  const [userId, setUserId] = useState<string>(() => {
    return localStorage.getItem("tawazon_current_uid") || "guest";
  });
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [challengeStartDate, setChallengeStartDate] = useState<string>(new Date().toISOString());
  const [daysCompleted, setDaysCompleted] = useState<boolean[]>(Array(90).fill(false));

  const [activeTab, setActiveTab] = useState<"home" | "archive" | "prayer" | "athkar" | "wird" | "admin" >("home");
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

  // Load user data dynamically whenever userId changes
  useEffect(() => {
    if (!userId) return;
    const habitsKey = `tawazon_${userId}_habits`;
    const daysKey = `tawazon_${userId}_90day_completion_v6`;
    const startKey = `tawazon_${userId}_90day_start_date`;
    const titleKey = `tawazon_${userId}_90day_challenge_title`;

    // 1. Load from scoped LocalStorage (offline-first)
    let loadedHabits = DEFAULT_HABITS;
    let loadedDays = Array(90).fill(false);
    let loadedStart = new Date().toISOString();
    let loadedTitle = "التزام بالرياضة والقراءة اليومية";

    try {
      const rawHabits = localStorage.getItem(habitsKey);
      if (rawHabits) loadedHabits = JSON.parse(deobfuscate(rawHabits));
      
      const rawDays = localStorage.getItem(daysKey);
      if (rawDays) loadedDays = JSON.parse(deobfuscate(rawDays));

      const rawStart = localStorage.getItem(startKey);
      if (rawStart) loadedStart = JSON.parse(deobfuscate(rawStart));

      const rawTitle = localStorage.getItem(titleKey);
      if (rawTitle) loadedTitle = JSON.parse(deobfuscate(rawTitle));
    } catch {
      try {
        const rawHabits = localStorage.getItem(habitsKey);
        if (rawHabits) loadedHabits = JSON.parse(rawHabits);
        
        const rawDays = localStorage.getItem(daysKey);
        if (rawDays) loadedDays = JSON.parse(rawDays);
      } catch {}
    }

    setHabits(loadedHabits);
    setDaysCompleted(loadedDays);
    setChallengeStartDate(loadedStart);
    setChallengeTitle(loadedTitle);

    // 2. Fetch from Firestore if logged in and configured (online sync)
    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.habits) setHabits(data.habits);
          if (data.daysCompleted) setDaysCompleted(data.daysCompleted);
          if (data.challengeStartDate) setChallengeStartDate(data.challengeStartDate);
          if (data.challengeTitle) setChallengeTitle(data.challengeTitle);

          // Update local storage so it remains in sync offline
          try {
            if (data.habits) localStorage.setItem(habitsKey, obfuscate(JSON.stringify(data.habits)));
            if (data.daysCompleted) localStorage.setItem(daysKey, obfuscate(JSON.stringify(data.daysCompleted)));
            if (data.challengeStartDate) localStorage.setItem(startKey, obfuscate(JSON.stringify(data.challengeStartDate)));
            if (data.challengeTitle) localStorage.setItem(titleKey, obfuscate(JSON.stringify(data.challengeTitle)));
          } catch {}
        } else {
          // Upload local progress on first registration
          setDoc(docRef, {
            habits: loadedHabits,
            daysCompleted: loadedDays,
            challengeStartDate: loadedStart,
            challengeTitle: loadedTitle,
            updatedAt: Date.now()
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [userId]);

  // Sync state changes to LocalStorage and Firestore
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    // Wait for initial load to finish to avoid overwriting state
    const timer = setTimeout(() => setInitialLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    if (!userId || !initialLoaded) return;
    const habitsKey = `tawazon_${userId}_habits`;
    try {
      localStorage.setItem(habitsKey, obfuscate(JSON.stringify(habits)));
    } catch {}

    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      setDoc(docRef, { habits, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  }, [habits, userId, initialLoaded]);

  useEffect(() => {
    if (!userId || !initialLoaded) return;
    const daysKey = `tawazon_${userId}_90day_completion_v6`;
    try {
      localStorage.setItem(daysKey, obfuscate(JSON.stringify(daysCompleted)));
    } catch {}

    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      setDoc(docRef, { daysCompleted, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  }, [daysCompleted, userId, initialLoaded]);

  useEffect(() => {
    if (!userId || !initialLoaded) return;
    const startKey = `tawazon_${userId}_90day_start_date`;
    try {
      localStorage.setItem(startKey, obfuscate(JSON.stringify(challengeStartDate)));
    } catch {}

    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      setDoc(docRef, { challengeStartDate, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  }, [challengeStartDate, userId, initialLoaded]);

  useEffect(() => {
    if (!userId || !initialLoaded) return;
    const titleKey = `tawazon_${userId}_90day_challenge_title`;
    try {
      localStorage.setItem(titleKey, obfuscate(JSON.stringify(challengeTitle)));
    } catch {}

    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      setDoc(docRef, { challengeTitle, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  }, [challengeTitle, userId, initialLoaded]);

  /* const getInitialPhase = (dayIdx: number) => {
    if (dayIdx < 30) return 1;
    if (dayIdx < 60) return 2;
    return 3;
  };

  const initialDayIndex = (() => {
    const start = new Date(challengeStartDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  })(); */

  const [activePhase, setActivePhase] = useState<number>(() => {
    const start = new Date(challengeStartDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const phase = Math.floor(elapsedDays / 30) + 1;
    return Math.max(1, Math.min(3, phase));
  });


  const getChallengeDayIndex = () => {
    const start = new Date(challengeStartDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const currentDayIndex = getChallengeDayIndex();

  const [showDuaModal, setShowDuaModal] = useState<boolean>(() => {
    try {
      const shown = localStorage.getItem("tawazon_welcome_dua_v2");
      return !shown;
    } catch {
      return true;
    }
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  const handleDismissDua = () => {
    setShowDuaModal(false);
    try {
      localStorage.setItem("tawazon_welcome_dua_v2", "true");
    } catch { /* ignore */ }
  };

  // Strict Real-Time Day Index calculations
  const todayPhase = Math.floor(currentDayIndex / 30) + 1;
  const todayLocalIdx = currentDayIndex % 30;

  const handleResetChallenge = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة بدء التحدي من اليوم وتصفير التقدم؟")) {
      setChallengeStartDate(new Date().toISOString());
      setDaysCompleted(Array(90).fill(false));
    }
  };

  // Auto-complete day in grid if all daily habits are checked off
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
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "مستخدم توازن";
        setUserName(name);
        setIsLoggedIn(true);
        setUserId(firebaseUser.uid);
        localStorage.setItem("tawazon_current_uid", firebaseUser.uid);
      } else {
        setUserId("guest");
        localStorage.setItem("tawazon_current_uid", "guest");
      }
    });
    return () => unsubscribe();
  }, [setIsLoggedIn, setUserName]);

  // Log user activity to Firestore
  const logUserActivity = async (name: string, method: string) => {
    if (!auth || !db) {
      return;
    }
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
    if (auth?.currentUser) {
      setUserId(auth.currentUser.uid);
      localStorage.setItem("tawazon_current_uid", auth.currentUser.uid);
    }
    logUserActivity(name, method);
  };

  // Logout handler
  const handleLogout = async () => {
    if (window.confirm("هل ترغب في تسجيل الخروج من تطبيق توازن؟")) {
      try {
        if (auth?.currentUser) {
          await signOut(auth);
        }
      } catch { /* silent */ }
      setIsLoggedIn(false);
      setUserName("");
      setUserId("guest");
      localStorage.setItem("tawazon_current_uid", "guest");
      if (activeTab === "admin") setActiveTab("home");
    }
  };

  // Theme toggle helper
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Developer Modal states & handlers
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [developerMsgType, setDeveloperMsgType] = useState<"color_theme" | "add_feature" | "report_bug" | "other">("color_theme");
  const [developerMsgText, setDeveloperMsgText] = useState("");
  const [developerContact, setDeveloperContact] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  const handleSubmitDeveloperMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerMsgText.trim()) return;
    setIsSendingMsg(true);
    try {
      if (db) {
        await addDoc(collection(db, "developer_messages"), {
          uid: userId,
          name: userName || "ضيف",
          email: auth?.currentUser?.email || "",
          phone: auth?.currentUser?.phoneNumber || "",
          customContact: developerContact.trim(),
          category: developerMsgType,
          message: developerMsgText.trim(),
          timestamp: Date.now(),
          status: "pending",
        });
      } else {
        const existing = JSON.parse(localStorage.getItem("tawazon_offline_feedback") || "[]");
        existing.push({
          uid: userId,
          name: userName || "ضيف",
          customContact: developerContact.trim(),
          category: developerMsgType,
          message: developerMsgText.trim(),
          timestamp: Date.now(),
        });
        localStorage.setItem("tawazon_offline_feedback", JSON.stringify(existing));
      }
      setMsgSentSuccess(true);
      setDeveloperMsgText("");
      setDeveloperContact("");
      setTimeout(() => {
        setMsgSentSuccess(false);
        setShowDeveloperModal(false);
      }, 2500);
    } catch (error) {
      alert("حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSendingMsg(false);
    }
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
      {/* Welcome & Onboarding Modal */}
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
                <button 
                  onClick={() => setOnboardingStep(2)} 
                  style={duaModalBtnStyle}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} 
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  تعرّف على الميزات ➔
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", textAlign: "right" }}>
                <span style={{ fontSize: "40px", marginBottom: "12px" }}>✨</span>
                <h3 style={{ margin: "0 auto 12px", color: "var(--brand)", fontSize: "19px", fontWeight: "900", fontFamily: "Thmanyah Serif Display, serif", textAlign: "center" }}>
                  ميزات المنصة الذكية
                </h3>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px", margin: "0 0 20px 0", fontSize: "12.5px", color: "var(--text-main)", lineHeight: "1.6" }}>
                  <p>🕌 <strong>مواقيت الصلاة:</strong> تتبع الفروض بدقة مع دعم كامل لخيارات التوقيت الصيفي.</p>
                  <p>📖 <strong>الورد القرآني:</strong> تصفح وقراءة مصحف مجمع الملك فهد بالصفحات الحقيقية للمتابعة اليومية.</p>
                  <p>📿 <strong>الأذكار والعدادات:</strong> قراءة أذكار الصباح والمساء واليوم الليلة مع عداد ذكي تفاعلي.</p>
                  <p>📅 <strong>تحدي الـ 90 يوماً:</strong> تقويم متكامل لبناء العادات ومتابعة التزامك اليومي بمرونة بالغة.</p>
                </div>
                <button 
                  onClick={() => setOnboardingStep(3)} 
                  style={duaModalBtnStyle}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} 
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  الخطوة التالية ➔
                </button>
              </div>
            )}

            {onboardingStep === 3 && (
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
                <button 
                  onClick={handleDismissDua} 
                  style={duaModalBtnStyle}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} 
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  اللهم آمين، دعنا نبدأ! ✨
                </button>
              </div>
            )}

            {/* Step Indicators */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: onboardingStep === 1 ? "var(--brand)" : "var(--bg-accent)", transition: "all 0.2s" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: onboardingStep === 2 ? "var(--brand)" : "var(--bg-accent)", transition: "all 0.2s" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: onboardingStep === 3 ? "var(--brand)" : "var(--bg-accent)", transition: "all 0.2s" }} />
            </div>

          </div>
        </div>
      )}
      {/* Centered Brand Title */}
      <div style={{ textAlign: "center", marginTop: "36px", marginBottom: "8px" }}>
        <h1 className="logo-text" style={{ fontSize: "38px", color: "var(--brand)", fontFamily: "Thmanyah Serif Display, serif", fontWeight: "bold", letterSpacing: "-0.5px" }}>
          توازن
        </h1>
      </div>

      {/* Centered Navigation Capsule */}
      <nav className="nav-links">
        <button 
          className={`nav-button ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" fill={activeTab === "home" ? "currentColor" : "none"} fillOpacity="0.2" />
            <rect x="14" y="3" width="7" height="5" rx="1" fill={activeTab === "home" ? "currentColor" : "none"} fillOpacity="0.2" />
            <rect x="14" y="12" width="7" height="9" rx="1" fill={activeTab === "home" ? "currentColor" : "none"} fillOpacity="0.2" />
            <rect x="3" y="16" width="7" height="5" rx="1" fill={activeTab === "home" ? "currentColor" : "none"} fillOpacity="0.2" />
          </svg>
          <span>الرئيسية</span>
        </button>

        <button
          className={`nav-button ${activeTab === "prayer" ? "active" : ""}`}
          onClick={() => setActiveTab("prayer")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C9 5 9 9 9 14h6c0-5 0-9-3-12z" fill={activeTab === "prayer" ? "currentColor" : "none"} fillOpacity="0.2" />
            <path d="M6 21h12" />
            <path d="M10 21v-4a2 2 0 0 1 4 0v4" fill={activeTab === "prayer" ? "currentColor" : "none"} fillOpacity="0.2" />
          </svg>
          <span>الصلوات</span>
        </button>

        <button
          className={`nav-button ${activeTab === "wird" ? "active" : ""}`}
          onClick={() => setActiveTab("wird")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill={activeTab === "wird" ? "currentColor" : "none"} fillOpacity="0.2" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill={activeTab === "wird" ? "currentColor" : "none"} fillOpacity="0.2" />
            <path d="M12 7v14" />
          </svg>
          <span>الورد <span className="mobile-hide">اليومي</span></span>
        </button>

        <button
          className={`nav-button ${activeTab === "athkar" ? "active" : ""}`}
          onClick={() => setActiveTab("athkar")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" fill={activeTab === "athkar" ? "currentColor" : "none"} fillOpacity="0.1" />
            <circle cx="12" cy="12" r="3" fill={activeTab === "athkar" ? "currentColor" : "none"} fillOpacity="0.3" />
          </svg>
          <span>الأذكار</span>
        </button>

        <button 
          className={`nav-button ${activeTab === "archive" ? "active" : ""}`}
          onClick={() => setActiveTab("archive")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={activeTab === "archive" ? "currentColor" : "none"} fillOpacity="0.2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>سجل <span className="mobile-hide">الأيام</span></span>
        </button>

        {isAdmin && (
          <button 
            className={`nav-button ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={activeTab === "admin" ? "currentColor" : "none"} fillOpacity="0.2" />
            </svg>
            <span>الإدارة</span>
          </button>
        )}
      </nav>

      {/* Main Content layout */}
      <main className="main-content">
        
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

                {/* Contact Developer Button */}
                <button onClick={() => setShowDeveloperModal(true)} style={cardHeaderIconBtnStyle} title="أرسل رسالة أو اقتراحاً للمطور">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dashboard Inner Grid */}
            <div className="dashboard-grid-inner">
              {/* Left Column: Prayer Times Widget & Habit Checklist */}
              <div style={dashboardColumnStyle}>
                {/* Prayer Times Banner */}
                <div className="prayer-times-banner">
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h4 style={{ ...prayerBannerTitleStyle, margin: 0, color: "white" }}>مواقيت الصلاة</h4>
                    <button
                      onClick={() => setIsSummerTime(!isSummerTime)}
                      style={{
                        background: "rgba(255, 255, 255, 0.18)",
                        border: "none",
                        borderRadius: "12px",
                        padding: "4px 10px",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "800",
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.2s ease"
                      }}
                      title="اضغط للتحويل بين التوقيت الصيفي والشتوي"
                    >
                      {isSummerTime ? "☀️ التوقيت الصيفي" : "❄️ التوقيت الشتوي"}
                    </button>
                  </div>

                  <div className="prayer-banner-grid">
                    {prayers.length > 0 ? (
                      prayers.map((p, idx) => (
                        <div key={idx} className="prayer-banner-col">
                          <span style={prayerValueStyle}>{adjustPrayerTime(p.time)}</span>
                          <span style={prayerLabelStyle}>{p.arabicName}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="prayer-banner-col"><span style={prayerValueStyle}>--:--</span><span style={prayerLabelStyle}>الفجر</span></div>
                        <div className="prayer-banner-col"><span style={prayerValueStyle}>--:--</span><span style={prayerLabelStyle}>الظهر</span></div>
                        <div className="prayer-banner-col"><span style={prayerValueStyle}>--:--</span><span style={prayerLabelStyle}>العصر</span></div>
                        <div className="prayer-banner-col"><span style={prayerValueStyle}>--:--</span><span style={prayerLabelStyle}>المغرب</span></div>
                        <div className="prayer-banner-col"><span style={prayerValueStyle}>--:--</span><span style={prayerLabelStyle}>العشاء</span></div>
                      </>
                    )}
                  </div>
                </div>

                {/* Habit Checklist (مفردات العادية) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  <h4 style={checklistTitleStyle}>المهام اليومية</h4>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                          <span style={checklistIconStyle}>🌿</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", textAlign: "right" }}>
                            {habit.name}
                          </span>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHabits(habits.filter((h) => h.id !== habit.id));
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="حذف العادة"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>

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
                      </div>
                    ))}
                    
                    {/* Add Custom Habit Form */}
                    <form onSubmit={handleAddCustomHabit} className="add-habit-form">
                      <input
                        type="text"
                        placeholder="إضافة مهام اليوم..."
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        className="add-habit-input"
                      />
                      <button type="submit" className="add-habit-btn">
                        إضافة
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Habit Tracker Calendar Grid */}
              <div style={dashboardColumnStyle}>
                <div style={habitTrackerHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={challengeTitle}
                        onChange={(e) => setChallengeTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => { if (e.key === "Enter") setIsEditingTitle(false); }}
                        autoFocus
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          border: "1px solid var(--gold)",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-main)",
                          outline: "none"
                        }}
                      />
                    ) : (
                      <span onClick={() => setIsEditingTitle(true)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }} title="اضغط لتعديل عنوان التحدي">
                        <h3 style={{ ...columnTitleStyle, borderBottom: "1px dashed var(--gold)", paddingBottom: "2px" }}>{challengeTitle}</h3>
                        <span style={{ fontSize: "12px" }}>✏️</span>
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* Phase Navigation arrows */}
                    <button
                      onClick={() => setActivePhase(p => Math.max(1, p - 1))}
                      disabled={activePhase === 1}
                      style={{ background: "none", border: "none", color: activePhase === 1 ? "var(--text-muted)" : "var(--gold)", cursor: activePhase === 1 ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "bold" }}
                      title="المرحلة السابقة"
                    >
                      {"<"}
                    </button>
                    
                    <span style={{ ...monthTitleStyle, color: "var(--gold)" }}>
                      المرحلة {activePhase} (اليوم {currentDayIndex >= 0 && currentDayIndex < 90 ? currentDayIndex + 1 : 90} من 90)
                    </span>

                    <button
                      onClick={() => setActivePhase(p => Math.min(3, p + 1))}
                      disabled={activePhase === 3}
                      style={{ background: "none", border: "none", color: activePhase === 3 ? "var(--text-muted)" : "var(--gold)", cursor: activePhase === 3 ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "bold" }}
                      title="المرحلة التالية"
                    >
                      {">"}
                    </button>

                    <button
                      onClick={handleResetChallenge}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: "2px 4px",
                        color: "var(--text-muted)",
                        transition: "color 0.2s ease"
                      }}
                      title="إعادة بدء التحدي من اليوم"
                    >
                      🔄
                    </button>
                  </div>

                </div>

                {/* 30 Days Grid (6 Columns) mapped to global 90 days Array */}
                <div className="calendar-grid">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const localDayNum = idx + 1;
                    const globalIdx = (activePhase - 1) * 30 + idx;
                    const isDone = daysCompleted[globalIdx];
                    const isToday = activePhase === todayPhase && idx === todayLocalIdx;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setDaysCompleted(prev => {
                            const next = [...prev];
                            next[globalIdx] = !next[globalIdx];
                            return next;
                          });
                        }}
                        style={{
                          ...calendarDayCircleStyle,
                          fontSize: "13px",
                          backgroundColor: isDone ? "var(--brand)" : "transparent",
                          borderColor: isDone ? "var(--brand)" : isToday ? "var(--gold)" : "var(--bg-accent)",
                          color: isDone ? "white" : "var(--text-muted)",
                          fontWeight: isToday ? "bold" : "normal",
                          boxShadow: isToday ? "0 0 10px rgba(194, 144, 40, 0.25)" : "none",
                        }}
                        title={`اليوم ${globalIdx + 1}`}
                      >
                        {localDayNum}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>
                    معدل الإلتزام: {Math.round((daysCompleted.filter(Boolean).length / 90) * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm("هل ترغب في تصفير تقدم التحدي بالكامل؟")) {
                        setDaysCompleted(Array(90).fill(false));
                      }
                    }}
                    style={cardFooterBtnStyle}
                  >
                    إعادة تعيين التقويم 🔄
                  </button>
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
      <footer className="footer">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h4 style={{ ...footerBrandName, margin: 0 }}>منصة توازن</h4>
          
          {/* Centered Professional Contacts without raw labels */}
          <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
            <a
              href="https://wa.me/201092610252"
              target="_blank"
              rel="noopener noreferrer"
              style={footerContactIconStyle}
              title="واتساب"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </a>

            <a
              href="mailto:basemmahmoud545@gmail.com"
              style={footerContactIconStyle}
              title="البريد الإلكتروني"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>

        
        <p style={{ ...footerCredit, marginTop: "8px", fontWeight: "bold", color: "var(--brand)" }}>
          تم التطوير بواسطة باسم محمود 🌿
        </p>
        <p style={footerCredit}>جميع الحقوق محفوظة لـ توازن © {new Date().getFullYear()}</p>

      </footer>

      {/* ─── Contact Developer Modal ─── */}
      {showDeveloperModal && (
        <div style={modalOverlayStyle} onClick={() => setShowDeveloperModal(false)}>
          <div style={{ ...duaModalContentStyle, maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontFamily: "Thmanyah Serif Display, serif", color: "var(--brand)" }}>
                تواصل مع المطور 🌿
              </h3>
              <button 
                onClick={() => setShowDeveloperModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {msgSentSuccess ? (
              <div style={{ padding: "30px 10px", color: "var(--brand)", fontWeight: "bold" }}>
                <p style={{ fontSize: "16px", marginBottom: "8px" }}>تم إرسال اقتراحك بنجاح! 🎉</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>شكراً لك على مساعدتنا في تحسين توازن.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeveloperMsg} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px", textAlign: "right" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>نوع الرسالة</label>
                  <select 
                    value={developerMsgType}
                    onChange={(e: any) => setDeveloperMsgType(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid var(--bg-accent)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-main)",
                      fontFamily: "inherit",
                      outline: "none"
                    }}
                  >
                    <option value="color_theme">تعديل ألوان وتصميم</option>
                    <option value="add_feature">طلب إضافة ميزة</option>
                    <option value="report_bug">الإبلاغ عن مشكلة</option>
                    <option value="other">اقتراح عام / أخرى</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>اقتراحك أو رسالتك</label>
                  <textarea
                    rows={4}
                    value={developerMsgText}
                    onChange={(e) => setDeveloperMsgText(e.target.value)}
                    placeholder="اكتب هنا ما تحتاجه (تعديل ألوان، إضافة ميزات، أي شيء تفكر فيه)..."
                    required
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid var(--bg-accent)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-main)",
                      fontFamily: "inherit",
                      outline: "none",
                      resize: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" }}>طريقة التواصل معك (اختياري)</label>
                  <input
                    type="text"
                    value={developerContact}
                    onChange={(e) => setDeveloperContact(e.target.value)}
                    placeholder="رقم هاتف أو بريد إلكتروني للتواصل"
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid var(--bg-accent)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-main)",
                      fontFamily: "inherit",
                      outline: "none"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingMsg}
                  style={{
                    ...duaModalBtnStyle,
                    marginTop: "10px",
                    opacity: isSendingMsg ? 0.7 : 1,
                    cursor: isSendingMsg ? "not-allowed" : "pointer"
                  }}
                >
                  {isSendingMsg ? "جاري الإرسال..." : "إرسال الرسالة للمطور"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
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

/* const monthArrowBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "14px",
  color: "var(--text-muted)",
  cursor: "pointer",
}; */

const monthTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "800",
  color: "var(--text-main)",
};

/* const calendar30GridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "12px",
  margin: "12px 0",
}; */

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


const prayerBannerTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  margin: "0 0 16px 0",
  textAlign: "right",
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

const footerBrandName: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "15px",
  fontWeight: "800",
  color: "var(--text-main)",
};

/* const footerContactRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "12px",
}; */

const footerContactIconStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "1.5px solid var(--bg-accent)",
  backgroundColor: "var(--bg-card)",
  color: "var(--brand)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  outline: "none",
};

const footerCredit: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "var(--text-muted)",
  opacity: 0.7,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "20px",
};

const duaModalContentStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  borderRadius: "24px",
  padding: "32px 24px",
  maxWidth: "380px",
  width: "100%",
  boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  border: "1.5px solid var(--bg-accent)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const duaModalBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "14px",
  backgroundColor: "var(--brand)",
  color: "white",
  border: "none",
  fontWeight: "900",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(17,91,61,0.2)",
  transition: "all 0.2s ease",
  outline: "none",
};
