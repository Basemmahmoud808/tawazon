import React, { useState, useEffect, useRef } from "react";

type BreathPhase = "inhale" | "holdIn" | "exhale" | "holdOut";
type ExerciseType = "box" | "sleep" | "coherent";

interface PhaseConfig {
  phase: BreathPhase;
  duration: number;
  title: string;
  description: string;
  color: string;
  scale: number;
}

const EXERCISE_CONFIGS: Record<ExerciseType, PhaseConfig[]> = {
  box: [
    { phase: "inhale", duration: 4, title: "شهـيق", description: "خذ نفساً عميقاً... املأ رئتيك بالهدوء", color: "var(--color-meditate)", scale: 1.3 },
    { phase: "holdIn", duration: 4, title: "احبس النفس", description: "احتفظ بالهواء في الداخل... استشعر السكينة", color: "var(--color-sage)", scale: 1.3 },
    { phase: "exhale", duration: 4, title: "زفـير", description: "أخرج النفس ببطء... تخلص من كل التوتر", color: "var(--color-terracotta)", scale: 0.9 },
    { phase: "holdOut", duration: 4, title: "احبس النفس", description: "انتظر قليلاً قبل الشهيق التالي... استرخِ", color: "var(--color-sand)", scale: 0.9 },
  ],
  sleep: [
    { phase: "inhale", duration: 4, title: "شهـيق هادئ", description: "تنفس ببطء من أنفك لمدة 4 ثوانٍ", color: "var(--color-meditate)", scale: 1.3 },
    { phase: "holdIn", duration: 7, title: "احبس النفس", description: "احتفظ بالنفس لمدة 7 ثوانٍ لتهدئة ضربات قلبك", color: "var(--color-sage)", scale: 1.3 },
    { phase: "exhale", duration: 8, title: "زفـير طويل", description: "أخرج زفيراً مسموعاً ببطء شديد لمدة 8 ثوانٍ", color: "var(--color-terracotta)", scale: 0.8 },
  ],
  coherent: [
    { phase: "inhale", duration: 5, title: "شهـيق ناعم", description: "تنفس بنعومة وعمق لمدة 5 ثوانٍ", color: "var(--color-meditate)", scale: 1.25 },
    { phase: "exhale", duration: 5, title: "زفـير متزن", description: "أخرج زفيراً هادئاً متزناً لمدة 5 ثوانٍ", color: "var(--color-sage)", scale: 0.95 },
  ]
};

export const Breathing: React.FC = () => {
  const [exercise, setExercise] = useState<ExerciseType>("box");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const timerRef = useRef<any | null>(null);

  const configs = EXERCISE_CONFIGS[exercise];
  const currentConfig = configs[phaseIndex];

  // Adjust timing on exercise change
  useEffect(() => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsLeft(EXERCISE_CONFIGS[exercise][0].duration);
  }, [exercise]);

  // Exercise loop
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to the next phase index
            setPhaseIndex((currIdx) => {
              const nextIdx = (currIdx + 1) % configs.length;
              setSecondsLeft(configs[nextIdx].duration);
              return nextIdx;
            });
            return 4; // Temporary value, will be immediately overwritten by state update
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setPhaseIndex(0);
      setSecondsLeft(configs[0].duration);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, exercise, configs]);

  const toggleExercise = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="card breathing-card" style={cardContainerStyle}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-meditate)" }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        </svg>
        تمارين التنفس والاسترخاء
      </h3>
      
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
        تساعد تمارين التنفس على التحكم في القلق وتحسين التركيز والمساعدة على النوم العميق فوراً.
      </p>

      {/* Select Exercise Type Dropdown */}
      <div style={selectorContainerStyle}>
        <label style={selectorLabelStyle}>اختر نوع تمرين التنفس:</label>
        <select 
          value={exercise} 
          onChange={(e) => setExercise(e.target.value as ExerciseType)}
          style={selectStyle}
          disabled={isActive}
        >
          <option value="box">تمرين التنفس المربع (التخلص من التوتر العام)</option>
          <option value="sleep">تمرين 4-7-8 (للاسترخاء العميق والمساعدة على النوم)</option>
          <option value="coherent">تمرين التنفس المتناغم 5-5 (لتوازن ضربات القلب والسكينة)</option>
        </select>
      </div>

      <div style={exerciseWrapperStyle}>
        {/* Breathing Circle Container */}
        <div style={circleContainerStyle}>
          {/* Inner pulsating bubble */}
          <div 
            style={{
              ...bubbleStyle,
              backgroundColor: currentConfig.color,
              transform: `scale(${isActive ? currentConfig.scale : 1.0})`,
              boxShadow: `0 10px 40px ${currentConfig.color}33`,
            }}
          >
            <div style={timerTextStyle}>
              {isActive ? secondsLeft : "جاهز"}
            </div>
          </div>
          {/* Phase Label Ring indicator */}
          {isActive && (
            <div style={{ ...phaseLabelStyle, color: currentConfig.color }}>
              {currentConfig.title}
            </div>
          )}
        </div>

        {/* Text Guidance */}
        <div style={guidanceTextStyle}>
          <h4 style={{ color: currentConfig.color, transition: "var(--transition-normal)", fontSize: "18px", fontWeight: "700" }}>
            {isActive ? currentConfig.title : "اضغط على ابدأ للبدء في التمرين"}
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", minHeight: "44px", maxWidth: "340px", margin: "8px auto 0", lineHeight: "1.5" }}>
            {isActive ? currentConfig.description : "قم بتهيئة جلستك بشكل مريح واستعد للتنفس مع الدائرة المتحركة."}
          </p>
        </div>

        {/* Controls */}
        <button 
          onClick={toggleExercise}
          style={{
            ...btnStyle,
            backgroundColor: isActive ? "var(--color-terracotta)" : "var(--color-meditate)",
          }}
        >
          {isActive ? "إيقاف التمرين" : "ابدأ التمرين الآن"}
        </button>
      </div>
    </div>
  );
};

// Styles
const cardContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const selectorContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginBottom: "20px",
};

const selectorLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "bold",
  color: "var(--text-muted)",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--bg-accent)",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-main)",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  cursor: "pointer",
  transition: "var(--transition-normal)",
};

const exerciseWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 0",
};

const circleContainerStyle: React.CSSProperties = {
  position: "relative",
  width: "200px",
  height: "200px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px",
};

const bubbleStyle: React.CSSProperties = {
  width: "120px",
  height: "120px",
  borderRadius: "var(--radius-round)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 4s cubic-bezier(0.4, 0, 0.2, 1), background-color 1.2s ease, box-shadow 1.2s ease",
  position: "relative",
  zIndex: 2,
};

const timerTextStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "var(--text-light)",
  fontFamily: "inherit",
};

const phaseLabelStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "0px",
  fontSize: "14px",
  fontWeight: "bold",
  backgroundColor: "var(--bg-accent)",
  padding: "4px 14px",
  borderRadius: "var(--radius-sm)",
  zIndex: 3,
  transition: "color 1s ease",
};

const guidanceTextStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const btnStyle: React.CSSProperties = {
  border: "none",
  color: "var(--text-light)",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: "bold",
  padding: "12px 28px",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
  transition: "var(--transition-normal)",
  outline: "none",
};
