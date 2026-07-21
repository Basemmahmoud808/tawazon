import React, { useState, useEffect, useRef } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider
} from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { auth } from "../firebase";

interface LoginProps {
  onLoginSuccess: (userName: string, loginMethod: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type LoginMethod = "email" | "phone" | "google" | "facebook";

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const firebaseUnavailableMessage = "تسجيل الدخول عبر Firebase غير متاح حالياً. أضف إعدادات Firebase الصحيحة في ملف البيئة ثم أعد تشغيل التطبيق.";
  const [method, setMethod] = useState<LoginMethod>("email");
  
  // Email states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailName, setEmailName] = useState("");

  // Phone states
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  // Country selector (Egypt and Saudi Arabia)
  const [countryCode, setCountryCode] = useState<"+966" | "+20">("+20");

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Phone OTP timer countdown
  useEffect(() => {
    let interval: any;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  // Complete OAuth logins after a redirect flow.
  useEffect(() => {
    if (!auth) {
      setErrorMsg(firebaseUnavailableMessage);
      return;
    }
    getRedirectResult(auth)
      .then((result) => {
        if (!result?.user) return;
        const user = result.user;
        const methodFromProvider = user.providerData[0]?.providerId === "facebook.com" ? "facebook" : "google";
        onLoginSuccess(user.displayName || user.email?.split("@")[0] || (methodFromProvider === "facebook" ? "مستخدم فيسبوك" : "مستخدم Google"), methodFromProvider);
      })
      .catch((error: any) => {
        if (error?.code) {
          setErrorMsg(getArabicErrorMessage(error.code));
        }
      });
  }, [onLoginSuccess]);

  // Translate Firebase Auth errors to friendly Arabic messages
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
      case "auth/invalid-verification-code":
        return "رمز التحقق المدخل غير صحيح. الرجاء التأكد وإعادة المحاولة.";
      case "auth/invalid-phone-number":
        return "رقم الهاتف المدخل غير صحيح. يرجى التأكد من الصيغة.";
      default:
        return "حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.";
    }
  };

  // --- Real Email Authentication ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!auth) {
      setErrorMsg(firebaseUnavailableMessage);
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
        // Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name
        const displayName = emailName.trim() || email.split("@")[0];
        await updateProfile(userCredential.user, { displayName });
        onLoginSuccess(displayName, "email");
      } else {
        // Log in User
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user.displayName || email.split("@")[0], "email");
      }
    } catch (error: any) {
      setErrorMsg(getArabicErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Setup Invisible ReCAPTCHA
  const initRecaptcha = () => {
    if (!auth) {
      setErrorMsg(firebaseUnavailableMessage);
      return;
    }
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            // ReCAPTCHA solved, direct proceed
          },
          "expired-callback": () => {
            setErrorMsg("انتهت صلاحية التحقق الأمني. يرجى إعادة المحاولة.");
          }
        });
      } catch {
        setErrorMsg("فشل تهيئة نظام التحقق الأمني. يرجى تحديث الصفحة.");
      }
    }
  };

  // --- Real Phone OTP Authentication ---
  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!auth) {
      setErrorMsg(firebaseUnavailableMessage);
      return;
    }
    if (!phone || phone.length < 9) {
      setErrorMsg("الرجاء إدخال رقم هاتف صحيح.");
      return;
    }

    setLoading(true);
    setLoadingMessage("جاري إرسال رمز التحقق (SMS)...");

    try {
      initRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) {
        throw new Error("فشل تهيئة نظام التحقق الأمني.");
      }

      // Convert to E.164 format based on selected country
      const cleanPhone = phone.startsWith("0") ? phone.substring(1) : phone;
      const formattedPhone = `${countryCode}${cleanPhone}`;

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setSubmittedPhone(formattedPhone);
      setOtpSent(true);
      setOtpTimer(60);
    } catch (error: any) {
      setErrorMsg(getArabicErrorMessage(error.code) || "فشل إرسال الرمز. تحقق من رقم الهاتف وحاول مرة أخرى.");
      // Reset reCAPTCHA if it failed
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!auth) {
      setErrorMsg(firebaseUnavailableMessage);
      return;
    }

    if (!otpCode || otpCode.length < 6) {
      setErrorMsg("الرجاء إدخال رمز التحقق المكون من 6 أرقام.");
      return;
    }

    if (!confirmationResult) {
      setErrorMsg("انتهت الجلسة. الرجاء إعادة إرسال الرمز.");
      return;
    }

    setLoading(true);
    setLoadingMessage("جاري التحقق من الرمز ودخولك...");
    
    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      onLoginSuccess(user.displayName || `مستخدم الهاتف (${user.phoneNumber?.slice(-4)})`, "phone");
    } catch (error: any) {
      setErrorMsg(getArabicErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (providerType: "google" | "facebook") => {
    setErrorMsg("");
    if (!auth) {
      setErrorMsg(firebaseUnavailableMessage);
      return;
    }
    setLoading(true);
    setLoadingMessage(providerType === "google" ? "جاري فتح بوابة تسجيل الدخول عبر Google..." : "جاري فتح بوابة تسجيل الدخول عبر Facebook...");

    try {
      const provider = providerType === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();
      if (providerType === "google") {
        provider.setCustomParameters({ prompt: "select_account" });
      }

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        onLoginSuccess(user.displayName || user.email?.split("@")[0] || (providerType === "google" ? "مستخدم Google" : "مستخدم فيسبوك"), providerType);
      } catch (error: any) {
        if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
          await signInWithRedirect(auth, provider);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      // Handle closed popup specifically
      if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg(providerType === "google" ? "تم إلغاء عملية تسجيل الدخول بواسطة Google." : "تم إلغاء عملية تسجيل الدخول بفيسبوك بواسطة المستخدم.");
      } else {
        setErrorMsg(getArabicErrorMessage(error.code));
      }
    } finally {
      setLoading(false);
    }
  };

  // Guest Bypass
  const handleGuestLogin = () => {
    onLoginSuccess("ضيف توازن", "guest");
  };

  const resendOtp = async () => {
    setOtpTimer(60);
    setOtpCode("");
    // Re-trigger SMS sending
    const mockEvent = { preventDefault: () => {} } as React.FormEvent;
    handlePhoneSendOtp(mockEvent);
  };

  return (
    <div className="login-wrapper">
      {/* Theme Toggle Button for Login screen */}
      <button 
        onClick={onToggleTheme} 
        className="login-theme-toggle emoji-accent"
        title={theme === "dark" ? "الوضع المضيء" : "الوضع الداكن"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Background soft blobs for relaxing atmosphere */}
      <div className="login-blob-left" />
      <div className="login-blob-right" />

      <div className="login-card-responsive login-card">
        {/* Logo and Greeting */}
        <div className="login-logo-header">
          <div className="login-logo-icon emoji-accent">🌿</div>
          <h2 className="login-logo-title">
            توازن
          </h2>
          <p className="login-logo-subtitle">
            مساحتك الهادئة للسكينة وبناء الذات
          </p>
        </div>

        {/* Global Loading Screen */}
        {loading ? (
          <div className="login-loading-container">
            <div className="login-spinner" />
            <p className="login-loading-text">{loadingMessage}</p>
          </div>
        ) : (
          <>
            {/* Tabs for choosing login method */}
            {!otpSent && (
              <div className="login-tabs-responsive login-tabs">
                <button
                  onClick={() => { setMethod("email"); setErrorMsg(""); }}
                  className={`login-tab-btn ${method === "email" ? "active" : ""}`}
                >
                  البريد الإلكتروني
                </button>
                <button
                  onClick={() => { setMethod("phone"); setErrorMsg(""); }}
                  className={`login-tab-btn ${method === "phone" ? "active" : ""}`}
                >
                  رقم الهاتف
                </button>
                <button
                  onClick={() => { setMethod("google"); setErrorMsg(""); }}
                  className={`login-tab-btn ${method === "google" ? "active" : ""}`}
                >
                  جوجل
                </button>
                <button
                  onClick={() => { setMethod("facebook"); setErrorMsg(""); }}
                  className={`login-tab-btn ${method === "facebook" ? "active" : ""}`}
                >
                  فيسبوك
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

            {/* --- EMAIL LOGIN FORM --- */}
            {method === "email" && (
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
            )}

            {/* --- PHONE LOGIN FORM --- */}
            {method === "phone" && (
              <div className="login-form">
                {!otpSent ? (
                  <form onSubmit={handlePhoneSendOtp} className="login-form">
                    <div className="login-input-group">
                      <label className="login-label">رقم الهاتف المحمول</label>
                      {/* Country Selector */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                        {([["+20", "🇪🇬 مصر"], ["+966", "🇸🇦 السعودية"]] as const).map(([code, label]) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setCountryCode(code)}
                            className={`country-selector-btn ${countryCode === code ? "active" : ""}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="phone-input-wrapper">
                        <span className="phone-prefix">{countryCode}</span>
                        <input
                          type="tel"
                          placeholder={countryCode === "+20" ? "1012345678" : "501234567"}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          className="phone-input"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="login-submit-btn">
                      إرسال رمز التحقق (OTP)
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneVerifyOtp} className="login-form">
                    <div style={{ textAlign: "center", marginBottom: "8px" }}>
                      <p style={{ fontSize: "14px", color: "var(--text-main)" }}>
                        تم إرسال الرمز للهاتف: <strong>{submittedPhone || `${countryCode} ${phone}`}</strong>
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        يرجى إدخال الرمز المكون من 6 أرقام المستلم في رسالة SMS
                      </p>
                    </div>

                    <div className="login-input-group">
                      <label className="login-label">رمز التحقق (OTP)</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="login-input login-otp-input"
                        required
                      />
                    </div>

                    <button type="submit" className="login-submit-btn">
                      تحقق ودخول
                    </button>

                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                      {otpTimer > 0 ? (
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          إعادة الإرسال خلال {otpTimer} ثانية
                        </span>
                      ) : (
                        <button type="button" onClick={resendOtp} className="login-toggle-link">
                          إعادة إرسال رمز التحقق
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* --- GOOGLE LOGIN --- */}
            {method === "google" && (
              <div className="login-oauth-container">
                <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>
                  استخدم Google للوصول السريع إلى حسابك مع مزامنة آمنة.
                </p>
                <button onClick={() => handleOAuthLogin("google")} className="login-google-btn">
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" style={{ marginLeft: "8px" }}>
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.645 32.658 29.296 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.967 3.047l5.657-5.657C34.075 6.053 29.336 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.156 7.967 3.047l5.657-5.657C34.075 6.053 29.336 4 24 4c-7.818 0-14.656 4.415-17.694 10.691z" />
                    <path fill="#4CAF50" d="M24 44c5.236 0 10.005-2.004 13.563-5.272l-6.269-5.288C29.31 35.091 26.868 36 24 36c-5.274 0-9.608-3.314-11.281-7.946l-6.522 5.025C9.192 39.986 16.006 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.005 2.588-2.829 4.708-5.009 6.44l.003-.002 6.269 5.288C35.99 37.337 40 31.612 40 24c0-1.341-.138-2.651-.389-3.917z" />
                  </svg>
                  الدخول بواسطة Google
                </button>
              </div>
            )}

            {/* --- FACEBOOK LOGIN --- */}
            {method === "facebook" && (
              <div className="login-oauth-container">
                <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>
                  سجل دخولك بنقرة زر واحدة عبر ربط حساب فيسبوك بأمان.
                </p>
                <button onClick={() => handleOAuthLogin("facebook")} className="login-facebook-btn">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: "8px" }}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  الدخول بواسطة Facebook
                </button>
              </div>
            )}

            {/* Guest Login Divider */}
            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">أو</span>
              <span className="login-divider-line" />
            </div>

            {/* Guest Action */}
            <button onClick={handleGuestLogin} className="login-guest-btn">
              الاستمرار كضيف (تخطي التسجيل)
            </button>
          </>
        )}
      </div>

      {/* Invisible container required for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

