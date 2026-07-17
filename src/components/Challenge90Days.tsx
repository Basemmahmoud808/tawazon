import React, { useState, useEffect } from "react";

interface ChallengeData {
  title: string;
  completedDates: string[]; // List of "YYYY-MM-DD"
  lastCompletedDate: string; // "YYYY-MM-DD"
  streak: number;
}

const STORAGE_KEY = "tawazon_90day_challenge";
const BRAND_COLOR = "#1a6b4a";
const GOLD_COLOR  = "#c8963e";

export const Challenge90Days: React.FC = () => {
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const loadData = (): ChallengeData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {
      title: "الالتزام بالرياضة والقراءة اليومية",
      completedDates: [],
      lastCompletedDate: "",
      streak: 0,
    };
  };

  const [challenge, setChallenge] = useState<ChallengeData>(loadData);
  const [editMode, setEditMode] = useState(false);
  const [draftTitle, setDraftTitle] = useState(challenge.title);

  // Pagination for which week to display (Week 1 to Week 13)
  const [activeWeek, setActiveWeek] = useState<number>(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
    
    // Auto-set active week to the one they are currently on
    const currentDay = challenge.completedDates.length + 1;
    const currentWeekIndex = Math.ceil(currentDay / 7);
    setActiveWeek(Math.min(Math.max(currentWeekIndex, 1), 13));
  }, [challenge]);

  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();
  const isCompletedToday = challenge.completedDates.includes(todayStr);

  const handleCheckIn = () => {
    if (isCompletedToday) return;

    let newStreak = challenge.streak;
    if (challenge.lastCompletedDate === yesterdayStr) {
      newStreak += 1;
    } else if (challenge.lastCompletedDate === todayStr) {
      // already done
    } else {
      newStreak = 1;
    }

    const updatedDates = [...challenge.completedDates, todayStr];
    if (updatedDates.length > 90) updatedDates.shift();

    setChallenge({
      ...challenge,
      completedDates: updatedDates,
      lastCompletedDate: todayStr,
      streak: newStreak,
    });
  };

  const handleSaveTitle = () => {
    if (draftTitle.trim() === "") return;
    setChallenge({ ...challenge, title: draftTitle.trim() });
    setEditMode(false);
  };

  const handleResetChallenge = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة ضبط تحدي الـ 90 يوماً بالكامل والبدء من الصفر؟")) {
      setChallenge({
        title: challenge.title,
        completedDates: [],
        lastCompletedDate: "",
        streak: 0,
      });
      setEditMode(false);
      setActiveWeek(1);
    }
  };

  const totalCompleted = challenge.completedDates.length;
  const progressPct = Math.min((totalCompleted / 90) * 100, 100);

  // Week helper logic (each week represents 7 days, Week 13 has 6 days)
  const getDaysForWeek = (weekNum: number) => {
    const startDay = (weekNum - 1) * 7 + 1;
    const endDay = Math.min(weekNum * 7, 90);
    const daysArr = [];
    for (let d = startDay; d <= endDay; d++) {
      daysArr.push(d);
    }
    return daysArr;
  };

  const currentWeekDays = getDaysForWeek(activeWeek);

  return (
    <div className="card" style={cardStyle}>
      {/* Header Row */}
      <div style={headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={iconBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h3 style={titleStyle}>رحلة الـ 90 يوماً</h3>
            <p style={subStyle}>تحدي الالتزام العميق وتطوير الذات</p>
          </div>
        </div>
        <button onClick={() => { setEditMode(!editMode); setDraftTitle(challenge.title); }} style={editBtn} title="تعديل الهدف">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      {editMode ? (
        <div style={editPanel}>
          <label style={labelStyle}>اسم العادة أو الالتزام الذي تود المواظبة عليه:</label>
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            style={inputStyle}
            placeholder="مثال: الاستيقاظ مبكراً والقراءة اليومية"
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button onClick={handleSaveTitle} style={saveBtn}>حفظ التحدي</button>
            <button onClick={handleResetChallenge} style={resetBtn}>إعادة ضبط التحدي</button>
          </div>
        </div>
      ) : (
        <>
          {/* Active Goal Description */}
          <div style={goalBox}>
            <span style={goalTag}>الهدف الحالي للمواظبة:</span>
            <p style={goalText}>{challenge.title}</p>
          </div>

          {/* Stats Panel (Progress Ring & Streaks) */}
          <div style={statsRow}>
            {/* Circular Progress (Apple style) */}
            <div style={circleColumn}>
              <svg width="86" height="86" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="var(--bg-accent)" strokeWidth="8" />
                <circle
                  cx="45" cy="45" r="36"
                  fill="none"
                  stroke="url(#challengeGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPct / 100)}`}
                  transform="rotate(-90 45 45)"
                  style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
                <defs>
                  <linearGradient id="challengeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <text x="45" y="42" textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: "16px", fontWeight: "800", fill: "var(--text-main)", fontFamily: "inherit" }}>
                  {totalCompleted}
                </text>
                <text x="45" y="58" textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: "9px", fontWeight: "600", fill: "var(--text-muted)", fontFamily: "inherit" }}>
                  يوم مكتمل
                </text>
              </svg>
            </div>

            {/* Streak Stats */}
            <div style={streakColumn}>
              <div style={streakMiniCard}>
                <span style={streakIcon}>🔥</span>
                <div>
                  <p style={streakVal}>{challenge.streak} يوم</p>
                  <p style={streakLbl}>المتتالية الحالية</p>
                </div>
              </div>
              <div style={streakMiniCard}>
                <span style={streakIcon}>🏆</span>
                <div>
                  <p style={streakVal}>{Math.round(progressPct)}%</p>
                  <p style={streakLbl}>نسبة التقدم الكلية</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Weekly Pagination Board */}
          <div style={weeklySection}>
            <div style={weeklyHeader}>
              <button
                disabled={activeWeek === 1}
                onClick={() => setActiveWeek(w => Math.max(1, w - 1))}
                style={{ ...weekNavBtn, opacity: activeWeek === 1 ? 0.3 : 1 }}
              >
                ◀
              </button>
              <span style={weekTitle}>الأسبوع {activeWeek} من 13</span>
              <button
                disabled={activeWeek === 13}
                onClick={() => setActiveWeek(w => Math.min(13, w + 1))}
                style={{ ...weekNavBtn, opacity: activeWeek === 13 ? 0.3 : 1 }}
              >
                ▶
              </button>
            </div>

            {/* 7 Days of the Week Grid */}
            <div style={daysGrid}>
              {currentWeekDays.map(dayNum => {
                const isDone = dayNum <= totalCompleted;
                const isTodayPending = dayNum === totalCompleted + 1 && !isCompletedToday;
                const isFuture = dayNum > totalCompleted + 1 || (dayNum === totalCompleted + 1 && isCompletedToday);

                return (
                  <div
                    key={dayNum}
                    onClick={isTodayPending ? handleCheckIn : undefined}
                    style={{
                      ...dayCell,
                      borderColor: isDone 
                        ? BRAND_COLOR 
                        : isTodayPending 
                          ? GOLD_COLOR 
                          : "var(--bg-accent)",
                      backgroundColor: isDone 
                        ? BRAND_COLOR 
                        : isTodayPending 
                          ? "rgba(200, 150, 62, 0.08)" 
                          : "var(--bg-primary)",
                      cursor: isTodayPending ? "pointer" : "default",
                    }}
                    title={isTodayPending ? "اضغط هنا لتسجيل إنجاز اليوم" : `اليوم ${dayNum}`}
                  >
                    <span style={{
                      ...dayNumText,
                      color: isDone ? "white" : isTodayPending ? GOLD_COLOR : "var(--text-muted)",
                    }}>
                      {dayNum}
                    </span>
                    <span style={dayLabelText}>يوم</span>
                    {isDone && (
                      <span style={checkBadge}>✓</span>
                    )}
                    {isTodayPending && (
                      <span style={playBadge}>●</span>
                    )}
                    {isFuture && (
                      <span style={lockBadge}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Check-in Button */}
          {!isCompletedToday && (
            <button onClick={handleCheckIn} style={mainCheckInBtn}>
              تسجيل إنجاز اليوم ({totalCompleted + 1}/90)
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  backgroundColor: "var(--bg-card)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid var(--bg-accent)",
  boxShadow: "var(--shadow-card)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const iconBox: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "linear-gradient(to bottom, #1a6b4a, #22886b)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 3px 8px rgba(26,107,74,0.2)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "800",
  color: "var(--text-main)",
};

const subStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "var(--text-muted)",
};

const editBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--bg-accent)",
  borderRadius: "8px",
  padding: "6px 8px",
  cursor: "pointer",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  transition: "var(--transition)",
};

const editPanel: React.CSSProperties = {
  backgroundColor: "var(--bg-primary)",
  borderRadius: "10px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "var(--text-muted)",
};

const inputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid var(--bg-accent)",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-main)",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
};

const saveBtn: React.CSSProperties = {
  backgroundColor: BRAND_COLOR,
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: "700",
};

const resetBtn: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "var(--color-terracotta, #b8654a)",
  border: "1px solid var(--bg-accent)",
  borderRadius: "8px",
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: "600",
};

const goalBox: React.CSSProperties = {
  backgroundColor: "var(--bg-accent)",
  borderRadius: "10px",
  padding: "10px 14px",
  borderLeft: `4px solid ${BRAND_COLOR}`,
};

const goalTag: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  color: BRAND_COLOR,
  display: "block",
  marginBottom: "2px",
};

const goalText: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  fontWeight: "700",
  color: "var(--text-main)",
  lineHeight: 1.4,
};

const statsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const circleColumn: React.CSSProperties = {
  flexShrink: 0,
};

const streakColumn: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const streakMiniCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  backgroundColor: "var(--bg-primary)",
  borderRadius: "10px",
  padding: "8px 12px",
};

const streakIcon: React.CSSProperties = {
  fontSize: "16px",
};

const streakVal: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "800",
  color: "var(--text-main)",
};

