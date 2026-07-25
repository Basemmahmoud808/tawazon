import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
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
  const [emailName, setEmailName] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
      case "auth/weak-password":
        return "كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 خانات على الأقل.";
      case "auth/too-many-requests":
        return "تم إرسال طلبات كثيرة جداً بشكل مؤقت. الرجاء المحاولة لاحقاً.";
      default:
        return "حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.";
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!auth) {
      if (!email && !emailName) {
        setErrorMsg("الرجاء إدخال الاسم أو البريد الإلكتروني للتسجيل المحلي.");
        return;
      }
      const displayName = emailName.trim() || (email ? email.split("@")[0] : "مستخدم توازن");
      onLoginSuccess(displayName, "email");
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
        await updateProfile(userCredential.user, { displayName });
        onLoginSuccess(displayName, "email");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user.displayName || email.split("@")[0], "email");
      }
    } catch (error: any) {
      setErrorMsg(getArabicErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onLoginSuccess("ضيف توازن", "guest");
  };

  return (
    <div className="login-wrapper">
      <button 
        onClick={onToggleTheme} 
        className="login-theme-toggle emoji-accent"
        title={theme === "dark" ? "الوضع المضيء" : "الوضع الداكن"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="login-blob-left" />
      <div className="login-blob-right" />

      <div className="login-card-responsive login-card">
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

            <form onSubmit={handleEmailSubmit} className="login-form">
              {isRegistering && (
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

              <div className="login-input-group">
                <label className="login-label">كلمة المرور</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
              </div>

              <button type="submit" className="login-submit-btn">
                {isRegistering ? "إنشاء حساب جديد ودخول" : "تسجيل الدخول"}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }}
                  className="login-toggle-link"
                >
                  {isRegistering ? "لديك حساب بالفعل؟ سجل دخولك" : "ليس لديك حساب؟ سجل حساباً جديداً"}
                </button>
              </div>
            </form>

            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">أو</span>
              <span className="login-divider-line" />
            </div>

            <button onClick={handleGuestLogin} className="login-guest-btn">
              الاستمرار كضيف (تخطي التسجيل)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
