import React from "react";

interface GardenViewProps {
  completedCount: number;
  totalCount: number;
}

export const GardenView: React.FC<GardenViewProps> = ({ completedCount, totalCount }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="card garden-card" style={gardenCardStyle}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-sage)" }}>
          <path d="M12 10a6 6 0 0 0-6-6H3v3a6 6 0 0 0 6 6h3Z" />
          <path d="M12 10a6 6 0 0 1 6-6h3v3a6 6 0 0 1-6 6h-3Z" />
          <path d="M12 22V10" />
        </svg>
        حديقتك الافتراضية
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
        راقب نبتتك وهي تنمو وتزدهر مع كل عادة صحية تلتزم بها طوال اليوم.
      </p>

      <div style={illustrationContainerStyle}>
        {/* SVG Calming Plant Illustration */}
        <svg viewBox="0 0 200 200" width="100%" height="220" style={{ overflow: "visible" }}>
          {/* Custom animations styled internally */}
          <style>{`
            @keyframes floatParticles {
              0%, 100% { transform: translateY(0px) scale(0.9); opacity: 0.4; }
              50% { transform: translateY(-10px) scale(1.18); opacity: 0.95; }
            }
            .sparkle-1 { animation: floatParticles 4.5s ease-in-out infinite; }
            .sparkle-2 { animation: floatParticles 5.5s ease-in-out infinite 1s; }
            .sparkle-3 { animation: floatParticles 3.8s ease-in-out infinite 2s; }
            .glow-effect { transition: all 1s ease; }
          `}</style>

          {/* Gradients and Filters definition */}
          <defs>
            <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-sage-light)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--bg-card)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="stemGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-sage)" />
              <stop offset="100%" stopColor="#55755b" />
            </linearGradient>
            <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ebd6cc" />
              <stop offset="100%" stopColor="var(--color-terracotta)" />
            </linearGradient>
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#7d9c82" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Calming ambient background glow behind the plant */}
          <circle cx="100" cy="110" r="75" fill="url(#ambientGlow)" className="glow-effect" />

          {/* Ground platform */}
          <path d="M 20 170 Q 100 162 180 170" fill="none" stroke="var(--bg-accent)" strokeWidth="3" strokeLinecap="round" />
          
          {/* Ceramic Pot and Rim */}
          <ellipse cx="100" cy="178" rx="32" ry="6" fill="var(--bg-accent)" opacity="0.4" />
          <path d="M 68 153 Q 100 148 132 153 L 124 182 Q 100 189 76 182 Z" fill="url(#potGradient)" filter="url(#cardShadow)" />
          <path d="M 66 148 Q 100 144 134 148 L 134 153 Q 100 149 66 153 Z" fill="#dfb39d" />
          <ellipse cx="100" cy="149" rx="31" ry="3.5" fill="#694b37" />

          {/* Plant Growth Stages */}
          
          {/* Stage 1+: Stem (Sprout) */}
          {percentage > 0 && (
            <path 
              d="M 100 149 C 98 125, 94 105, 100 80" 
              fill="none" 
              stroke="url(#stemGradient)" 
              strokeWidth="5.5" 
              strokeLinecap="round"
              style={{ transition: "all 0.8s ease" }}
            />
          )}

          {/* Stage 3+: Upper Stem */}
          {percentage > 50 && (
            <path 
              d="M 100 80 C 104 65, 96 50, 100 35" 
              fill="none" 
              stroke="url(#stemGradient)" 
              strokeWidth="4.5" 
              strokeLinecap="round"
              style={{ transition: "all 0.8s ease" }}
            />
          )}

          {/* First pair of leaves (Left & Right) - Visible from 25% */}
          {percentage >= 25 && (
            <g style={{ transition: "all 0.5s ease" }}>
              {/* Left Leaf (Dual Shading) */}
              <g className="leaf-animation" style={{ transformOrigin: "98px 120px" }}>
                <path d="M 98 120 C 75 115, 70 100, 98 110 Z" fill="var(--color-sage)" />
                <path d="M 98 120 C 75 125, 70 110, 98 110 Z" fill="#4b6652" opacity="0.3" />
              </g>
              {/* Right Leaf (Dual Shading) */}
              <g className="leaf-animation" style={{ transformOrigin: "102px 110px" }}>
                <path d="M 102 110 C 125 105, 130 90, 102 100 Z" fill="var(--color-sage)" />
                <path d="M 102 110 C 125 115, 130 100, 102 100 Z" fill="#4b6652" opacity="0.3" />
              </g>
            </g>
          )}

          {/* Second pair of leaves - Visible from 60% */}
          {percentage >= 60 && (
            <g style={{ transition: "all 0.5s ease" }}>
              {/* Upper Left Leaf */}
              <g className="leaf-animation" style={{ transformOrigin: "98px 75px" }}>
                <path d="M 98 75 C 78 70, 73 58, 98 67 Z" fill="var(--color-sage)" />
                <path d="M 98 75 C 78 78, 73 66, 98 67 Z" fill="#4b6652" opacity="0.3" />
              </g>
              {/* Upper Right Leaf */}
              <g className="leaf-animation" style={{ transformOrigin: "102px 70px" }}>
                <path d="M 102 70 C 122 65, 127 53, 102 62 Z" fill="var(--color-sage)" />
                <path d="M 102 70 C 122 70, 127 58, 102 62 Z" fill="#4b6652" opacity="0.3" />
              </g>
            </g>
          )}

          {/* Bud - Visible from 75% to 99% */}
          {percentage >= 75 && percentage < 100 && (
            <g style={{ transformOrigin: "100px 35px", transition: "all 0.5s ease" }} className="leaf-animation">
              {/* Bud Base and Petals */}
              <path d="M 100 35 C 92 25, 93 15, 100 10 C 107 15, 108 25, 100 35 Z" fill="var(--color-sand)" />
              <path d="M 100 35 C 96 25, 96 15, 100 10 Z" fill="var(--color-terracotta)" opacity="0.6" />
            </g>
          )}

          {/* Fully Bloomed Flower - Stage 5 (100%) */}
          {percentage === 100 && (
            <g style={{ transformOrigin: "100px 35px" }} className="leaf-animation">
              {/* Stem Connection */}
              <line x1="100" y1="35" x2="100" y2="28" stroke="var(--color-sage)" strokeWidth="3" />
              
              {/* Organic Blossom - Lotus/Tulip Design */}
              <g style={{ transform: "translate(0, 5px)" }}>
                {/* Back Petals */}
                <path d="M 100 25 C 80 15, 75 0, 93 -5 Z" fill="var(--color-terracotta)" opacity="0.8" />
                <path d="M 100 25 C 120 15, 125 0, 107 -5 Z" fill="var(--color-terracotta)" opacity="0.8" />
                
                {/* Side Front Petals */}
                <path d="M 100 25 C 84 15, 83 2, 94 0 Z" fill="var(--color-sand)" />
                <path d="M 100 25 C 116 15, 117 2, 106 0 Z" fill="var(--color-sand)" />
                
                {/* Center Main Petal */}
                <path d="M 100 25 C 92 10, 92 0, 100 -6 C 108 0, 108 10, 100 25 Z" fill="var(--color-sand)" />
                
                {/* Glowing Core center */}
                <circle cx="100" cy="10" r="4.5" fill="#ffffff" style={{ boxShadow: "0 0 10px #fff" }} />
              </g>
              
              {/* Floating Star Sparkles - Professional UX Touch */}
              <g className="sparkle-1" style={{ transformOrigin: "65px 15px" }}>
                <path d="M 65 15 L 67 17 L 65 19 L 63 17 Z" fill="var(--color-sand)" />
              </g>
              <g className="sparkle-2" style={{ transformOrigin: "135px 8px" }}>
                <path d="M 135 8 L 138 11 L 135 14 L 132 11 Z" fill="var(--color-sand)" />
              </g>
              <g className="sparkle-3" style={{ transformOrigin: "115px 35px" }}>
                <circle cx="115" cy="35" r="2" fill="var(--color-meditate)" />
              </g>
              <g className="sparkle-1" style={{ transformOrigin: "78px 45px" }}>
                <circle cx="78" cy="45" r="1.5" fill="var(--color-meditate)" />
              </g>
            </g>
          )}

          {/* If 0% - show seed in the soil */}
          {percentage === 0 && (
            <g>
              <ellipse cx="100" cy="147" rx="3" ry="1.5" fill="var(--color-sand)" />
              <path d="M 98 145 Q 100 137 102 145" fill="none" stroke="var(--color-sage-light)" strokeWidth="1" />
            </g>
          )}
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
};