const streakLbl: React.CSSProperties = {
  margin: 0,
  fontSize: "10px",
  color: "var(--text-muted)",
  fontWeight: "600",
};

const weeklySection: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const weeklyHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 4px",
};

const weekNavBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "12px",
  color: "var(--text-muted)",
  padding: "4px 8px",
};

const weekTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  color: "var(--text-main)",
};

const daysGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "6px",
};

const dayCell: React.CSSProperties = {
  aspectRatio: "0.8/1",
  borderRadius: "10px",
  border: "1px solid",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  padding: "8px 0",
  transition: "all 0.25s ease",
};

const dayNumText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "800",
};

const dayLabelText: React.CSSProperties = {
  fontSize: "8px",
  color: "var(--text-muted)",
  fontWeight: "500",
  marginTop: "-2px",
};

const checkBadge: React.CSSProperties = {
  position: "absolute",
  bottom: "2px",
  fontSize: "8px",
  color: "white",
  fontWeight: "bold",
};

const playBadge: React.CSSProperties = {
  position: "absolute",
  bottom: "2px",
  fontSize: "8px",
  color: GOLD_COLOR,
  animation: "pulse 1.5s infinite",
};

const lockBadge: React.CSSProperties = {
  position: "absolute",
  bottom: "3px",
  color: "var(--text-muted)",
  opacity: 0.5,
};

const mainCheckInBtn: React.CSSProperties = {
  width: "100%",
  padding: "11px",
  border: "none",
  borderRadius: "10px",
  backgroundColor: BRAND_COLOR,
  color: "white",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(26,107,74,0.2)",
  transition: "all 0.2s ease",
};
