/**
 * useNotifications — Hook لإدارة إشعارات توازن
 *
 * يعالج:
 * - طلب صلاحية الإشعارات
 * - إشعار أذكار الصباح (5:30 صباحاً)
 * - إشعار أذكار المساء (5:00 مساءً)
 * - إشعار إكمال جميع العادات اليومية
 */
import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ─── Helper: عرض إشعار ─────────────────────────────────────────────────────
function showNotification(title: string, body: string, tag?: string): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    tag,
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌿</text></svg>",
  });
}

// ─── Hook رئيسي ──────────────────────────────────────────────────────────────
export function useNotifications(
  isLoggedIn: boolean,
  completedCount: number,
  totalCount: number,
) {
  const [enabled, setEnabled] = useLocalStorage<boolean>("tawazon_notifications_enabled", false);
  const [notifiedToday, setNotifiedToday] = useLocalStorage<string>("tawazon_last_notified_date", "");

  // ─── تفعيل / إيقاف الإشعارات ──────────────────────────────────────────────
  const toggle = async (): Promise<void> => {
    if (!("Notification" in window)) {
      alert("متصفحك لا يدعم نظام التنبيهات.");
      return;
    }
    if (enabled) {
      setEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setEnabled(true);
      showNotification("🔔 تم تفعيل التنبيهات بنجاح", "سنقوم بتنبيهك بمواقيت الصلاة والأوراد اليومية.");
    } else {
      alert("يرجى إعطاء صلاحية التنبيهات من إعدادات المتصفح لتفعيل هذه الميزة.");
    }
  };

  // ─── فحص مواعيد الأذكار كل دقيقة ────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const today = now.toDateString();

      if (h === 5 && m === 30) {
        const key = `notified_athkar_morning_${today}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          showNotification("🌅 موعد أذكار الصباح", "ابدأ يومك بنور الذكر والطمأنينة وحصن نفسك.");
        }
      }

      if (h === 17 && m === 0) {
        const key = `notified_athkar_evening_${today}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          showNotification("🌙 موعد أذكار المساء", "حصّن نفسك واملأ قلبك بالسكينة والسلام قبل مغيب الشمس.");
        }
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [enabled]);

  // ─── إشعار إكمال العادات اليومية ─────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || totalCount === 0) return;
    const today = new Date().toDateString();
    if (completedCount === totalCount && notifiedToday !== today) {
      showNotification(
        "🌿 حديقتك في توازن تزدهر!",
        "أحسنت صنعاً! لقد أتممت جميع عاداتك اليوم وتفتحت زهور حديقتك بالكامل. حافظ على هذا التوازن الجميل! ✨",
        "tawazon-complete",
      );
      setNotifiedToday(today);
    }
  }, [completedCount, totalCount, isLoggedIn, notifiedToday, setNotifiedToday]);

  return { notificationsEnabled: enabled, toggleNotifications: toggle };
}
