/**
 * useAppData — Hook لإدارة بيانات المستخدم في توازن
 *
 * يجمع كل منطق تحميل وحفظ البيانات (عادات، أيام التحدي، السجلات اليومية)
 * من LocalStorage وFirestore في مكان واحد بعيداً عن App.tsx.
 *
 * الأولوية: LocalStorage (offline-first) ← Firestore (online sync)
 */
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { obfuscate, deobfuscate } from "./useLocalStorage";
import type { Habit } from "../components/HabitTracker";
import type { DailyLog } from "../components/HistoryArchive";

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "شرب كوب من الماء عند الاستيقاظ", completed: false, category: "physical" },
  { id: "2", name: "التنفس بعمق لمدة دقيقتين", completed: false, category: "mindfulness" },
  { id: "3", name: "كتابة فكرة امتنان واحدة", completed: false, category: "mental" },
];

// ─── Helpers لقراءة/كتابة localStorage بأمان ─────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(deobfuscate(raw)) as T;
  } catch {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, obfuscate(JSON.stringify(value)));
  } catch {}
}

// ─── Hook رئيسي ──────────────────────────────────────────────────────────────
export function useAppData(userId: string) {
  const [habits, setHabitsRaw] = useState<Habit[]>(DEFAULT_HABITS);
  const [daysCompleted, setDaysCompletedRaw] = useState<boolean[]>(Array(90).fill(false));
  const [challengeStartDate, setChallengeStartDateRaw] = useState<string>(new Date().toISOString());
  const [challengeTitle, setChallengeTitleRaw] = useState<string>("التزام بالرياضة والقراءة اليومية");
  const [dailyLogs, setDailyLogsRaw] = useState<DailyLog[]>([]);

  /**
   * isDataReady: يصبح true فقط بعد اكتمال تحميل البيانات من LocalStorage.
   * يحل محل setTimeout(1200ms) الهشاش — لا نكتب إلى الـ storage قبل التحميل.
   */
  const [isDataReady, setIsDataReady] = useState(false);

  // Keys مبنية على userId لعزل بيانات كل مستخدم
  const keys = {
    habits:    `tawazon_${userId}_habits`,
    days:      `tawazon_${userId}_90day_completion_v6`,
    start:     `tawazon_${userId}_90day_start_date`,
    title:     `tawazon_${userId}_90day_challenge_title`,
    logs:      `tawazon_${userId}_daily_logs`,
  };

  // ─── تحميل عند تغيير المستخدم ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setIsDataReady(false);

    // 1. تحميل من LocalStorage أولاً (فوري)
    const loadedHabits    = lsGet<Habit[]>(keys.habits, DEFAULT_HABITS);
    const loadedDays      = lsGet<boolean[]>(keys.days, Array(90).fill(false));
    const loadedStart     = lsGet<string>(keys.start, new Date().toISOString());
    const loadedTitle     = lsGet<string>(keys.title, "التزام بالرياضة والقراءة اليومية");
    const loadedLogs      = lsGet<DailyLog[]>(keys.logs, []);

    setHabitsRaw(loadedHabits);
    setDaysCompletedRaw(loadedDays);
    setChallengeStartDateRaw(loadedStart);
    setChallengeTitleRaw(loadedTitle);
    setDailyLogsRaw(loadedLogs);

    // البيانات جاهزة — يمكن الكتابة الآن
    setIsDataReady(true);

    // 2. مزامنة من Firestore (خلفية، بدون تجميد UI)
    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      getDoc(docRef).then((snap) => {
        if (!snap.exists()) {
          // مستخدم جديد — نرفع البيانات المحلية
          setDoc(docRef, {
            habits: loadedHabits,
            daysCompleted: loadedDays,
            challengeStartDate: loadedStart,
            challengeTitle: loadedTitle,
            dailyLogs: loadedLogs,
            updatedAt: Date.now(),
          }).catch(() => {});
          return;
        }
        const d = snap.data();
        // نحدّث الـ state إذا وجدنا بيانات جديدة من Firestore
        if (d.habits)            { setHabitsRaw(d.habits); lsSet(keys.habits, d.habits); }
        if (d.daysCompleted)     { setDaysCompletedRaw(d.daysCompleted); lsSet(keys.days, d.daysCompleted); }
        if (d.challengeStartDate){ setChallengeStartDateRaw(d.challengeStartDate); lsSet(keys.start, d.challengeStartDate); }
        if (d.challengeTitle)    { setChallengeTitleRaw(d.challengeTitle); lsSet(keys.title, d.challengeTitle); }
        if (d.dailyLogs)         { setDailyLogsRaw(d.dailyLogs); lsSet(keys.logs, d.dailyLogs); }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ─── Helper: حفظ إلى LS + Firestore ─────────────────────────────────────────
  const persist = (field: string, lsKey: string, value: unknown) => {
    lsSet(lsKey, value);
    if (userId !== "guest" && db) {
      const docRef = doc(db, "users", userId);
      setDoc(docRef, { [field]: value, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  };

  // مرجع لمنع الكتابة قبل اكتمال التحميل
  const readyRef = useRef(false);
  useEffect(() => { readyRef.current = isDataReady; }, [isDataReady]);

  // ─── Setters مع Auto-Persist ──────────────────────────────────────────────
  const setHabits = (value: Habit[] | ((prev: Habit[]) => Habit[])) => {
    setHabitsRaw((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (readyRef.current) persist("habits", keys.habits, next);
      return next;
    });
  };

  const setDaysCompleted = (value: boolean[] | ((prev: boolean[]) => boolean[])) => {
    setDaysCompletedRaw((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (readyRef.current) persist("daysCompleted", keys.days, next);
      return next;
    });
  };

  const setChallengeStartDate = (value: string) => {
    setChallengeStartDateRaw(value);
    if (readyRef.current) persist("challengeStartDate", keys.start, value);
  };

  const setChallengeTitle = (value: string) => {
    setChallengeTitleRaw(value);
    if (readyRef.current) persist("challengeTitle", keys.title, value);
  };

  const setDailyLogs = (value: DailyLog[] | ((prev: DailyLog[]) => DailyLog[])) => {
    setDailyLogsRaw((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (readyRef.current) persist("dailyLogs", keys.logs, next);
      return next;
    });
  };

  return {
    habits, setHabits,
    daysCompleted, setDaysCompleted,
    challengeStartDate, setChallengeStartDate,
    challengeTitle, setChallengeTitle,
    dailyLogs, setDailyLogs,
    isDataReady,
  };
}
