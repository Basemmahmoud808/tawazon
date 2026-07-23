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

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({ logs }) => {
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

  // Helper to fetch prayer history data ONLY when user starts saving/marking prayers
  const getPrayerHistoryData = () => {
    let history: Record<string, any> = {};
    try {
      const stored = localStorage.getItem("tawazon_prayers_history");
      if (stored) history = JSON.parse(stored);
    } catch {}

    // Include today's saved/marked prayers if any exist
    try {
      const todayData = localStorage.getItem("tawazon_prayers");
      if (todayData) {
        const parsed = JSON.parse(todayData);
        if (parsed.date && parsed.prayers && parsed.prayers.some((p: any) => p.done)) {
          if (!history[parsed.date]) {
            history[parsed.date] = { prayers: parsed.prayers };
          } else {
            history[parsed.date].prayers = parsed.prayers;
          }
        }
      }
    } catch {}

    const list = [];
    const historyDates = Object.keys(history);
    for (const rawDate of historyDates) {
      const entry = history[rawDate];
      if (!entry || !entry.prayers) continue;

      const d = new Date(rawDate);
      const isToday = rawDate === new Date().toDateString();
      const dayName = isNaN(d.getTime()) ? "" : d.toLocaleDateString("ar-EG", { weekday: "long" });
      const fullDate = isNaN(d.getTime()) ? rawDate : d.toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });

      const filtered = entry.prayers.filter((p: any) => p.arabicName !== "الشروق");
      const completedCount = filtered.filter((p: any) => p.done).length;

      list.push({
        rawDate,
        dayName,
        fullDate,
        isToday,
        prayers: filtered,
        completedCount,
        timestamp: isNaN(d.getTime()) ? 0 : d.getTime(),
      });
    }

    // Sort descending (newest dates first)
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  };

  const heatmapDays = getHeatmapData();
  const prayerHistoryDays = getPrayerHistoryData();

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

      {/* ── Prayer Commitment Chart Card (مخطط الالتزام بالصلاة بالأيام والتاريخ) ── */}
      <div className="card" style={{ ...gardenCardStyle, padding: "20px", marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={statsTitleStyle}>🕌 مخطط الالتزام بالصلاة (بالأيام والتاريخ)</h3>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
              جدول متابعة أداء الصلوات الخمس بالأيام والتواريخ
            </p>
          </div>
        </div>

        {prayerHistoryDays.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "24px 16px",
            backgroundColor: "var(--bg-primary)",
            borderRadius: "14px",
            border: "1px dashed var(--bg-accent)"
          }}>
            <span style={{ fontSize: "32px" }}>🕌</span>
            <p style={{ margin: "8px 0 4px", fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
              لا توجد سجلات صلاة محفوظة بعد
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.6" }}>
              انتقل إلى قسم الصلوات وقم بتحديد وحفظ صلوات اليوم ليبدأ مخطط التزامك بالظهور هنا بالأيام والتواريخ.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {prayerHistoryDays.map((day, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  backgroundColor: day.isToday ? "var(--brand-xlight, #f0faf5)" : "var(--bg-primary)",
                  border: day.isToday ? "1px solid var(--brand)" : "1px solid var(--bg-accent)",
                  flexWrap: "wrap",
                  gap: "8px"
                }}
              >
                {/* Day & Date info */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--brand)" }}>
                    {day.dayName}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    ({day.fullDate})
                  </span>
                  {day.isToday && (
                    <span style={{ fontSize: "10px", backgroundColor: BRAND_COLOR, color: "white", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                      اليوم
                    </span>
                  )}
                </div>

                {/* 5 Prayers checklist badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {day.prayers.map((p: any, pIdx: number) => (
                    <div
                      key={pIdx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor: p.done ? "var(--brand-light, #e6f4ed)" : "var(--bg-accent)",
                        color: p.done ? BRAND_COLOR : "var(--text-muted)",
                        border: p.done ? "1px solid rgba(26,107,74,0.2)" : "1px solid transparent"
                      }}
                    >
                      <span>{p.done ? "✓" : "○"}</span>
                      <span>{p.arabicName}</span>
                    </div>
                  ))}

                  <span style={{ fontSize: "12px", fontWeight: "800", color: day.completedCount === 5 ? BRAND_COLOR : "var(--text-main)", marginRight: "6px" }}>
                    {day.completedCount}/5
                  </span>
                </div>
              </div>
            ))}
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

              return (
                <div key={log.id} style={timelineItemStyle}>
                  
                  {/* Left timeline indicator */}
                  <div style={{
                    ...timelineIndicatorStyle,
                    backgroundColor: "var(--brand)",
                    color: "white"
                  }}>
                    🌿
                  </div>

                  {/* Daily Log Card content */}
                  <div style={logCardStyle}>
                    
                    {/* Date header */}
                    <div style={logHeaderStyle}>
                      <span style={logDateStyle}>{log.dateString}</span>
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

const statsTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "15px",
  fontWeight: "800",
  color: "var(--text-main)",
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
