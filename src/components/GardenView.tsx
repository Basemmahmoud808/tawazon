import React from "react";

interface GardenViewProps {
  completedCount: number;
  totalCount: number;
  theme?: "light" | "dark";
}

export const GardenView: React.FC<GardenViewProps> = ({ completedCount, totalCount, theme }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDark = theme === "dark";
  const flowerPositions = [
    { x: 38, y: 120 },
    { x: 59, y: 100 },
    { x: 80, y: 84 },
    { x: 100, y: 72 },
    { x: 120, y: 84 },
    { x: 141, y: 100 },
    { x: 162, y: 120 },
  ];
  const visibleFlowers = flowerPositions.slice(0, Math.min(completedCount, flowerPositions.length));

  return (
    <div
      className="card garden-card"
      style={{
        ...gardenCardStyle,
        background: isDark 
          ? "linear-gradient(135deg, #091e15 0%, #022c22 100%)" 
          : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        border: isDark 
          ? "1px solid rgba(16,185,129,0.22)" 
          : "1px solid rgba(16,185,129,0.12)",
        boxShadow: isDark 
          ? "0 10px 30px rgba(0,0,0,0.5)" 
          : "0 10px 30px rgba(16,185,129,0.06)",
        transition: "background 0.5s ease, border-color 0.5s ease"
      }}
    >
      <div style={gardenHeaderStyle}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-sage)" }}>
          <path d="M12 10a6 6 0 0 0-6-6H3v3a6 6 0 0 0 6 6h3Z" />
          <path d="M12 10a6 6 0 0 1 6-6h3v3a6 6 0 0 1-6 6h-3Z" />
          <path d="M12 22V10" />
        </svg>
            حديقتك التفاعلية
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "5px 0 0" }}>
            عادة مكتملة = نمو جديد
          </p>
        </div>
        <span style={gardenBadgeStyle}>{percentage}%</span>
      </div>

      <div style={illustrationContainerStyle}>
        {/* SVG Premium Plant Illustration */}
        <svg viewBox="0 0 200 200" width="100%" height="180" style={{ overflow: "visible" }} aria-label="رسم حديقة توازن">
          {/* Custom micro-animations styled internally */}
          <style>{`
            @keyframes floatParticles {
              0%, 100% { transform: translateY(0px) scale(0.9); opacity: 0.4; }
              50% { transform: translateY(-8px) scale(1.15); opacity: 0.9; }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.95; }
            }
            @keyframes windSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(1.2deg); }
            }
            @keyframes leafLeftSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-2.5deg) translateY(0.5px); }
            }
            @keyframes leafRightSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(2.5deg) translateY(-0.5px); }
            }
            .sparkle-1 { animation: floatParticles 4.5s ease-in-out infinite; }
            .sparkle-2 { animation: floatParticles 5.5s ease-in-out infinite 1s; }
            .sparkle-3 { animation: floatParticles 3.8s ease-in-out infinite 2s; }
            
            .star-twinkle-1 { animation: twinkle 3s ease-in-out infinite; }
            .star-twinkle-2 { animation: twinkle 4s ease-in-out infinite 1.5s; }
            .star-twinkle-3 { animation: twinkle 2.5s ease-in-out infinite 0.7s; }

            .stem-sway { animation: windSway 6s ease-in-out infinite; transform-origin: 100px 149px; }
            .leaf-left-sway { animation: leafLeftSway 5s ease-in-out infinite; }
            .leaf-right-sway { animation: leafRightSway 5s ease-in-out infinite 0.8s; }
            .flower-bloom { animation: flowerBloom 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; transform-box: fill-box; transform-origin: center bottom; }
            @keyframes flowerBloom {
              from { opacity: 0; transform: translateY(10px) scale(0.2); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .glow-effect { transition: all 1s ease; }
          `}</style>

          {/* Gradients and Filters definition */}
          <defs>
            <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isDark ? "rgba(45,106,79,0.35)" : "rgba(230,242,233,0.7)"} />
              <stop offset="100%" stopColor="var(--bg-card)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="stemGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2d6a4f" />
              <stop offset="50%" stopColor="#40916c" />
              <stop offset="100%" stopColor="#1b4332" />
            </linearGradient>
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52b788" />
              <stop offset="50%" stopColor="#2d6a4f" />
              <stop offset="100%" stopColor="#081c15" />
            </linearGradient>
            <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? "#6b4b3e" : "#d99a72"} />
              <stop offset="55%" stopColor={isDark ? "#4b3027" : "#b96f4a"} />
              <stop offset="100%" stopColor={isDark ? "#2a1b18" : "#87452f"} />
            </linearGradient>
            <linearGradient id="soilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDark ? "#4a3022" : "#6b422d"} />
              <stop offset="100%" stopColor={isDark ? "#241812" : "#3e261c"} />
            </linearGradient>
            <linearGradient id="petalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <linearGradient id="innerPetalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity={isDark ? "0.35" : "0.08"} />
            </filter>
          </defs>

          {/* Calming ambient background glow behind the plant */}
          <circle cx="100" cy="110" r="80" fill="url(#ambientGlow)" className="glow-effect" />

          {/* Soft garden scene to give the illustration a clear setting */}
          <path
            d="M 22 143 Q 55 112 92 137 Q 127 104 178 143 V 170 H 22 Z"
            fill={isDark ? "#0d3b2b" : "#c9e8d2"}
            opacity="0.72"
          />
          <path
            d="M 22 153 Q 62 126 101 151 Q 141 120 178 153 V 170 H 22 Z"
            fill={isDark ? "#11543a" : "#a9d8b8"}
            opacity="0.72"
          />

          {/* Theme-Aware Background: Sun or Moon */}
          {isDark ? (
            /* Night Sky: Twinkling Stars & Silver Crescent Moon */
            <g className="glow-effect">
              {/* Twinkling Stars */}
              <circle cx="45" cy="35" r="1.2" fill="#ffffff" className="star-twinkle-1" />
              <circle cx="65" cy="20" r="1" fill="#ffffff" className="star-twinkle-2" />
              <circle cx="140" cy="45" r="1.5" fill="#ffffff" className="star-twinkle-3" />
              <circle cx="35" cy="55" r="1" fill="#ffffff" className="star-twinkle-2" />
              
              {/* Crescent Moon */}
              <path 
                d="M 152 25 A 11 11 0 1 0 163 36 A 9 9 0 1 1 152 25 Z" 
                fill="#cbd5e1" 
                opacity="0.9" 
                style={{ filter: "drop-shadow(0 0 4px rgba(203,213,225,0.4))" }}
              />
            </g>
          ) : (
            /* Day Sky: Glowing Golden Sun */
            <g className="glow-effect">
              {/* Sun Glow Outer Ring */}
              <circle cx="160" cy="32" r="16" fill="#fef08a" opacity="0.3" />
              {/* Sun Core */}
              <circle cx="160" cy="32" r="10" fill="#f59e0b" opacity="0.85" />
            </g>
          )}

          {/* Ground platform */}
          <path d="M 15 170 Q 100 163 185 170" fill="none" stroke={isDark ? "#2b6b51" : "#83bd96"} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="43" cy="157" r="2.5" fill={isDark ? "#57d68d" : "#4b9b68"} opacity="0.8" />
          <circle cx="157" cy="151" r="2" fill={isDark ? "#57d68d" : "#4b9b68"} opacity="0.7" />
          
          {/* Ceramic Pot and Rim */}
          <ellipse cx="100" cy="181" rx="30" ry="5" fill="#163a2b" opacity={isDark ? "0.65" : "0.22"} />
          <path d="M 73 151 Q 100 157 127 151 L 121 179 Q 100 184 79 179 Z" fill="url(#potGradient)" filter="url(#cardShadow)" />
          <path d="M 79 158 Q 100 164 121 158 L 119 177 Q 100 181 81 177 Z" fill="rgba(255,255,255,0.08)" />
          
          {/* Warm ceramic rim and soil */}
          <path d="M 70 147 Q 100 153 130 147 L 129 154 Q 100 161 71 154 Z" fill={isDark ? "#7f5847" : "#d78a62"} />
          <ellipse cx="100" cy="150" rx="26" ry="5" fill="url(#soilGradient)" />

          {/* Gold Accent Band around the concrete pot for a premium touch */}
          <path d="M 78 164 Q 100 169 122 164 L 121 168 Q 100 173 79 168 Z" fill={isDark ? "#f0b958" : "#d59a38"} style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.35))" }} />

          {/* ─── Plant growth stem structure (wraps in sway animation) ─── */}
          <g className="stem-sway">
            
            {/* Stage 1+: Stem (Sprout) */}
            {percentage > 0 && (
              <path 
                d="M 100 149 C 96 110, 104 70, 100 22" 
                fill="none" 
                stroke="url(#stemGradient)" 
                strokeWidth="5.5" 
                strokeLinecap="round"
                strokeDasharray="130"
                strokeDashoffset={130 - (130 * percentage) / 100}
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            )}

            {/* A visible seedling keeps the garden inviting from the first day */}
            {percentage < 25 && (
              <g style={{ transition: "all 0.5s ease" }}>
                <path d="M 100 143 Q 92 132 82 134 Q 87 145 100 146 Z" fill="url(#leafGradient)" />
                <path d="M 100 140 Q 108 129 118 132 Q 113 143 100 146 Z" fill="url(#leafGradient)" />
                <path d="M 98 142 Q 91 137 85 136" fill="none" stroke="#a7f3d0" strokeWidth="1" opacity="0.7" />
                <path d="M 102 140 Q 109 135 115 134" fill="none" stroke="#a7f3d0" strokeWidth="1" opacity="0.7" />
              </g>
            )}

            {/* Each completed habit grows one flower from the soil */}
            {visibleFlowers.map((flower, index) => (
              <g
                key={`${flower.x}-${completedCount}`}
                className="flower-bloom"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <path
                  d={`M 100 149 Q ${flower.x} 137 ${flower.x} ${flower.y + 5}`}
                  fill="none"
                  stroke="url(#stemGradient)"
                  strokeWidth={index === 2 ? "3.5" : "2.5"}
                  strokeLinecap="round"
                />
                <g transform={`translate(${flower.x} ${flower.y})`}>
                  <circle cx="0" cy="-6" r="5" fill="url(#petalGradient)" />
                  <circle cx="6" cy="0" r="5" fill="url(#petalGradient)" />
                  <circle cx="0" cy="6" r="5" fill="url(#petalGradient)" />
                  <circle cx="-6" cy="0" r="5" fill="url(#petalGradient)" />
                  <circle cx="0" cy="0" r="3.5" fill="url(#innerPetalGradient)" />
                  <circle cx="-1" cy="-1" r="1.2" fill="#fff7c2" opacity="0.9" />
                </g>
              </g>
            ))}

            {/* First pair of leaves (Left & Right) - Visible from 25% */}
            {percentage >= 25 && (
              <g style={{ transition: "all 0.5s ease" }}>
                {/* Branches connecting leaves */}
                <path d="M 98 118 Q 86 117 84 116" fill="none" stroke="url(#stemGradient)" strokeWidth="3" strokeLinecap="round" />
                <path d="M 99 110 Q 112 108 114 107" fill="none" stroke="url(#stemGradient)" strokeWidth="3" strokeLinecap="round" />

                {/* Left Leaf (Dual Shading + Sway) */}
                <g className="leaf-left-sway" style={{ transformOrigin: "84px 116px" }}>
                  <path d="M 84 116 C 60 112, 54 96, 84 106 Z" fill="url(#leafGradient)" />
                  <path d="M 84 116 C 60 120, 54 104, 84 106 Z" fill="#081c15" opacity="0.25" />
                  {/* Leaf Vein */}
                  <path d="M 84 116 Q 73 110 66 107" fill="none" stroke="#a7f3d0" strokeWidth="1" opacity="0.65" />
                </g>
                {/* Right Leaf (Dual Shading + Sway) */}
                <g className="leaf-right-sway" style={{ transformOrigin: "114px 107px" }}>
                  <path d="M 114 107 C 138 103, 144 87, 114 97 Z" fill="url(#leafGradient)" />
                  <path d="M 114 107 C 138 111, 144 95, 114 97 Z" fill="#081c15" opacity="0.25" />
                  {/* Leaf Vein */}
                  <path d="M 114 107 Q 125 101 132 98" fill="none" stroke="#a7f3d0" strokeWidth="1" opacity="0.65" />
                </g>
              </g>
            )}

            {/* Second pair of leaves - Visible from 60% */}
            {percentage >= 60 && (
              <g style={{ transition: "all 0.5s ease" }}>
                {/* Branches connecting leaves */}
                <path d="M 99 74 Q 86 72 84 71" fill="none" stroke="url(#stemGradient)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 100 68 Q 112 66 114 65" fill="none" stroke="url(#stemGradient)" strokeWidth="2.5" strokeLinecap="round" />

                {/* Upper Left Leaf */}
                <g className="leaf-left-sway" style={{ transformOrigin: "84px 71px" }}>
                  <path d="M 84 71 C 63 67, 57 54, 84 63 Z" fill="url(#leafGradient)" />
                  <path d="M 84 71 C 63 75, 57 62, 84 63 Z" fill="#081c15" opacity="0.25" />
                  {/* Leaf Vein */}
                  <path d="M 84 71 Q 71 65 65 62" fill="none" stroke="#a7f3d0" strokeWidth="1" opacity="0.65" />
                </g>
                {/* Upper Right Leaf */}
                <g className="leaf-right-sway" style={{ transformOrigin: "114px 65px" }}>
                  <path d="M 114 65 C 135 61, 141 48, 114 57 Z" fill="url(#leafGradient)" />
                  <path d="M 114 65 C 135 65, 141 52, 114 57 Z" fill="#081c15" opacity="0.25" />
                  {/* Leaf Vein */}
                  <path d="M 114 65 Q 127 59 133 56" fill="none" stroke="#a7f3d0" strokeWidth="1" opacity="0.65" />
                </g>
              </g>
            )}

            {/* If 0% - show seed sprout peak */}
            {percentage === 0 && (
              <g>
                <ellipse cx="100" cy="147" rx="3.5" ry="1.5" fill="var(--color-sand)" />
                <path d="M 98 145 Q 100 136 102 145" fill="none" stroke="#2d6a4f" strokeWidth="1.2" />
              </g>
            )}

          </g> {/* ─── End Plant Group ─── */}

        </svg>
      </div>

      {/* Progress Info */}
      <div style={progressInfoStyle}>
        <div style={progressLabelContainerStyle}>
          <span style={progressPercentStyle}>{percentage}% مكتمل</span>
          <span style={progressFractionStyle}>
            {completedCount} من {totalCount} عادات
          </span>
        </div>
        <div style={progressBarBgStyle}>
          <div 
            style={{ 
              ...progressBarFillStyle, 
              width: `${percentage}%`,
              backgroundColor: percentage === 100 ? "var(--color-sage)" : "var(--color-meditate)",
            }} 
          />
        </div>
        <p style={statusTextStyle}>
          {percentage === 0 && "ابتدئ بيومك وأنجز عاداتك الأولى لتغرس بذرة النجاح."}
          {percentage > 0 && percentage < 50 && "بداية رائعة! نبتتك بدأت تخرج من التربة لتشاركك اليوم."}
          {percentage >= 50 && percentage < 75 && "عمل دؤوب، نبتتك تنمو وتخرج أوراقاً جديدة الآن!"}
          {percentage >= 75 && percentage < 100 && "أنت قريب جداً! براعم الزهور أوشكت على التفتح."}
          {percentage === 100 && "مذهل! لقد أتممت جميع عاداتك اليوم وتفتحت زهور حديقتك الجميلة! 🌟"}
        </p>
      </div>
    </div>
  );
};

// Styles
const gardenCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "20px",
  borderRadius: "22px",
};

const gardenHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
};

const gardenBadgeStyle: React.CSSProperties = {
  minWidth: "48px",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "var(--brand-light)",
  color: "var(--brand)",
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "center",
};

const illustrationContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "4px 0 0",
};

const progressInfoStyle: React.CSSProperties = {
  marginTop: "16px",
};

const progressLabelContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const progressPercentStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "15px",
  color: "var(--text-main)",
};

const progressFractionStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--text-muted)",
};

const progressBarBgStyle: React.CSSProperties = {
  width: "100%",
  height: "8px",
  backgroundColor: "var(--bg-accent)",
  borderRadius: "var(--radius-sm)",
  overflow: "hidden",
  marginBottom: "12px",
};

const progressBarFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "var(--radius-sm)",
  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: "13px",
  textAlign: "center",
  color: "var(--text-muted)",
  fontStyle: "italic",
  minHeight: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: "1.6",
};
