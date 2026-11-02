import React, { useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

interface LoginProps {
  onLoginSuccess: (userName: string, loginMethod: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getFirebaseErrorCode = (error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error) {
      return String(error.code);
    }
    return "";
  };

  useEffect(() => {
    if (auth?.currentUser?.email && !auth.currentUser.emailVerified) {
      setVerificationPending(true);
    }
  }, []);

  const getArabicErrorMessage = (code: string) => {
    switch (code) {
      case "auth/invalid-email":
        return "البريد الإلكتروني المدخل غير صحيح.";
      case "auth/user-disabled":
        return "لقد تم إيقاف هذا الحساب.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      case "auth/email-already-in-use":
        return "البريد الإلكتروني مستخدم بالفعل بحساب آخر.";
      case "auth/invalid-api-key":
        return "إعدادات Firebase غير صحيحة في النسخة المنشورة.";
      case "auth/app-not-authorized":
        return "هذا الموقع غير مصرح له باستخدام مشروع Firebase.";
      case "auth/weak-password":
        return "كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 خانات على الأقل.";
      case "auth/too-many-requests":
        return "تم إرسال طلبات كثيرة جداً بشكل مؤقت. الرجاء المحاولة لاحقاً.";
      case "auth/network-request-failed":
        return "تعذر الاتصال بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.";
      case "auth/operation-not-allowed":
        return "تسجيل البريد الإلكتروني غير مفعّل في إعدادات الموقع.";
      case "auth/unauthorized-domain":
        return "نطاق الموقع غير مضاف إلى النطاقات المسموح بها في Firebase.";
      case "auth/quota-exceeded":
        return "تم تجاوز حد إرسال رسائل التأكيد مؤقتاً. حاول لاحقاً.";
      case "auth/internal-error":
        return "حدث خطأ داخل خدمة الحسابات. حاول مرة أخرى بعد قليل.";
      case "auth/user-token-expired":
      case "auth/requires-recent-login":
        return "انتهت جلسة الحساب. سجّل الدخول مرة أخرى ثم حاول.";
      default:
        return code
          ? `تعذر إكمال العملية (${code}). حاول مرة أخرى لاحقاً.`
          : "حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.";
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (isResettingPassword) {
      if (!auth) {
        setErrorMsg("خدمة الحسابات غير متاحة حالياً. حاول لاحقاً.");
        return;
      }
      if (!email) {
        setErrorMsg("اكتب بريدك الإلكتروني أولاً.");
        return;
      }
      setLoading(true);
      setLoadingMessage("جاري إرسال رابط استعادة كلمة المرور...");
      try {
        await sendPasswordResetEmail(auth, email);
        setErrorMsg("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.");
        setIsResettingPassword(false);
      } catch (error: unknown) {
        const code = getFirebaseErrorCode(error);
        setErrorMsg(getArabicErrorMessage(code));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!auth) {
      setErrorMsg("خدمة الحسابات غير متاحة حالياً. جرّب الدخول كضيف أو حاول لاحقاً.");
      return;
    }
    if (!email || !password) {
      setErrorMsg("الرجاء ملء جميع الحقول.");
      return;
    }
    
    setLoading(true);
    setLoadingMessage(isRegistering ? "جاري إنشاء حسابك الجديد..." : "جاري التحقق من حسابك...");
    
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = emailName.trim() || email.split("@")[0];
        let profileUpdateFailed = false;
        try {
          await updateProfile(userCredential.user, { displayName });
        } catch {
          profileUpdateFailed = true;
        }
        setVerificationPending(true);
        try {
          await sendEmailVerification(userCredential.user);
          setErrorMsg(
            profileUpdateFailed
              ? "تم إنشاء الحساب وإرسال رسالة التأكيد، لكن تعذر حفظ الاسم. يمكنك المتابعة بعد تأكيد البريد."
              : "تم إنشاء الحساب. افتح رسالة التأكيد التي أرسلناها إلى بريدك."
          );
        } catch (error: unknown) {
          const code = getFirebaseErrorCode(error);
          setErrorMsg(`تم إنشاء الحساب، لكن تعذر إرسال رسالة التأكيد. ${getArabicErrorMessage(code)}`);
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setVerificationPending(true);
          setErrorMsg("");
          return;
        }
        onLoginSuccess(userCredential.user.displayName || email.split("@")[0], "email");
      }
    } catch (error: unknown) {
      const code = getFirebaseErrorCode(error);
      if (code === "auth/email-already-in-use") {
        setIsRegistering(false);
        setErrorMsg("هذا البريد مسجل بالفعل. بدّل إلى تسجيل الدخول أو استخدم استعادة كلمة المرور.");
        return;
      }
      setErrorMsg(getArabicErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (auth) {
      void signOut(auth).finally(() => onLoginSuccess("ضيف توازن", "guest"));
    } else {
      onLoginSuccess("ضيف توازن", "guest");
    }
  };

  const handleResendVerification = async () => {
    if (!auth?.currentUser) {
      setErrorMsg("سجّل دخولك بالبريد وكلمة المرور أولاً لإعادة إرسال الرسالة.");
      return;
    }
    setLoading(true);
    setLoadingMessage("جاري إرسال رسالة التأكيد...");
    try {
      await sendEmailVerification(auth.currentUser);
      setErrorMsg("تم إرسال رسالة تأكيد جديدة. راجع بريدك ومجلد الرسائل غير المرغوب فيها.");
    } catch (error: unknown) {
      const code = getFirebaseErrorCode(error);
      setErrorMsg(getArabicErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationCheck = async () => {
    if (!auth?.currentUser) return;
    setLoading(true);
    setLoadingMessage("جاري التحقق من حالة البريد...");
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setVerificationPending(false);
        onLoginSuccess(
          auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "مستخدم توازن",
          "email"
        );
      } else {
        setErrorMsg("لم يتم تأكيد البريد بعد. اضغط على الرابط في الرسالة ثم حاول مرة أخرى.");
      }
    } catch (error: unknown) {
      const code = getFirebaseErrorCode(error);
      setErrorMsg(getArabicErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-blob-left" />
      <div className="login-blob-right" />

      <div className="login-card-responsive login-card">
        <button
          onClick={onToggleTheme}
          className="login-theme-toggle emoji-accent"
          title={theme === "dark" ? "الوضع المضيء" : "الوضع الداكن"}
          aria-label={theme === "dark" ? "تفعيل الوضع المضيء" : "تفعيل الوضع الداكن"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div className="login-logo-header">
          <div className="login-logo-icon emoji-accent">🌿</div>
          <h2 className="login-logo-title">توازن</h2>
          <p className="login-logo-subtitle">مساحتك الهادئة للسكينة وبناء الذات</p>
        </div>

        {loading ? (
          <div className="login-loading-container">
            <div className="login-spinner" />
            <p className="login-loading-text">{loadingMessage}</p>
          </div>
        ) : (
          <>
            {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

            {/* ─── زر الضيف أولاً — أقل احتكاك للمستخدم الجديد ─── */}
            <button
              onClick={handleGuestLogin}
              className="login-guest-btn"
              style={{ marginBottom: "6px" }}
            >
              🚀 ادخل الآن بدون تسجيل
            </button>
            <p style={{
              textAlign: "center",
              fontSize: "11px",
              color: "var(--text-muted)",
              margin: "0 0 16px",
              lineHeight: 1.6,
            }}>
              بياناتك محفوظة على جهازك • سجّل لاحقاً لمزامنة بياناتك على كل أجهزتك
            </p>

            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">أو سجّل للمزامنة</span>
              <span className="login-divider-line" />
            </div>

            {verificationPending ? (
              <div className="login-verification-panel">
                <div className="login-verification-icon">✉️</div>
                <h3>أكد بريدك الإلكتروني</h3>
                <p>
                  أرسلنا رابط التأكيد إلى <strong>{auth?.currentUser?.email || email}</strong>.
                  افتح الرابط ثم اضغط «تحققت من البريد».
                </p>
                <button type="button" onClick={handleVerificationCheck} className="login-submit-btn">
                  تحققت من البريد
                </button>
                <button type="button" onClick={handleResendVerification} className="login-toggle-link">
                  إعادة إرسال رسالة التأكيد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (auth) void signOut(auth);
                    setVerificationPending(false);
                    setErrorMsg("");
                  }}
                  className="login-toggle-link"
                >
                  استخدام بريد مختلف
                </button>
              </div>
            ) : (
            /* ─── نموذج البريد الإلكتروني ─── */
            <form onSubmit={handleEmailSubmit} className="login-form">
              {!isResettingPassword && isRegistering && (
                <div className="login-input-group">
                  <label className="login-label">الاسم الشخصي</label>
                  <input
                    type="text"
                    placeholder="أدخل اسمك الكريم"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    className="login-input"
                    required
                  />
                </div>
              )}

              <div className="login-input-group">
                <label className="login-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  required
                />
              </div>

              {!isResettingPassword && <div className="login-input-group">
                <label className="login-label">كلمة المرور</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
              </div>}

              <button type="submit" className="login-submit-btn">
                {isResettingPassword ? "إرسال رابط الاستعادة" : isRegistering ? "إنشاء الحساب وإرسال التأكيد" : "تسجيل الدخول"}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => { setIsResettingPassword(!isResettingPassword); setIsRegistering(false); setErrorMsg(""); }}
                  className="login-toggle-link"
                >
                  {isResettingPassword ? "العودة لتسجيل الدخول" : "نسيت كلمة المرور؟"}
                </button>
                {!isResettingPassword && (
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }}
                    className="login-toggle-link"
                  >
                    {isRegistering ? "لديك حساب بالفعل؟ سجل دخولك" : "ليس لديك حساب؟ أنشئ حساباً"}
                  </button>
                )}
              </div>
            </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
