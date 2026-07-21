import React, { useState, useEffect, useCallback } from "react";

// ─── Types & Constants ────────────────────────────────────────────────────────
interface PrayerTime {
  name: string;
  arabicName: string;
  time: string; // "HH:MM"
  done: boolean;
}

interface StoredPrayerData {
  date: string;
  prayers: PrayerTime[];
}

const PRAYER_NAMES = [
  { name: "Fajr",   arabicName: "الفجر" },
  { name: "Sunrise",arabicName: "الشروق" },
  { name: "Dhuhr",  arabicName: "الظهر" },
  { name: "Asr",    arabicName: "العصر" },
  { name: "Maghrib",arabicName: "المغرب" },
  { name: "Isha",   arabicName: "العشاء" },
];

const STORAGE_KEY = "tawazon_prayers";
const SOUND_ENABLED_KEY = "tawazon_adhan_enabled";
const SOUND_TYPE_KEY = "tawazon_adhan_sound";

// Public URLs of premium audio resources
const AUDIO_URLS = {
  takbeer: "https://raw.githubusercontent.com/ahmed-hussein/adhan-mp3/main/takbeer.mp3",
  chime: "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav"
};

// Helper calculators
function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatCountdown(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h} س و ${m} د`;
  return `${m} دقيقة`;
}

// Kaaba coordinates for Qibla calculation
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const BRAND_COLOR = "#1a6b4a";
const GOLD_COLOR  = "#c8963e";

// ─── Main Prayer Times Component ──────────────────────────────────────────────
export const PrayerTimes: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; minsLeft: number } | null>(null);
  const [hijriDate, setHijriDate] = useState("");

  // Geolocation and Qibla states
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [compassSupported, setCompassSupported] = useState(false);

  // Sound notification states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_ENABLED_KEY) === "true";
  });
  const [soundType, setSoundType] = useState<"takbeer" | "chime">(() => {
    return (localStorage.getItem(SOUND_TYPE_KEY) as "takbeer" | "chime") || "takbeer";
  });

  const todayStr = new Date().toDateString();

  // Load Geolocation coordinates
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Calculate exact Qibla angle relative to North (clockwise)
          const phiUser = lat * (Math.PI / 180);
          const lambdaUser = lng * (Math.PI / 180);
          const phiKaaba = KAABA_LAT * (Math.PI / 180);
          const lambdaKaaba = KAABA_LNG * (Math.PI / 180);

          const dLng = lambdaKaaba - lambdaUser;
          const y = Math.sin(dLng);
          const x = Math.cos(phiUser) * Math.tan(phiKaaba) - Math.sin(phiUser) * Math.cos(dLng);
          
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          angle = (angle + 360) % 360; // Normalize to [0, 360]
          setQiblaAngle(Math.round(angle));
        },
        () => {
          // Fallback to Cairo coordinates
          setQiblaAngle(136); // standard Qibla angle for Cairo is ~136 degrees
        }
      );
    }
  }, []);

  // Listen to Device Orientation for real-time mobile compass rotation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // absolute heading is preferred (Safari uses webkitCompassHeading)
      const heading = (e as any).webkitCompassHeading !== undefined
        ? (e as any).webkitCompassHeading
        : (e as any).alpha !== null
          ? 360 - (e as any).alpha
          : 0;

      setDeviceHeading(Math.round(heading));
      setCompassSupported(true);
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  // Load or Fetch Prayer Timings
  const loadPrayers = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredPrayerData = JSON.parse(stored);
        if (parsed.date === todayStr) {
          setPrayers(parsed.prayers);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    try {
      const res = await fetch(
        "https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5"
      );
      const json = await res.json();
      const timings = json.data.timings;

      const hijri = json.data.date?.hijri;
      if (hijri) {
        setHijriDate(`${hijri.day} ${hijri.month?.ar} ${hijri.year} هـ`);
      }

      const built: PrayerTime[] = PRAYER_NAMES.map((p) => ({
        name: p.name,
        arabicName: p.arabicName,
        time: timings[p.name]?.slice(0, 5) || "--:--",
        done: false,
      }));

      setPrayers(built);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, prayers: built }));
    } catch {
      setError("عذراً، فشل تحميل مواقيت الصلاة تلقائياً. تأكد من اتصالك بالإنترنت.");
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadPrayers();
  }, [loadPrayers]);

  // Tick every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Next prayer timer logic
  useEffect(() => {
    if (prayers.length === 0) return;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const obligatory = prayers.filter(p => p.name !== "Sunrise");
    let found: { name: string; minsLeft: number } | null = null;
    for (const p of obligatory) {
      const pMins = toMins(p.time);
      if (pMins > currentMins) {
        found = { name: p.arabicName, minsLeft: pMins - currentMins };
        break;
      }
    }
    if (!found && obligatory.length > 0) {
      const fajrMins = toMins(obligatory[0].time);
      found = { name: `فجر الغد`, minsLeft: (24 * 60 - currentMins) + fajrMins };
    }
    setNextPrayer(found);
  }, [now, prayers]);

  // Done toggling handler
  const toggleDone = (index: number) => {
    const updated = prayers.map((p, i) => i === index ? { ...p, done: !p.done } : p);
    setPrayers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, prayers: updated }));
  };

  // Play audio preview
  const playPreview = (type: "takbeer" | "chime") => {
    const url = AUDIO_URLS[type];
    const audio = new Audio(url);
    audio.volume = 0.6;
    audio.play().catch(() => alert("انقر على الصفحة أولاً للسماح للمتصفح بتشغيل الملف الصوتي."));
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  };

  const handleSoundTypeChange = (type: "takbeer" | "chime") => {
    setSoundType(type);
    localStorage.setItem(SOUND_TYPE_KEY, type);
    playPreview(type);
  };

  const doneCount = prayers.filter(p => p.name !== "Sunrise" && p.done).length;
  const totalObligatory = 5;

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const isPast = (time: string) => toMins(time) < currentMins;
  
  const isCurrent = (prayer: PrayerTime, _idx: number) => {
    if (prayer.name === "Sunrise") return false;
    const obligatory = prayers.filter(p => p.name !== "Sunrise");
    const pIdx = obligatory.findIndex(p => p.name === prayer.name);
    if (pIdx === -1) return false;
    const start = toMins(prayer.time);
    const next = obligatory[pIdx + 1];
    const end = next ? toMins(next.time) : 24 * 60;
    return currentMins >= start && currentMins < end;
  };

  return (
    <div className="prayer-container">
      {/* Header Panel */}
      <div className="prayer-header-box">
        <div className="prayer-header-top">
          <div>
            <h3 style={headerTitle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
                <path d="M12 2C9.5 5 9.5 9 9.5 13h5C14.5 9 14.5 5 12 2z" />
                <path d="M6 21h12" />
                <path d="M8 13v8" />
                <path d="M16 13v8" />
                <path d="M11 21v-3a1 1 0 0 1 2 0v3" />
                <circle cx="12" cy="2" r="0.8" fill="white" />
              </svg>
              <span>مواقيت الصلاة اليوم</span>
            </h3>
            {hijriDate && <p style={hijriStyle}>{hijriDate}</p>}
          </div>
          {nextPrayer && (
            <div className="next-prayer-box">
              <p style={nextLabel}>الصلاة القادمة</p>
              <p style={nextName}>{nextPrayer.name}</p>
              <p style={nextTimer}>بعد {formatCountdown(nextPrayer.minsLeft)}</p>
            </div>
          )}
        </div>

        {/* Overall Prayers progress */}
        <div style={progressBarOuter}>
          <div style={{ ...progressBarInner, width: `${(doneCount / totalObligatory) * 100}%` }} />
        </div>
        <p style={progressText}>{doneCount} من {totalObligatory} صلوات مكتملة اليوم</p>
      </div>

      {/* Grid: 2 Columns on desktop (Prayer List | Qibla Compass) */}
      <div className="prayer-content-grid">
        
        {/* Column 1: Prayers list */}
        <div className="prayer-column-card">
          <h4 style={panelTitle}>قائمة الفروض اليومية</h4>
          {loading ? (
            <div style={loadBox}>
              <div style={spinnerStyle} />
              <p style={{ color: "var(--text-muted)", marginTop: "10px", fontSize: "13px" }}>جاري تحميل المواقيت...</p>
            </div>
          ) : error ? (
            <div style={errorBox}>
              <p>⚠️ {error}</p>
              <button onClick={loadPrayers} style={retryBtn}>إعادة المحاولة</button>
            </div>
          ) : (
            <div style={prayerList}>
              {prayers.map((p, idx) => {
                const past = isPast(p.time);
                const current = isCurrent(p, idx);
                const isSunrise = p.name === "Sunrise";

                return (
                  <div
                    key={p.name}
                    style={{
                      ...prayerRow,
                      ...(current ? currentRow : {}),
                      ...(isSunrise ? sunriseRow : {}),
                      opacity: isSunrise ? 0.65 : 1,
                    }}
                  >
                    <div style={prayerLeft}>
                      <span style={prayerIcon}>
                        {renderPrayerIcon(p.name, current)}
                      </span>
                      <div>
                        <p style={{ ...prayerName, color: current ? "var(--brand)" : "var(--text-main)" }}>
                          {p.arabicName}
                          {current && <span style={currentBadge}>الآن</span>}
                        </p>
                        <p style={{ ...prayerTime, color: past && !current ? "var(--text-muted)" : "var(--text-main)" }}>
                          {p.time}
                        </p>
                      </div>
                    </div>

                    {!isSunrise && (
                      <button
                        onClick={() => toggleDone(idx)}
                        style={{
                          ...checkBtn,
                          backgroundColor: p.done ? BRAND_COLOR : "transparent",
                          borderColor: p.done ? BRAND_COLOR : "var(--bg-accent)",
                        }}
                        title={p.done ? "تمت الصلاة" : "تحديد كمكتمل"}
                      >
                        {p.done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Compass & Sound Settings */}
        <div className="prayer-column-side">
          
          {/* Compass Card */}
          <div className="prayer-column-card">
            <h4 style={panelTitle}>مؤشر اتجاه القبلة</h4>
            <div style={compassContainer}>
              
              {/* Compass Disk (rotates dynamically) */}
              <div style={{
                ...compassWrapper,
                transform: `rotate(${-deviceHeading}deg)`,
                transition: compassSupported ? "transform 0.15s ease-out" : "none"
              }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: "block" }}>
                  {/* Outer Ring */}
                  <circle cx="90" cy="90" r="82" fill="none" stroke="var(--bg-accent)" strokeWidth="3" />
                  <circle cx="90" cy="90" r="76" fill="none" stroke="var(--bg-accent)" strokeWidth="1.5" strokeDasharray="3 3" />
                  
                  {/* Cardinal Directions */}
                  <text x="90" y="24" textAnchor="middle" style={compassLabelStyle} fill="#ef4444">N</text>
                  <text x="90" y="168" textAnchor="middle" style={compassLabelStyle}>S</text>
                  <text x="158" y="94" textAnchor="middle" style={compassLabelStyle}>E</text>
                  <text x="22" y="94" textAnchor="middle" style={compassLabelStyle}>W</text>
                  
                  {/* Kaaba Direction indicator needle (always pointing relative to North) */}
                  {qiblaAngle !== null && (
                    <g transform={`rotate(${qiblaAngle} 90 90)`}>
                      {/* Line pointing to Kaaba */}
                      <line x1="90" y1="90" x2="90" y2="34" stroke={GOLD_COLOR} strokeWidth="3.5" strokeLinecap="round" />
                      {/* Arrowhead */}
                      <polygon points="90,20 84,36 96,36" fill={GOLD_COLOR} />
                      {/* Kaaba icon mini box */}
                      <rect x="83" y="44" width="14" height="14" rx="2" fill="#000" stroke="#fff" strokeWidth="1" />
                      <line x1="83" y1="51" x2="97" y2="51" stroke="#c8963e" strokeWidth="1.5" />
                    </g>
                  )}
                  
                  {/* Center Dot */}
                  <circle cx="90" cy="90" r="6" fill="var(--text-main)" />
                  <circle cx="90" cy="90" r="2" fill="#fff" />
                </svg>
              </div>

              {/* Angle & Tips Text */}
              <div style={qiblaTextContainer}>
                <p style={qiblaAngleText}>زاوية القبلة: {qiblaAngle || 136}°</p>
                <p style={qiblaTips}>
                  {compassSupported 
                    ? "✓ البوصلة تدور تلقائياً. وجه الهاتف ليتطابق السهم الذهبي مع الاتجاه المستقيم بالأعلى."
                    : "قم بتدوير الهاتف أو اتبع زاوية 136 درجة باتجاه الجنوب الشرقي تقريباً."
                  }
                </p>
              </div>

            </div>
          </div>

          {/* Sound settings card */}
          <div className="prayer-column-card">
            <h4 style={panelTitle}>إعدادات أصوات تنبيه الصلاة</h4>
            
            {/* Audio Toggle switch */}
            <div style={soundToggleRow}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={soundToggleLbl}>تفعيل التنبيه الصوتي الأوتوماتيكي</span>
                <span style={soundToggleDesc}>تشغيل نغمة روحية أو تكبيرات فور دخول وقت الصلاة</span>
              </div>
              <button
                onClick={() => handleSoundToggle(!soundEnabled)}
                style={{
                  ...switchStyle,
                  backgroundColor: soundEnabled ? BRAND_COLOR : "var(--bg-accent)"
                }}
              >
                <div style={{
                  ...switchThumb,
                  transform: soundEnabled ? "translateX(-20px)" : "translateX(0)"
                }} />
              </button>
            </div>

            {/* Selector list of sound types */}
            {soundEnabled && (
              <div style={soundOptionsContainer}>
                <p style={optionTitle}>اختر نغمة التنبيه:</p>
                
                {/* Option 1: Takbeer */}
                <div 
                  onClick={() => handleSoundTypeChange("takbeer")}
                  style={{
                    ...soundOptionCard,
                    borderColor: soundType === "takbeer" ? BRAND_COLOR : "var(--bg-accent)",
                    backgroundColor: soundType === "takbeer" ? "var(--brand-xlight, #f0faf5)" : "var(--bg-primary)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={soundType === "takbeer" ? activeRadio : radioCircle} />
                    <div>
                      <p style={optionName}>صوت تكبيرات الأذان 🕌</p>
                      <p style={optionDesc}>تسجيل صوتي للتكبير والتنبيه بدخول الصلاة</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playPreview("takbeer"); }} 
                    style={playPreviewBtn}
                    title="استماع للتجربة"
                  >
                    🔊 تجربة
                  </button>
                </div>

                {/* Option 2: Chime */}
                <div 
                  onClick={() => handleSoundTypeChange("chime")}
                  style={{
                    ...soundOptionCard,
                    borderColor: soundType === "chime" ? BRAND_COLOR : "var(--bg-accent)",
                    backgroundColor: soundType === "chime" ? "var(--brand-xlight, #f0faf5)" : "var(--bg-primary)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={soundType === "chime" ? activeRadio : radioCircle} />
                    <div>
                      <p style={optionName}>رنين روحي هادئ 🔔</p>
                      <p style={optionDesc}>نغمة تنبيه أجراس جرس خفيفة وعميقة لتنبيه هادئ</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playPreview("chime"); }} 
                    style={playPreviewBtn}
                    title="استماع للتجربة"
                  >
                    🔊 تجربة
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

// ─── SVG icon rendering helper ────────────────────────────────────────────────
const renderPrayerIcon = (name: string, isCurrent: boolean) => {
  const strokeColor = isCurrent ? BRAND_COLOR : "var(--text-main)";
  const fillColor = isCurrent ? "var(--brand-light)" : "none";
  switch (name) {
    case "Fajr":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill={fillColor} />
          <path d="M19 3v4M17 5h4" strokeWidth="1.5" />
        </svg>
      );
    case "Sunrise":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M18 18a6 6 0 0 0-12 0" fill={fillColor} />
          <path d="M12 2v6M5.3 11.3l4.2 4.2M18.7 11.3l-4.2 4.2M2 18h4M18 18h4" />
        </svg>
      );
    case "Dhuhr":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <circle cx="12" cy="12" r="5" fill={fillColor} />
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
      );
    case "Asr":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M15.3 14.8a6 6 0 1 0-7.8-7.8" strokeDasharray="2 2" />
          <path d="M17.5 19H9a5 5 0 0 1 0-10h.5a3.5 3.5 0 0 1 8 0z" fill={fillColor} />
        </svg>
      );
    case "Maghrib":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M6 16a6 6 0 0 1 12 0" fill={fillColor} />
          <path d="M12 6V2M5.3 11.3l3 3M18.7 11.3l-3 3" />
          <path d="M2 19h20M4 22h16" />
        </svg>
      );
    case "Isha":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill={fillColor} />
          <circle cx="18" cy="4" r="0.8" fill="currentColor" />
          <circle cx="7" cy="6" r="0.8" fill="currentColor" />
          <circle cx="16" cy="16" r="0.8" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const headerTitle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "20px",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "white",
};

const hijriStyle: React.CSSProperties = { margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.7)" };


const nextLabel: React.CSSProperties = { margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.7)", fontWeight: "700" };
const nextName: React.CSSProperties  = { margin: "2px 0", fontSize: "15px", fontWeight: "800", color: "white" };
const nextTimer: React.CSSProperties = { margin: 0, fontSize: "12px", color: "#86efac", fontWeight: "600" };

const progressBarOuter: React.CSSProperties = {
  height: "6px",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "3px",
  overflow: "hidden",
  marginBottom: "6px",
};

const progressBarInner: React.CSSProperties = {
  height: "100%",
  backgroundColor: "#86efac",
  borderRadius: "3px",
  transition: "width 0.5s ease",
};

const progressText: React.CSSProperties = { margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: "600" };


const panelTitle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: "14px",
  fontWeight: "800",
  color: "var(--text-main)",
  borderBottom: "1px solid var(--bg-accent)",
  paddingBottom: "8px",
};

const prayerList: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px" };

const prayerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  backgroundColor: "var(--bg-primary)",
  borderRadius: "12px",
  border: "1px solid var(--bg-accent)",
  transition: "all 0.2s ease",
};

const currentRow: React.CSSProperties = {
  border: "1px solid var(--brand)",
  backgroundColor: "var(--brand-light)",
  boxShadow: "0 4px 12px rgba(26,107,74,0.06)",
};

const sunriseRow: React.CSSProperties = { border: "1px dashed var(--bg-accent)" };
const prayerLeft: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px" };
const prayerIcon: React.CSSProperties = { fontSize: "20px", lineHeight: 1 };
const prayerName: React.CSSProperties = { margin: 0, fontWeight: "700", fontSize: "14px" };
const prayerTime: React.CSSProperties = { margin: "2px 0 0", fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" };

const currentBadge: React.CSSProperties = {
  fontSize: "9px",
  backgroundColor: BRAND_COLOR,
  color: "white",
  borderRadius: "4px",
  padding: "1px 5px",
  marginRight: "6px",
  fontWeight: "700",
};

const checkBtn: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  border: "2.5px solid",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  flexShrink: 0,
};

const loadBox: React.CSSProperties   = { display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0" };
const spinnerStyle: React.CSSProperties = {
  width: "28px",
  height: "28px",
  border: "3.5px solid var(--bg-accent)",
  borderTopColor: BRAND_COLOR,
  borderRadius: "50%",
  animation: "spin 1.2s linear infinite",
};

const errorBox: React.CSSProperties = {
  padding: "16px",
  backgroundColor: "rgba(239,68,68,0.06)",
  border: "1px solid rgba(239,68,68,0.15)",
  borderRadius: "12px",
  textAlign: "center",
  color: "#ef4444",
  fontSize: "13px",
};

const retryBtn: React.CSSProperties = {
  marginTop: "10px",
  padding: "6px 16px",
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: "600",
};

// Compass styles
const compassContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "14px",
  padding: "10px 0",
};

const compassWrapper: React.CSSProperties = {
  position: "relative",
  width: "180px",
  height: "180px",
  borderRadius: "50%",
  backgroundColor: "var(--bg-primary)",
  border: "1px solid var(--bg-accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.03)",
};

const compassLabelStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: "800",
  fill: "var(--text-muted)",
};

const qiblaTextContainer: React.CSSProperties = {
  textAlign: "center" as const,
  maxWidth: "260px",
};

const qiblaAngleText: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "14px",
  fontWeight: "800",
  color: BRAND_COLOR,
};

const qiblaTips: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "var(--text-muted)",
  lineHeight: 1.5,
};

// Sound Settings styles
const soundToggleRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "var(--bg-primary)",
  borderRadius: "12px",
  padding: "12px",
  border: "1px solid var(--bg-accent)",
};

const soundToggleLbl: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "var(--text-main)",
};

const soundToggleDesc: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--text-muted)",
  marginTop: "2px",
};

const switchStyle: React.CSSProperties = {
  width: "44px",
  height: "24px",
  borderRadius: "15px",
  border: "none",
  cursor: "pointer",
  position: "relative",
  padding: "2px",
  display: "flex",
  alignItems: "center",
  transition: "background-color 0.25s ease",
};

const switchThumb: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  position: "absolute",
  right: "2px",
  transition: "transform 0.25s ease",
};

const soundOptionsContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "12px",
};

const optionTitle: React.CSSProperties = {
  margin: "0 0 2px",
  fontSize: "12px",
  fontWeight: "700",
  color: "var(--text-muted)",
};

const soundOptionCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: "10px",
  border: "1px solid",
  padding: "10px 12px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const radioCircle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  border: "2px solid var(--bg-accent)",
  backgroundColor: "transparent",
  display: "inline-block",
  flexShrink: 0,
};

const activeRadio: React.CSSProperties = {
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  border: `4.5px solid ${BRAND_COLOR}`,
  backgroundColor: "white",
  display: "inline-block",
  flexShrink: 0,
};

const optionName: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  fontWeight: "700",
  color: "var(--text-main)",
};

const optionDesc: React.CSSProperties = {
  margin: "1px 0 0",
  fontSize: "9px",
  color: "var(--text-muted)",
};

const playPreviewBtn: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--bg-accent)",
  borderRadius: "6px",
  padding: "4px 10px",
  fontSize: "11px",
  fontFamily: "inherit",
  fontWeight: "600",
  color: "var(--text-muted)",
  cursor: "pointer",
  transition: "all 0.2s ease",
};
