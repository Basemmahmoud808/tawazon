import React from "react";

interface GardenViewProps {
  completedCount: number;
  totalCount: number;
  theme?: "light" | "dark";
}

export const GardenView: React.FC<GardenViewProps> = ({ completedCount, totalCount, theme }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDark = theme === "dark";

  return (
    <div className="card garden-card" style={gardenCardStyle}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-sage)" }}>
          <path d="M12 10a6 6 0 0 0-6-6H3v3a6 6 0 0 0 6 6h3Z" />
          <path d="M12 10a6 6 0 0 1 6-6h3v3a6 6 0 0 1-6 6h-3Z" />
          <path d="M12 22V10" />
        </svg>
        حديقتك التفاعلية
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>
        راقب نمو نبتتك وتفتح زهورها مع كل مهمة وعادة تلتزم بها طوال اليوم.
      </p>

      <div style={illustrationContainerStyle}>
        {/* SVG Premium Plant Illustration */}
        <svg viewBox="0 0 200 200" width="100%" height="220" style={{ overflow: "visible" }}>
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
              <stop offset="0%" stopColor={isDark ? "#27272a" : "#e4e4e7"} />
              <stop offset="100%" stopColor={isDark ? "#09090b" : "#a1a1aa"} />
            </linearGradient>
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity={isDark ? "0.35" : "0.08"} />
            </filter>
          </defs>

          {/* Calming ambient background glow behind the plant */}
          <circle cx="100" cy="110" r="80" fill="url(#ambientGlow)" className="glow-effect" />

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
          <path d="M 15 170 Q 100 163 185 170" fill="none" stroke="var(--bg-accent)" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Ceramic Pot and Rim */}
          <ellipse cx="100" cy="178" rx="28" ry="5" fill="var(--bg-accent)" opacity="0.45" />
          {/* Hexagonal/Minimalist Concrete Pot */}
          <path d="M 72 153 L 128 153 L 122 181 L 78 181 Z" fill="url(#potGradient)" filter="url(#cardShadow)" />
          {/* Concrete Pot Top Rim */}
          <path d="M 70 148 L 130 148 L 130 153 L 70 153 Z" fill={isDark ? "#3f3f46" : "#d4d4d8"} />
          <ellipse cx="100" cy="149" rx="27" ry="2.5" fill="#3f2d21" />

          {/* Gold Accent Band around the concrete pot for a premium touch */}
          <path d="M 74 163 L 126 163 L 124 167 L 76 167 Z" fill="#d97706" opacity="0.8" style={{ filter: "drop-shadow(0 0 2px rgba(217,119,6,0.3))" }} />

          {/* ─── Plant growth stem structure (wraps in sway animation) ─── */}
          <g className="stem-sway">
            
            {/* Stage 1+: Stem (Sprout) */}
            {percentage > 0 && (
              <path 
                d="M 100 149 C 98 128, 95 108, 100 80" 
                fill="none" 
                stroke="url(#stemGradient)" 
                strokeWidth="5" 
                strokeLinecap="round"
                style={{ transition: "all 0.8s ease" }}
              />
            )}

            {/* Stage 3+: Upper Stem */}
            {percentage > 50 && (
              <path 
                d="M 100 80 C 103 66, 97 51, 100 36" 
                fill="none" 
                stroke="url(#stemGradient)" 
                strokeWidth="4" 
                strokeLinecap="round"
                style={{ transition: "all 0.8s ease" }}
              />
            )}

            {/* First pair of leaves (Left & Right) - Visible from 25% */}
            {percentage >= 25 && (
              <g style={{ transition: "all 0.5s ease" }}>
                {/* Left Leaf (Dual Shading + Sway) */}
                <g className="leaf-left-sway" style={{ transformOrigin: "98px 120px" }}>
                  <path d="M 98 120 C 74 116, 68 100, 98 110 Z" fill="url(#leafGradient)" />
                  <path d="M 98 120 C 74 124, 68 108, 98 110 Z" fill="#081c15" opacity="0.25" />
                </g>
                {/* Right Leaf (Dual Shading + Sway) */}
                <g className="leaf-right-sway" style={{ transformOrigin: "102px 110px" }}>
                  <path d="M 102 110 C 126 106, 132 90, 102 100 Z" fill="url(#leafGradient)" />
                  <path d="M 102 110 C 126 114, 132 98, 102 100 Z" fill="#081c15" opacity="0.25" />
                </g>
              </g>
            )}

            {/* Second pair of leaves - Visible from 60% */}
            {percentage >= 60 && (
              <g style={{ transition: "all 0.5s ease" }}>
                {/* Upper Left Leaf */}
                <g className="leaf-left-sway" style={{ transformOrigin: "98px 75px" }}>
                  <path d="M 98 75 C 77 71, 71 58, 98 67 Z" fill="url(#leafGradient)" />
                  <path d="M 98 75 C 77 79, 71 66, 98 67 Z" fill="#081c15" opacity="0.25" />
                </g>
                {/* Upper Right Leaf */}
                <g className="leaf-right-sway" style={{ transformOrigin: "102px 70px" }}>
                  <path d="M 102 70 C 123 66, 129 53, 102 62 Z" fill="url(#leafGradient)" />
                  <path d="M 102 70 C 123 71, 129 58, 102 62 Z" fill="#081c15" opacity="0.25" />
                </g>
              </g>
            )}

            {/* Bud - Visible from 75% to 99% */}
            {percentage >= 75 && percentage < 100 && (
              <g style={{ transformOrigin: "100px 36px", transition: "all 0.5s ease" }}>
                {/* Bud Base and Petals */}
                <path d="M 100 36 C 92 26, 93 16, 100 11 C 107 16, 108 26, 100 36 Z" fill="var(--color-sand)" />
                <path d="M 100 36 C 96 26, 96 16, 100 11 Z" fill="var(--color-terracotta)" opacity="0.65" />
              </g>
            )}

            {/* Fully Bloomed Flower - Stage 5 (100%) */}
            {percentage === 100 && (
              <g style={{ transformOrigin: "100px 36px" }}>
                {/* Stem Connection */}
                <line x1="100" y1="36" x2="100" y2="28" stroke="var(--color-sage)" strokeWidth="3" />
                
                {/* Organic Golden/Terracotta Blossom */}
                <g style={{ transform: "translate(0, 5px)" }}>
                  {/* Back Lotus Petals */}
                  <path d="M 100 25 C 78 13, 72 -3, 92 -8 Z" fill="var(--color-terracotta)" opacity="0.85" />
                  <path d="M 100 25 C 122 13, 128 -3, 108 -8 Z" fill="var(--color-terracotta)" opacity="0.85" />
                  
                  {/* Side Front Golden Petals */}
                  <path d="M 100 25 C 82 13, 80 -1, 93 -3 Z" fill="var(--color-sand)" />
                  <path d="M 100 25 C 118 13, 120 -1, 107 -3 Z" fill="var(--color-sand)" />
                  
                  {/* Center Main Lotus Petal */}
                  <path d="M 100 25 C 91 8, 91 -2, 100 -9 C 109 -2, 109 8, 100 25 Z" fill="var(--color-sand)" />
                  
                  {/* Glowing Core center */}
                  <circle cx="100" cy="8" r="4.5" fill="#ffffff" style={{ filter: "drop-shadow(0 0 5px #fff)" }} />
                </g>
                
                {/* Floating Star Sparkles */}
                <g className="sparkle-1" style={{ transformOrigin: "62px 12px" }}>
                  <path d="M 62 12 L 64 14 L 62 16 L 60 14 Z" fill="var(--color-sand)" />
                </g>
                <g className="sparkle-2" style={{ transformOrigin: "138px 6px" }}>
                  <path d="M 138 6 L 141 9 L 138 12 L 135 9 Z" fill="var(--color-sand)" />
                </g>
                <g className="sparkle-3" style={{ transformOrigin: "116px 32px" }}>
                  <circle cx="116" cy="32" r="2" fill="var(--color-meditate)" />
                </g>
                <g className="sparkle-1" style={{ transformOrigin: "76px 42px" }}>
                  <circle cx="76" cy="42" r="1.5" fill="var(--color-meditate)" />
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
};

const illustrationContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px 0",
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
