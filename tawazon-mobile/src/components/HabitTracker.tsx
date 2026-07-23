import React, { useState } from "react";

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  category: "mental" | "physical" | "learning" | "mindfulness" | "spiritual";
}

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (name: string, category: Habit["category"]) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

const BRAND_COLOR = "#1a6b4a";

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
}) => {
  const [newHabitName, setNewHabitName] = useState("");
  const [category, setCategory] = useState<Habit["category"]>("mental");
  const [showAddForm, setShowAddForm] = useState(false);

  // Active routine filter: "all" | "morning" | "evening"
  const [routineTab, setRoutineTab] = useState<"all" | "morning" | "evening">("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim(), category);
    setNewHabitName("");
    setShowAddForm(false);
  };

  const getCategoryLabel = (cat: Habit["category"]) => {
    switch (cat) {
      case "mental":      return "صحة نفسية";
      case "physical":    return "صحة بدنية";
      case "learning":    return "تطوير وتعلم";
      case "mindfulness": return "تأمل ووعي";
      case "spiritual":   return "روحانيات وعبادات";
      default:            return "";
    }
  };

  const getCategoryColor = (cat: Habit["category"]) => {
    switch (cat) {
      case "mental":      return "var(--color-sage)";
      case "physical":    return "var(--color-terracotta)";
      case "learning":    return "var(--color-sand)";
      case "mindfulness": return "var(--color-meditate)";
      case "spiritual":   return BRAND_COLOR;
      default:            return "var(--text-muted)";
    }
  };

  const getCategoryBg = (cat: Habit["category"]) => {
    switch (cat) {
      case "mental":      return "var(--color-sage-light)";
      case "physical":    return "#faede6";
      case "learning":    return "var(--color-sand-light)";
      case "mindfulness": return "var(--color-meditate-light)";
      case "spiritual":   return "var(--brand-xlight, #f0faf5)";
      default:            return "var(--bg-accent)";
    }
  };

  // Routine filtering logic:
  // Morning routine: spiritual + mindfulness
  // Evening routine: physical + learning + mental
  const filteredHabits = habits.filter((h) => {
    if (routineTab === "morning") {
      return h.category === "spiritual" || h.category === "mindfulness";
    }
    if (routineTab === "evening") {
      return h.category === "physical" || h.category === "learning" || h.category === "mental";
    }
    return true;
  });

  return (
    <div className="card habits-card" style={cardStyle}>
      {/* Title Header */}
      <div style={headerRowStyle}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "15px", fontWeight: "800" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <span>تتبع العادات اليومية</span>
        </h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            ...addBtnStyle,
            backgroundColor: showAddForm ? "var(--color-terracotta)" : "var(--brand-light)",
            color: showAddForm ? "white" : BRAND_COLOR,
          }}
        >
          {showAddForm ? "إلغاء" : "إضافة عادة"}
        </button>
      </div>

      {/* Routine Tabs */}
      <div style={routineTabRow}>
        {(["all", "morning", "evening"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setRoutineTab(tab)}
            style={{
              ...routineTabBtn,
              backgroundColor: routineTab === tab ? BRAND_COLOR : "transparent",
              color: routineTab === tab ? "white" : "var(--text-muted)",
              borderColor: routineTab === tab ? BRAND_COLOR : "var(--bg-accent)",
            }}
          >
            {tab === "all" && "كل العادات"}
            {tab === "morning" && "الروتين الصباحي 🌅"}
            {tab === "evening" && "الروتين المسائي 🌙"}
          </button>
        ))}
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="مثال: شرب الماء، قراءة 10 صفحات..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              style={inputStyle}
              maxLength={60}
              required
            />
          </div>

          <div style={categorySelectContainerStyle}>
            <label style={labelStyle}>تصنيف العادة:</label>
            <div style={categoriesGridStyle}>
              {(["mental", "physical", "learning", "mindfulness", "spiritual"] as Habit["category"][]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    ...categoryOptionStyle,
                    borderColor: category === cat ? getCategoryColor(cat) : "var(--bg-accent)",
                    backgroundColor: category === cat ? getCategoryBg(cat) : "transparent",
                    color: getCategoryColor(cat),
                    fontWeight: category === cat ? "700" : "500",
                  }}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" style={submitBtnStyle}>
            حفظ العادة الجديدة
          </button>
        </form>
      )}

      {/* Habits List */}
      {filteredHabits.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
            {routineTab === "morning" && "لا توجد عادات صباحية مسجلة. أضف عادات بالتصنيف الروحاني أو التأملي."}
            {routineTab === "evening" && "لا توجد عادات مسائية مسجلة. أضف عادات بالتصنيف البدني والتعلم والصحة."}
            {routineTab === "all" && "قائمة عاداتك فارغة حالياً. اضغط على زر 'إضافة عادة' للبدء."}
          </p>
        </div>
      ) : (
        <div style={listStyle}>
          {filteredHabits.map((habit) => (
            <div 
              key={habit.id} 
              style={{
                ...habitItemStyle,
                borderRight: `4px solid ${getCategoryColor(habit.category)}`,
                backgroundColor: habit.completed ? "var(--bg-primary)" : "var(--bg-card)",
                opacity: habit.completed ? 0.75 : 1,
              }}
            >
              <div style={rightSectionStyle}>
                {/* Custom Checkbox */}
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  style={{
                    ...checkboxStyle,
                    borderColor: getCategoryColor(habit.category),
                    backgroundColor: habit.completed ? getCategoryColor(habit.category) : "transparent",
                  }}
                  title={habit.completed ? "إلغاء التحديد" : "تحديد كمكتمل"}
                >
                  {habit.completed && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                
                {/* Text and Badge */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{
                    ...habitNameStyle,
                    textDecoration: habit.completed ? "line-through" : "none",
                    color: habit.completed ? "var(--text-muted)" : "var(--text-main)",
                  }}>
                    {habit.name}
                  </span>
                  <span style={{
                    ...categoryBadgeStyle,
                    color: getCategoryColor(habit.category),
                    backgroundColor: getCategoryBg(habit.category),
                  }}>
                    {getCategoryLabel(habit.category)}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <button 
                onClick={() => onDeleteHabit(habit.id)}
                style={deleteBtnStyle}
                title="حذف العادة"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  backgroundColor: "var(--bg-card)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid var(--bg-accent)",
  boxShadow: "var(--shadow-card)",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const addBtnStyle: React.CSSProperties = {
  border: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: "700",
  padding: "6px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const routineTabRow: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  borderBottom: "1px solid var(--bg-accent)",
  paddingBottom: "8px",
  overflowX: "auto",
};

const routineTabBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "1px solid",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: "700",
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  padding: "14px",
  backgroundColor: "var(--bg-primary)",
  borderRadius: "10px",
  border: "1px solid var(--bg-accent)",
};

const inputContainerStyle: React.CSSProperties = { width: "100%" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--bg-accent)",
  borderRadius: "8px",
  fontFamily: "inherit",
  fontSize: "13px",
  outline: "none",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-main)",
};

const categorySelectContainerStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px" };
const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" };

const categoriesGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "6px",
};

const categoryOptionStyle: React.CSSProperties = {
  border: "1px solid",
  padding: "8px 6px",
  borderRadius: "8px",
  fontFamily: "inherit",
  fontSize: "11px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textAlign: "center",
  backgroundColor: "transparent",
};

const submitBtnStyle: React.CSSProperties = {
  backgroundColor: BRAND_COLOR,
  color: "white",
  border: "none",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: "700",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textAlign: "center",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "24px 16px",
  textAlign: "center",
  border: "1px dashed var(--bg-accent)",
  borderRadius: "10px",
};

const listStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px" };

const habitItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid var(--bg-accent)",
  transition: "all 0.2s ease",
};

const rightSectionStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px" };

const checkboxStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  border: "2px solid",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  outline: "none",
  padding: 0,
};

const habitNameStyle: React.CSSProperties = { fontSize: "14px", fontWeight: "600" };

const categoryBadgeStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "700",
  padding: "1px 6px",
  borderRadius: "6px",
  alignSelf: "flex-start",
};

const deleteBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "6px",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
