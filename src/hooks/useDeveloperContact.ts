/**
 * useDeveloperContact — Hook لإدارة نموذج التواصل مع المطور
 *
 * يعالج:
 * - state نموذج الرسالة
 * - إرسال عبر Firestore + FormSubmit (Email)
 * - إرسال مباشر عبر واتساب أو إيميل
 */
import { useState, useEffect, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

type MsgType = "color_theme" | "add_feature" | "report_bug" | "other";

const CATEGORY_NAMES: Record<MsgType, string> = {
  color_theme: "تعديل ألوان وتصميم",
  add_feature: "طلب إضافة ميزة",
  report_bug:  "الإبلاغ عن مشكلة",
  other:       "اقتراح عام",
};

export function useDeveloperContact(userId: string, userName: string) {
  const [msgType, setMsgType]         = useState<MsgType>("color_theme");
  const [msgText, setMsgText]         = useState("");
  const [contact, setContact]         = useState("");
  const [sending, setSending]         = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // cleanup on unmount
  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  // ─── إرسال عبر النموذج (Firestore + FormSubmit) ─────────────────────────
  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSending(true);
    try {
      // 1. FormSubmit → بريد إلكتروني مباشر
      try {
        await fetch("https://formsubmit.co/ajax/basemmahmoud808@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name:     userName || "مستخدم توازن",
            category: msgType,
            contact:  contact.trim() || "غير محدد",
            message:  msgText.trim(),
            date:     new Date().toLocaleString("ar-EG"),
          }),
        });
      } catch {}

      // 2. Firestore log
      if (db) {
        await addDoc(collection(db, "developer_messages"), {
          uid:           userId,
          name:          userName || "ضيف",
          email:         auth?.currentUser?.email || "",
          phone:         auth?.currentUser?.phoneNumber || "",
          customContact: contact.trim(),
          category:      msgType,
          message:       msgText.trim(),
          timestamp:     Date.now(),
          status:        "pending",
        });
      } else {
        // Offline fallback
        const existing = JSON.parse(localStorage.getItem("tawazon_offline_feedback") || "[]");
        existing.push({ uid: userId, name: userName || "ضيف", customContact: contact.trim(), category: msgType, message: msgText.trim(), timestamp: Date.now() });
        localStorage.setItem("tawazon_offline_feedback", JSON.stringify(existing));
      }

      setSentSuccess(true);
      setMsgText("");
      setContact("");
      resetTimer.current = setTimeout(() => setSentSuccess(false), 2500);
    } catch {
      alert("حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.");
    } finally {
      setSending(false);
    }
  };

  // ─── إرسال مباشر عبر واتساب ──────────────────────────────────────────────
  const sendWhatsApp = (): void => {
    if (!msgText.trim()) { alert("الرجاء كتابة رسالتك أولاً."); return; }
    const contactLine = contact.trim() ? `\nوسيلة التواصل: ${contact.trim()}` : "";
    const full = `السلام عليكم ورحمة الله،\nمنصة توازن 🌿\nالموضوع: ${CATEGORY_NAMES[msgType]}\nمن: ${userName || "مستخدم"}${contactLine}\n\nالرسالة:\n${msgText.trim()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(full)}`, "_blank");
  };

  // ─── إرسال مباشر عبر إيميل ───────────────────────────────────────────────
  const sendEmail = (): void => {
    if (!msgText.trim()) { alert("الرجاء كتابة رسالتك أولاً."); return; }
    const contactLine = contact.trim() ? `\nوسيلة التواصل: ${contact.trim()}` : "";
    const subject = `رسالة واقتراح جديد - منصة توازن (${CATEGORY_NAMES[msgType]})`;
    const body    = `السلام عليكم ورحمة الله،\nمنصة توازن 🌿\nالموضوع: ${CATEGORY_NAMES[msgType]}\nمن: ${userName || "مستخدم"}${contactLine}\n\nالرسالة:\n${msgText.trim()}`;
    window.open(`mailto:basemmahmoud808@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return {
    msgType, setMsgType,
    msgText, setMsgText,
    contact, setContact,
    sending, sentSuccess,
    submit, sendWhatsApp, sendEmail,
  };
}
