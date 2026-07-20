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
    <div style={loginWrapperStyle}>
      {/* Theme Toggle Button for Login screen */}
      <button 
        onClick={onToggleTheme} 
        style={cornerThemeToggleStyle}
        title={theme === "dark" ? "الوضع المضيء" : "الوضع الداكن"}
        className="emoji-accent"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Background soft blobs for relaxing atmosphere */}
      <div style={blobLeftStyle} />
      <div style={blobRightStyle} />

      <div className="login-card-responsive" style={loginCardStyle}>
        {/* Logo and Greeting */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={logoIconStyle} className="emoji-accent">🌿</div>
          <h2 style={{ fontFamily: "Thmanyah Serif Display", fontSize: "28px", color: "var(--color-sage)" }}>
            توازن
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "6px" }}>
            مساحتك الهادئة للسكينة وبناء الذات
          </p>
        </div>

        {/* Global Loading Screen */}
        {loading ? (
          <div style={loadingContainerStyle}>
            <div style={spinnerStyle} />
            <p style={{ color: "var(--text-main)", fontWeight: "500", fontSize: "15px" }}>{loadingMessage}</p>
          </div>
        ) : (
          <>
            {/* Tabs for choosing login method */}
            {!otpSent && (
              <div className="login-tabs-responsive" style={tabsContainerStyle}>
                <button
                  onClick={() => { setMethod("email"); setErrorMsg(""); }}
                  style={{ ...tabBtnStyle, borderBottomColor: method === "email" ? "var(--color-sage)" : "transparent", color: method === "email" ? "var(--color-sage)" : "var(--text-muted)" }}
                >
                  البريد الإلكتروني
                </button>
                <button
                  onClick={() => { setMethod("phone"); setErrorMsg(""); }}
                  style={{ ...tabBtnStyle, borderBottomColor: method === "phone" ? "var(--color-sage)" : "transparent", color: method === "phone" ? "var(--color-sage)" : "var(--text-muted)" }}
                >
                  رقم الهاتف
                </button>
                <button
                  onClick={() => { setMethod("google"); setErrorMsg(""); }}
                  style={{ ...tabBtnStyle, borderBottomColor: method === "google" ? "var(--color-sage)" : "transparent", color: method === "google" ? "var(--color-sage)" : "var(--text-muted)" }}
                >
                  جوجل
                </button>
                <button
                  onClick={() => { setMethod("facebook"); setErrorMsg(""); }}
                  style={{ ...tabBtnStyle, borderBottomColor: method === "facebook" ? "var(--color-sage)" : "transparent", color: method === "facebook" ? "var(--color-sage)" : "var(--text-muted)" }}
                >
                  فيسبوك
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && <div style={errorAlertStyle}>{errorMsg}</div>}

            {/* --- EMAIL LOGIN FORM --- */}
            {method === "email" && (
              <form onSubmit={handleEmailSubmit} style={formStyle}>
                {isRegistering && (
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>الاسم الشخصي</label>
                    <input
                      type="text"
                      placeholder="أدخل اسمك الكريم"
                      value={emailName}
                      onChange={(e) => setEmailName(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                )}
                
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>كلمة المرور</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <button type="submit" style={submitBtnStyle}>
                  {isRegistering ? "إنشاء حساب جديد ودخول" : "تسجيل الدخول"}
                </button>

                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }}
                    style={toggleLinkStyle}
                  >
                    {isRegistering ? "لديك حساب بالفعل؟ سجل دخولك" : "ليس لديك حساب؟ سجل حساباً جديداً"}
                  </button>
                </div>
              </form>
            )}

            {/* --- PHONE LOGIN FORM --- */}
            {method === "phone" && (
              <div style={formStyle}>
                {!otpSent ? (
                  <form onSubmit={handlePhoneSendOtp} style={formStyle}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>رقم الهاتف المحمول</label>
                      {/* Country Selector */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                        {([["+20", "🇪🇬 مصر"], ["+966", "🇸🇦 السعودية"]] as const).map(([code, label]) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setCountryCode(code)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              border: `2px solid ${countryCode === code ? "var(--color-sage)" : "var(--bg-accent)"}`,
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: countryCode === code ? "var(--color-sage-light)" : "transparent",
                              color: countryCode === code ? "var(--color-sage)" : "var(--text-muted)",
                              fontFamily: "inherit",
                              fontSize: "13px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "var(--transition-normal)",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div style={phoneInputWrapperStyle}>
                        <span style={phonePrefixStyle}>{countryCode}</span>
                        <input
                          type="tel"
                          placeholder={countryCode === "+20" ? "1012345678" : "501234567"}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          style={phoneInputStyle}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" style={submitBtnStyle}>
                      إرسال رمز التحقق (OTP)
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneVerifyOtp} style={formStyle}>
                    <div style={{ textAlign: "center", marginBottom: "8px" }}>
                      <p style={{ fontSize: "14px", color: "var(--text-main)" }}>
                        تم إرسال الرمز للهاتف: <strong>{submittedPhone || `${countryCode} ${phone}`}</strong>
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        يرجى إدخال الرمز المكون من 6 أرقام المستلم في رسالة SMS
                      </p>
                    </div>

                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>رمز التحقق (OTP)</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        style={{ ...inputStyle, letterSpacing: "8px", textAlign: "center", fontSize: "20px" }}
                        required
                      />
                    </div>

                    <button type="submit" style={submitBtnStyle}>
                      تحقق ودخول
                    </button>

                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                      {otpTimer > 0 ? (
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          إعادة الإرسال خلال {otpTimer} ثانية
                        </span>
                      ) : (
                        <button type="button" onClick={resendOtp} style={toggleLinkStyle}>
                          إعادة إرسال رمز التحقق
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* --- FACEBOOK LOGIN --- */}
            {method === "google" && (
              <div style={{ ...formStyle, alignItems: "center", padding: "16px 0" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>
                  استخدم Google للوصول السريع إلى حسابك مع مزامنة آمنة.
                </p>
                <button onClick={() => handleOAuthLogin("google")} style={googleBtnStyle}>
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

            {method === "facebook" && (
              <div style={{ ...formStyle, alignItems: "center", padding: "16px 0" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>
                  سجل دخولك بنقرة زر واحدة عبر ربط حساب فيسبوك بأمان.
                </p>
                <button onClick={() => handleOAuthLogin("facebook")} style={facebookBtnStyle}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: "8px" }}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  الدخول بواسطة Facebook
                </button>
              </div>
            )}

            {/* Guest Login Divider */}
            <div style={dividerStyle}>
              <span style={dividerLineStyle} />
              <span style={dividerTextStyle}>أو</span>
              <span style={dividerLineStyle} />
            </div>

            {/* Guest Action */}
            <button onClick={handleGuestLogin} style={guestBtnStyle}>
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

// Styles for the login screen layout
const loginWrapperStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at 15% 20%, rgba(28,108,77,0.10), transparent 28%), radial-gradient(circle at 85% 80%, rgba(224,177,93,0.12), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.0) 24%), var(--bg-primary)",
  position: "relative",
  overflow: "hidden",
  padding: "clamp(16px, 3vw, 32px)",
  transition: "background-color 0.4s ease",
};

const blobLeftStyle: React.CSSProperties = {
  position: "absolute",
  width: "420px",
  height: "420px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(28,108,77,0.16) 0%, rgba(250,248,245,0) 70%)",
  left: "-160px",
  top: "-60px",
  zIndex: 0,
  pointerEvents: "none",
};

const blobRightStyle: React.CSSProperties = {
  position: "absolute",
  width: "460px",
  height: "460px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(224,177,93,0.15) 0%, rgba(250,248,245,0) 70%)",
  right: "-180px",
  bottom: "-120px",
  zIndex: 0,
  pointerEvents: "none",
};

const loginCardStyle: React.CSSProperties = {
  maxWidth: "min(94vw, 520px)",
  width: "100%",
  background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,253,248,0.98) 100%)",
  borderRadius: "30px",
  padding: "clamp(24px, 4vw, 36px) clamp(18px, 4vw, 32px)",
  boxShadow: "0 28px 70px rgba(22,38,31,0.11), 0 4px 14px rgba(22,38,31,0.04)",
  border: "1px solid rgba(28,108,77,0.10)",
  zIndex: 1,
  position: "relative",
  transition: "background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
  animation: "fadeInUp 0.45s var(--ease-out) both",
  backdropFilter: "blur(18px)",
};

const logoIconStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  background: "linear-gradient(180deg, var(--brand-light), rgba(255,255,255,0.95))",
  borderRadius: "20px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "34px",
  marginBottom: "14px",
  boxShadow: "0 12px 30px rgba(28,108,77,0.10)",
  border: "1px solid rgba(28,108,77,0.08)",
};

const tabsContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
  marginBottom: "20px",
  paddingBottom: "16px",
  borderBottom: "1px solid rgba(28,108,77,0.10)",
};

const tabBtnStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,241,232,0.95))",
  border: "1px solid rgba(28,108,77,0.08)",
  borderBottom: "2px solid transparent",
  padding: "12px 10px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontFamily: "inherit",
  transition: "var(--transition-normal)",
  minHeight: "46px",
  borderRadius: "var(--radius-sm)",
  boxShadow: "0 4px 14px rgba(22,38,31,0.04)",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  width: "100%",
};

const inputGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "bold",
  color: "var(--text-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid var(--bg-accent)",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-main)",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  transition: "var(--transition-normal)",
};

const phoneInputWrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1px solid var(--bg-accent)",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "var(--bg-primary)",
  overflow: "hidden",
  direction: "ltr", // Left to right formatting for numbers
  minHeight: "48px",
};

const phonePrefixStyle: React.CSSProperties = {
  padding: "12px 14px",
  backgroundColor: "var(--bg-accent)",
  color: "var(--text-muted)",
  fontSize: "14px",
  fontWeight: "500",
  borderRight: "1px solid var(--bg-accent)",
  whiteSpace: "nowrap",
};

const phoneInputStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  padding: "12px 14px",
  width: "100%",
  fontFamily: "inherit",
  fontSize: "14px",
  letterSpacing: "1px",
  backgroundColor: "transparent",
  color: "var(--text-main)",
};

const submitBtnStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, var(--brand-mid), var(--brand))",
  color: "var(--text-light)",
  border: "none",
  fontFamily: "inherit",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "14px 16px",
  borderRadius: "14px",
  cursor: "pointer",
  transition: "var(--transition-normal)",
  boxShadow: "0 10px 24px rgba(28,108,77,0.18)",
};

const googleBtnStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff, #fbfaf5)",
  color: "#1f2937",
  border: "1px solid rgba(17,24,39,0.10)",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  width: "100%",
  boxShadow: "0 8px 20px rgba(17,24,39,0.07)",
  transition: "var(--transition-normal)",
};

const toggleLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-sage)",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  fontFamily: "inherit",
};

const facebookBtnStyle: React.CSSProperties = {
  backgroundColor: "#1877f2",
  color: "white",
  border: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: "bold",
  padding: "14px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  boxShadow: "0 4px 12px rgba(24, 119, 242, 0.2)",
  transition: "var(--transition-normal)",
};

const dividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  margin: "24px 0",
};

const dividerLineStyle: React.CSSProperties = {
  flex: 1,
  height: "1px",
  backgroundColor: "var(--bg-accent)",
};

const dividerTextStyle: React.CSSProperties = {
  padding: "0 10px",
  fontSize: "12px",
  color: "var(--text-muted)",
};

const guestBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid rgba(28,108,77,0.16)",
  color: "var(--text-muted)",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: "500",
  padding: "13px 12px",
  borderRadius: "14px",
  cursor: "pointer",
  width: "100%",
  transition: "var(--transition-normal)",
  textAlign: "center",
};

const errorAlertStyle: React.CSSProperties = {
  backgroundColor: "#fdf2f2",
  color: "#c81e1e",
  padding: "10px 14px",
  borderRadius: "var(--radius-sm)",
  fontSize: "13px",
  marginBottom: "16px",
  border: "1px solid #fde8e8",
  textAlign: "center",
};

const loadingContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 0",
  gap: "16px",
};

const spinnerStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  border: "3px solid var(--color-sage-light)",
  borderTopColor: "var(--color-sage)",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const cornerThemeToggleStyle: React.CSSProperties = {
  position: "absolute",
  top: "20px",
  left: "20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,241,232,0.92))",
  border: "1px solid rgba(28,108,77,0.08)",
  borderRadius: "14px",
  padding: "10px 12px",
  cursor: "pointer",
  fontSize: "16px",
  boxShadow: "0 10px 22px rgba(22,38,31,0.08)",
  outline: "none",
  transition: "background-color 0.4s ease, border-color 0.4s ease",
  zIndex: 10,
};
