import React from "react";

export interface DailyLog {
  id: string;
  dateString: string;
  rawDate: string; // JavaScript toDateString()
  mood?: "energetic" | "happy" | "calm" | "tired" | "anxious";
  note?: string;
  completedHabits: string[];
  totalHabits: number;
}

interface HistoryArchiveProps {
  logs: DailyLog[];
}

const BRAND_COLOR = "#1a6b4a";

// Consistent Vector Emotion Icons
const MoodIcon: React.FC<{ type?: "energetic" | "happy" | "calm" | "tired" | "anxious"; size?: number }> = ({ type, size = 24 }) => {
  if (!type) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="13" />
        <circle cx="12" cy="14" r="1" fill="currentColor" />
        <circle cx="20" cy="14" r="1" fill="currentColor" />
        <path d="M12 21a4 4 0 0 1 8 0" />
      </svg>
    );
  }

  switch (type) {
    case "energetic":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="13" />
          <path d="M10 13a2.5 2.5 0 0 1 4 0M18 13a2.5 2.5 0 0 1 4 0" />
          <path d="M11 20c2 3 8 3 10 0" fill="currentColor" />
        </svg>
      );
    case "happy":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="13" />
          <path d="M9 16q3-3 6 0M17 16q3-3 6 0" />
          <path d="M12 20q4 3 8 0" />
        </svg>
      );
    case "calm":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="13" />
          <line x1="10" y1="15" x2="13" y2="15" />
          <line x1="19" y1="15" x2="22" y2="15" />
          <line x1="13" y1="21" x2="19" y2="21" />
        </svg>
      );
    case "tired":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="13" />
          <path d="M10 13l3 2M22 13l-3 2" />
          <circle cx="16" cy="21" r="2.5" fill="currentColor" />
        </svg>
      );
    case "anxious":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="13" />
          <path d="M10 15a2 2 0 0 1 4 0M18 15a2 2 0 0 1 4 0" />
          <path d="M11 21a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2" />
        </svg>
      );
    default:
      return null;
  }
};

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({ logs }) => {
  const getMoodLabel = (type?: DailyLog["mood"]) => {
    if (!type) return "غير مسجل";
    switch (type) {
      case "energetic": return "نشيط";
      case "happy": return "سعيد";
      case "calm": return "هادئ";
      case "tired": return "متعب";
      case "anxious": return "قلق";
      default: return "";
    }
  };

  const getMoodColor = (type?: DailyLog["mood"]) => {
    if (!type) return "var(--text-muted)";
    switch (type) {
      case "energetic": return "var(--color-sand)";
      case "happy": return "var(--color-sage)";
      case "calm": return "var(--color-meditate)";
      case "tired": return "var(--text-muted)";
      case "anxious": return "var(--color-terracotta)";
      default: return "var(--text-muted)";
    }
  };

  // Generate 12-week Heatmap Grid data (84 days)
  const getHeatmapData = () => {
    const data = [];
    const totalDays = 84; // 12 weeks * 7 days
    
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const rawDate = date.toDateString();
      
      const log = logs.find((l) => l.rawDate === rawDate);
      const ratio = log && log.totalHabits > 0 ? log.completedHabits.length / log.totalHabits : 0;
      
      data.push({
        date,
        rawDate,
        ratio,
        completed: log ? log.completedHabits.length : 0,
        total: log ? log.totalHabits : 0,
      });
    }
    return data;
  };

  const heatmapDays = getHeatmapData();

  // Mood statistics calculation
  const totalLogs = logs.filter(l => l.mood).length;
  const moodCounts = { energetic: 0, happy: 0, calm: 0, tired: 0, anxious: 0 };
  logs.forEach(l => {
    if (l.mood && l.mood in moodCounts) {
      moodCounts[l.mood]++;
    }
  });

  return (
    <div style={archiveLayoutWrapperStyle}>
      

      {/* ── GitHub-Style Habit Heatmap (12 Weeks) ── */}
      <div className="card" style={{ ...gardenCardStyle, padding: "20px" }}>
        <h3 style={statsTitleStyle}>مخطط الالتزام بالعادات (الـ 12 أسبوعاً الماضية)</h3>
        <p style={{ margin: "0 0 16px", fontSize: "11px", color: "var(--text-muted)" }}>
          كثافة اللون الأخضر تدل على مدى نسبة إنجاز عاداتك اليومية
        </p>

        <div style={heatmapGridWrapper}>
          <div style={heatmapGrid}>
            {heatmapDays.map((day, idx) => {
              // Calculate green level based on ratio
              let color = "var(--bg-accent)"; // 0%
              if (day.total > 0) {
                if (day.ratio === 0) color = "rgba(26,107,74,0.06)";
                else if (day.ratio <= 0.35) color = "rgba(26,107,74,0.25)";
                else if (day.ratio <= 0.7) color = "rgba(26,107,74,0.6)";
                else color = BRAND_COLOR; // 100%
              }

              // Simple date formatter
              const formattedDate = day.date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
              const tooltipText = `${formattedDate} • إنجاز ${day.completed} من ${day.total} عادات`;

              return (
                <div
                  key={idx}
                  title={tooltipText}
                  style={{
                    ...heatmapSquare,
                    backgroundColor: color,
                    border: day.ratio === 1 ? "1px solid rgba(26,107,74,0.25)" : "1px solid transparent"
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Heatmap Legend */}
        <div style={legendRow}>
          <span style={legendText}>التزام أقل</span>
          <div style={{ ...heatmapSquare, backgroundColor: "var(--bg-accent)" }} />
          <div style={{ ...heatmapSquare, backgroundColor: "rgba(26,107,74,0.25)" }} />
          <div style={{ ...heatmapSquare, backgroundColor: "rgba(26,107,74,0.6)" }} />
          <div style={{ ...heatmapSquare, backgroundColor: BRAND_COLOR }} />
          <span style={legendText}>التزام كامل</span>
        </div>
      </div>

      {/* ── Mood Statistics ── */}
      <div className="card" style={statsCardStyle}>
        <h3 style={statsTitleStyle}>تحليل الحالة المزاجية</h3>
        
        {totalLogs === 0 ? (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
            لا توجد إحصائيات كافية للمزاج حالياً. قم بتسجيل مزاجك اليومي في الصفحة الرئيسية.
          </p>
        ) : (
          <div style={chartContainerStyle}>
            {(["happy", "energetic", "calm", "tired", "anxious"] as const).map((m) => {
              const count = moodCounts[m];
              const pct = totalLogs > 0 ? (count / totalLogs) * 100 : 0;
              const color = getMoodColor(m);

              return (
                <div key={m} style={chartRowStyle}>
                  <span style={chartLabelStyle}>
                    <MoodIcon type={m} size={16} />
                    <span style={{ marginRight: "6px", fontSize: "12px", fontWeight: "700" }}>{getMoodLabel(m)}</span>
                  </span>
                  <div style={chartTrackStyle}>
                    <div style={{ ...chartFillStyle, width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span style={chartValueStyle}>
                    {count} مرات ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detailed Timeline Logs ── */}
      <div style={{ marginTop: "8px" }}>
        <h3 style={statsTitleStyle}>الأيام والسجلات السابقة</h3>
        
        {logs.length === 0 ? (
          <div style={emptyStateStyle}>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
              سجل التواريخ فارغ حالياً. العادات والمذكرات التي تكملها ستظهر هنا تلقائياً يوماً بعد يوم.
            </p>
          </div>
        ) : (
          <div style={timelineWrapperStyle}>
            {logs.map((log) => {
              // Calculate completion percentage
              const pct = log.totalHabits > 0 ? (log.completedHabits.length / log.totalHabits) * 100 : 0;
              const hasMood = !!log.mood;
              const moodCol = getMoodColor(log.mood);

              return (
                <div key={log.id} style={timelineItemStyle}>
                  
                  {/* Left timeline indicator */}
                  <div style={{
                    ...timelineIndicatorStyle,
                    backgroundColor: hasMood ? moodCol : "var(--bg-accent)",
                    color: hasMood ? "white" : "var(--text-muted)"
                  }}>
                    <MoodIcon type={log.mood} size={16} />
                  </div>

                  {/* Daily Log Card content */}
                  <div style={logCardStyle}>
                    
                    {/* Date and mood badge header */}
                    <div style={logHeaderStyle}>
                      <span style={logDateStyle}>{log.dateString}</span>
                      {hasMood && (
                        <span style={{
                          ...moodBadgeStyle,
                          borderColor: moodCol + "40",
                          color: moodCol,
                          backgroundColor: moodCol + "08",
                        }}>
                          المزاج: {getMoodLabel(log.mood)}
                        </span>
                      )}
                    </div>

                    {/* Habits section */}
                    <div style={habitsContainerStyle}>
                      <div style={habitsSummaryStyle}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                          العادات المكتملة: {log.completedHabits.length} من {log.totalHabits}
                        </p>
                        <div style={miniBarBgStyle}>
                          <div style={{ ...miniBarFillStyle, width: `${pct}%`, backgroundColor: pct === 100 ? BRAND_COLOR : "var(--color-sage)" }} />
                        </div>
                      </div>

                      {log.completedHabits.length > 0 ? (
                        <div style={habitsListStyle}>
                          {log.completedHabits.map((habitName, hIdx) => (
                            <span key={hIdx} style={habitBadgeStyle}>
                              {habitName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                          لم يتم إكمال أي عادات في هذا اليوم.
                        </p>
                      )}
                    </div>

                    {/* Journal note section */}
                    {log.note ? (
                      <div style={noteContainerStyle}>
                        <span style={quoteSymbolStyle}>“</span>
                        <p style={noteTextStyle}>{log.note}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "12px", borderTop: "1px solid var(--bg-accent)", paddingTop: "12px", marginBottom: 0 }}>
                        لا توجد ملاحظات أو مذكرات مسجلة لهذا اليوم.
                      </p>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const archiveLayoutWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  width: "100%"
};

const gardenCardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--bg-accent)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
};

const statsCardStyle: React.CSSProperties = {
  padding: "20px",
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--bg-accent)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
};

const statsTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "15px",
  fontWeight: "800",
  color: "var(--text-main)",
};

const chartContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "16px",
};

const chartRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const chartLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "80px",
  flexShrink: 0,
};

const chartTrackStyle: React.CSSProperties = {
  flex: 1,
  height: "8px",
  backgroundColor: "var(--bg-accent)",
  borderRadius: "4px",
  overflow: "hidden",
  position: "relative",
};

const chartFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "4px",
  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
};

const chartValueStyle: React.CSSProperties = {
  fontSize: "12px",
  width: "85px",
  textAlign: "left",
  flexShrink: 0,
  fontWeight: "600",
  color: "var(--text-muted)",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "48px 24px",
  textAlign: "center",
  border: "2px dashed var(--bg-accent)",
  borderRadius: "12px",
  backgroundColor: "var(--bg-card)",
};

const timelineWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  position: "relative",
  paddingRight: "20px",
  borderRight: "2.5px solid var(--bg-accent)",
  marginTop: "16px",
};

const timelineItemStyle: React.CSSProperties = {
  display: "flex",
  position: "relative",
  alignItems: "flex-start",
  width: "100%",
};

const timelineIndicatorStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  right: "-39px",
  top: "8px",
  border: "4px solid var(--bg-primary)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  zIndex: 2,
};

const logCardStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--bg-accent)",
  borderRadius: "12px",
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxShadow: "var(--shadow-xs)",
};

const logHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
  borderBottom: "1px solid var(--bg-accent)",
  paddingBottom: "10px",
};

const logDateStyle: React.CSSProperties = {
  fontWeight: "800",
  fontSize: "14px",
  color: "var(--text-main)",
};

const moodBadgeStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  padding: "2px 8px",
  borderRadius: "8px",
  border: "1px solid",
};

const habitsContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const habitsSummaryStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const miniBarBgStyle: React.CSSProperties = {
  width: "120px",
  height: "5px",
  backgroundColor: "var(--bg-accent)",
  borderRadius: "3px",
  overflow: "hidden",
};

const miniBarFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "3px",
  transition: "width 0.5s ease",
};

const habitsListStyle: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  marginTop: "4px",
};

const habitBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontSize: "11px",
  backgroundColor: "var(--brand-xlight, #f0faf5)",
  color: BRAND_COLOR,
  padding: "2px 8px",
  borderRadius: "8px",
  fontWeight: "600",
  border: "1px solid rgba(26,107,74,0.12)",
};

const noteContainerStyle: React.CSSProperties = {
  position: "relative",
  backgroundColor: "var(--bg-primary)",
  borderRight: "3px solid var(--color-terracotta)",
  padding: "12px 16px 12px 12px",
  borderRadius: "8px",
  marginTop: "8px",
};

const quoteSymbolStyle: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "0px",
  fontSize: "24px",
  color: "var(--color-terracotta)",
  opacity: 0.3,
  fontFamily: "serif",
};

const noteTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-main)",
  fontStyle: "italic",
  margin: 0,
  lineHeight: "1.6",
};

// Heatmap styles
const heatmapGridWrapper: React.CSSProperties = {
  width: "100%",
  overflowX: "auto" as const,
  paddingBottom: "8px",
};

const heatmapGrid: React.CSSProperties = {
  display: "grid",
  gridAutoFlow: "column" as const,
  gridTemplateRows: "repeat(7, 1fr)",
  gap: "3.5px",
  minWidth: "660px",
};

const heatmapSquare: React.CSSProperties = {
  width: "11px",
  height: "11px",
  borderRadius: "2px",
  transition: "all 0.2s ease",
  cursor: "pointer",
};

const legendRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  justifyContent: "flex-end",
  marginTop: "12px",
};

const legendText: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--text-muted)",
  fontWeight: "600",
};
