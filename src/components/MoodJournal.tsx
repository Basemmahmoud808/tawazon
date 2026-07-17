import React, { useState, useRef } from "react";

export interface JournalEntry {
  id: string;
  date: string;
  mood: "energetic" | "happy" | "calm" | "tired" | "anxious";
  note: string;
  imageUrl?: string; // base64 image attached to this entry
}

interface MoodJournalProps {
  entries: JournalEntry[];
  onAddEntry: (mood: JournalEntry["mood"], note: string, imageUrl?: string) => void;
}

// ─── Mood SVG Icons ───────────────────────────────────────────────────────────
const MoodIcon: React.FC<{ type: JournalEntry["mood"]; size?: number }> = ({ type, size = 24 }) => {
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
          <path d="M11 20q5 4 10 0" />
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

// ─── Component ────────────────────────────────────────────────────────────────
export const MoodJournal: React.FC<MoodJournalProps> = ({ entries, onAddEntry }) => {
  const [selectedMood, setSelectedMood] = useState<JournalEntry["mood"]>("calm");
  const [note, setNote] = useState("");
  const [isSavedToday, setIsSavedToday] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moods = [
    { type: "energetic", label: "متحمس",  color: "var(--color-sand)" },
    { type: "happy",     label: "سعيد",   color: "var(--color-sage)" },
    { type: "calm",      label: "هادئ",   color: "var(--color-meditate)" },
    { type: "tired",     label: "متعب",   color: "var(--text-muted)" },
    { type: "anxious",   label: "قلق",    color: "var(--color-terracotta)" },
  ] as const;

  // ── Image picker ─────────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reject files larger than 2MB to keep localStorage manageable
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 2 ميجابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;
    onAddEntry(selectedMood, note, imagePreview ?? undefined);
    setNote("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSavedToday(true);
    setTimeout(() => setIsSavedToday(false), 3000);
  };

  const getMoodLabel = (type: JournalEntry["mood"]) =>
    moods.find((m) => m.type === type)?.label || "هادئ";

  const getMoodColor = (type: JournalEntry["mood"]) =>
    moods.find((m) => m.type === type)?.color || "var(--color-meditate)";

  return (
    <div className="card mood-journal-card" style={containerStyle}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-terracotta)" }}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        المزاج واليوميات
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
        عبّر عن مشاعرك الحالية واكتب تأملاتك اليومية وأرفق صورة تعبّر عن يومك.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        {/* Mood Selector */}
        <div style={moodSelectorGridStyle}>
          {moods.map((m) => (
            <button
              key={m.type}
              type="button"
              onClick={() => setSelectedMood(m.type)}
              style={{
                ...moodBtnStyle,
                backgroundColor: selectedMood === m.type ? "var(--bg-accent)" : "transparent",
                borderColor:     selectedMood === m.type ? m.color : "transparent",
                color:           selectedMood === m.type ? m.color : "var(--text-muted)",
              }}
            >
              <span style={emojiStyle} className="emoji-accent">
                <MoodIcon type={m.type} size={28} />
              </span>
              <span style={{ ...moodLabelStyle, color: selectedMood === m.type ? "var(--text-main)" : "var(--text-muted)" }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Note textarea */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={labelStyle}>تأملاتك لليوم (امتنان، فكرة، أو شعور):</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="أنا ممتن لـ... اليوم أشعر بـ..."
            style={textareaStyle}
            maxLength={300}
          />
        </div>

        {/* Image Attachment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={labelStyle}>إرفاق صورة (اختياري):</label>

          {imagePreview ? (
            <div style={imagePreviewWrapper}>
              <img src={imagePreview} alt="preview" style={imagePreviewStyle} />
              <button type="button" onClick={handleRemoveImage} style={removeImageBtn} title="إزالة الصورة">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={imagePickerBtn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span>اختر صورة من جهازك</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Submit */}
        <button type="submit" style={submitBtnStyle}>
          {isSavedToday ? "تم الحفظ بنجاح! 🌿" : "حفظ المذكرات والمزاج"}
        </button>
      </form>

      {/* History Timeline */}
      {entries.length > 0 && (
        <div style={historyContainerStyle}>
          <h4 style={historyTitleStyle}>تاريخ المزاج والتأملات السابقة</h4>
          <div style={timelineStyle}>
            {entries.slice(-3).reverse().map((entry) => (
              <div key={entry.id} style={timelineItemStyle}>
                <div style={{ ...timelineIndicatorStyle, backgroundColor: getMoodColor(entry.mood), color: "white" }}>
                  <MoodIcon type={entry.mood} size={18} />
                </div>
                <div style={timelineContentStyle}>
                  <div style={timelineHeaderStyle}>
                    <span style={timelineMoodLabelStyle}>{getMoodLabel(entry.mood)}</span>
                    <span style={timelineDateStyle}>{entry.date}</span>
                  </div>
                  {entry.note && <p style={timelineNoteStyle}>{entry.note}</p>}
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt="مرفق"
                      style={timelineImageStyle}
                      onClick={() => window.open(entry.imageUrl, "_blank")}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = { display: "flex", flexDirection: "column" };

const formStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "16px" };

const moodSelectorGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "8px",
  marginBottom: "8px",
};

const moodBtnStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
  padding: "10px 4px", border: "1px solid", borderRadius: "var(--radius-sm)",
  cursor: "pointer", transition: "var(--transition-normal)", fontFamily: "inherit",
};

const emojiStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center" };
const moodLabelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: "500" };

const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)" };

const textareaStyle: React.CSSProperties = {
  width: "100%", minHeight: "80px", maxHeight: "150px",
  padding: "12px", border: "1px solid var(--bg-accent)",
  borderRadius: "var(--radius-sm)", fontFamily: "inherit",
  fontSize: "14px", outline: "none", resize: "vertical",
  transition: "var(--transition-normal)", backgroundColor: "var(--bg-primary)",
};

const imagePickerBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  padding: "12px", border: "2px dashed var(--bg-accent)",
  borderRadius: "var(--radius-sm)", backgroundColor: "transparent",
  color: "var(--text-muted)", fontSize: "14px", fontFamily: "inherit",
  cursor: "pointer", transition: "var(--transition-normal)",
  width: "100%",
};

const imagePreviewWrapper: React.CSSProperties = {
  position: "relative", display: "inline-block",
  borderRadius: "var(--radius-sm)", overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const imagePreviewStyle: React.CSSProperties = {
  width: "100%", maxHeight: "200px",
  objectFit: "cover", display: "block",
  borderRadius: "var(--radius-sm)",
};

const removeImageBtn: React.CSSProperties = {
  position: "absolute", top: "8px", left: "8px",
  width: "28px", height: "28px",
  backgroundColor: "rgba(0,0,0,0.6)", color: "white",
  border: "none", borderRadius: "50%", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const submitBtnStyle: React.CSSProperties = {
  backgroundColor: "var(--color-terracotta)", color: "var(--text-light)",
  border: "none", fontFamily: "inherit", fontSize: "14px",
  fontWeight: "bold", padding: "12px", borderRadius: "var(--radius-sm)",
  cursor: "pointer", transition: "var(--transition-normal)",
  textAlign: "center", boxShadow: "0 4px 12px rgba(204, 160, 135, 0.15)",
};

const historyContainerStyle: React.CSSProperties = {
  marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--bg-accent)",
};

const historyTitleStyle: React.CSSProperties = {
  fontSize: "14px", color: "var(--text-main)", marginBottom: "16px", fontWeight: "bold",
};

const timelineStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "16px",
  position: "relative", paddingRight: "16px",
  borderRight: "2px solid var(--bg-accent)",
};

const timelineItemStyle: React.CSSProperties = {
  display: "flex", gap: "12px", position: "relative", alignItems: "flex-start",
};

const timelineIndicatorStyle: React.CSSProperties = {
  width: "32px", height: "32px", borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  position: "absolute", right: "-33px", top: "0px",
  border: "2px solid var(--bg-primary)",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  transition: "background-color 0.4s ease, border-color 0.4s ease",
};

const timelineContentStyle: React.CSSProperties = {
  flex: 1, backgroundColor: "var(--bg-primary)",
  padding: "10px 14px", borderRadius: "var(--radius-sm)",
  fontSize: "13px", transition: "background-color 0.4s ease",
};

const timelineHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px",
};

const timelineMoodLabelStyle: React.CSSProperties = { fontWeight: "bold", color: "var(--text-main)" };
const timelineDateStyle: React.CSSProperties = { fontSize: "11px", color: "var(--text-muted)" };
const timelineNoteStyle: React.CSSProperties = { color: "var(--text-muted)", marginTop: "4px", whiteSpace: "pre-wrap" };

const timelineImageStyle: React.CSSProperties = {
  marginTop: "8px", width: "100%", maxHeight: "140px",
  objectFit: "cover", borderRadius: "var(--radius-sm)",
  cursor: "pointer", border: "1px solid var(--bg-accent)",
};
