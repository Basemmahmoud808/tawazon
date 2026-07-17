import React, { useState, useRef, useEffect } from "react";

interface SoundState {
  rain: boolean;
  ocean: boolean;
  zen: boolean;
}

interface VolumeState {
  rain: number;
  ocean: number;
  zen: number;
}

export const SoundPlayer: React.FC = () => {
  const [playing, setPlaying] = useState<SoundState>({
    rain: false,
    ocean: false,
    zen: false,
  });
  const [volumes, setVolumes] = useState<VolumeState>({
    rain: 0.5,
    ocean: 0.5,
    zen: 0.5,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Refs for audio nodes to control them dynamically
  const rainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);

  const oceanSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const oceanGainRef = useRef<GainNode | null>(null);
  const oceanLfoRef = useRef<OscillatorNode | null>(null);

  const zenOscsRef = useRef<OscillatorNode[]>([]);
  const zenGainRef = useRef<GainNode | null>(null);
  const zenLfosRef = useRef<OscillatorNode[]>([]);

  // Initialize Audio Context on demand
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Update volumes when state changes
  useEffect(() => {
    if (rainGainRef.current) {
      rainGainRef.current.gain.setValueAtTime(volumes.rain * 0.15, audioCtxRef.current?.currentTime || 0);
    }
  }, [volumes.rain]);

  useEffect(() => {
    if (oceanGainRef.current) {
      // Base volume for ocean
      oceanGainRef.current.gain.setValueAtTime(volumes.ocean * 0.25, audioCtxRef.current?.currentTime || 0);
    }
  }, [volumes.ocean]);

  useEffect(() => {
    if (zenGainRef.current) {
      zenGainRef.current.gain.setValueAtTime(volumes.zen * 0.2, audioCtxRef.current?.currentTime || 0);
    }
  }, [volumes.zen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRain();
      stopOcean();
      stopZen();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // --- Rain Synth (White Noise + Bandpass filter) ---
  const startRain = (ctx: AudioContext) => {
    try {
      stopRain();
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Filter to sound like rain
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 850;
      filter.Q.value = 1.0;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volumes.rain * 0.15, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start();
      rainSourceRef.current = source;
      rainGainRef.current = gainNode;
    } catch (e) {
      console.error("Failed to start rain sound:", e);
    }
  };

  const stopRain = () => {
    if (rainSourceRef.current) {
      try {
        rainSourceRef.current.stop();
      } catch (e) {}
      rainSourceRef.current.disconnect();
      rainSourceRef.current = null;
    }
    rainGainRef.current = null;
  };

  // --- Ocean Wave Synth (Brown Noise + LFO modulation + Lowpass) ---
  const startOcean = (ctx: AudioContext) => {
    try {
      stopOcean();
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Amplify brown noise
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 350;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volumes.ocean * 0.25, ctx.currentTime);

      // LFO to modulate filter frequency (creates wave swell)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08; // slow cycle (12.5 seconds)
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 150; // modulate filter by +/- 150Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      lfo.start();
      source.start();

      oceanSourceRef.current = source;
      oceanGainRef.current = gainNode;
      oceanLfoRef.current = lfo;
    } catch (e) {
      console.error("Failed to start ocean sound:", e);
    }
  };

  const stopOcean = () => {
    if (oceanSourceRef.current) {
      try {
        oceanSourceRef.current.stop();
      } catch (e) {}
      oceanSourceRef.current.disconnect();
      oceanSourceRef.current = null;
    }
    if (oceanLfoRef.current) {
      try {
        oceanLfoRef.current.stop();
      } catch (e) {}
      oceanLfoRef.current.disconnect();
      oceanLfoRef.current = null;
    }
    oceanGainRef.current = null;
  };

  // --- Zen Drone Synth (Pitched Triangle chords + slow modulations) ---
  const startZen = (ctx: AudioContext) => {
    try {
      stopZen();
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volumes.zen * 0.2, ctx.currentTime);
      gainNode.connect(ctx.destination);
      zenGainRef.current = gainNode;

      // Deep harmonic frequencies (Root, Fifth, Octave, Ninth)
      const freqs = [110.00, 165.00, 220.00, 293.66]; // A2, E3, A3, D4
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;

        // Individual gain node for slow volume breathing
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, ctx.currentTime);

        // Lowpass to make it extra warm
        const oscFilter = ctx.createBiquadFilter();
        oscFilter.type = "lowpass";
        oscFilter.frequency.value = 250;

        // Slow LFO for volume breathing
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.05 + idx * 0.01; // slightly different speed for each note

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.12;

        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(gainNode);

        lfo.start();
        osc.start();

        zenOscsRef.current.push(osc);
        zenLfosRef.current.push(lfo);
      });
    } catch (e) {
      console.error("Failed to start Zen sound:", e);
    }
  };

  const stopZen = () => {
    zenOscsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
      osc.disconnect();
    });
    zenLfosRef.current.forEach(lfo => {
      try {
        lfo.stop();
      } catch (e) {}
      lfo.disconnect();
    });
    zenOscsRef.current = [];
    zenLfosRef.current = [];
    zenGainRef.current = null;
  };

  // Toggle handlers
  const toggleSound = (type: keyof SoundState) => {
    const ctx = initAudioContext();
    const isPlaying = !playing[type];
    
    setPlaying(prev => ({ ...prev, [type]: isPlaying }));

    if (isPlaying) {
      if (type === "rain") startRain(ctx);
      if (type === "ocean") startOcean(ctx);
      if (type === "zen") startZen(ctx);
    } else {
      if (type === "rain") stopRain();
      if (type === "ocean") stopOcean();
      if (type === "zen") stopZen();
    }
  };

  const handleVolumeChange = (type: keyof VolumeState, val: number) => {
    setVolumes(prev => ({ ...prev, [type]: val }));
  };

  return (
    <div className="card sound-player-card">
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-sage)" }}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        الأصوات المحيطة للاسترخاء
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
        امزج بين الأصوات التالية لتهيئة الجو المناسب لتركيزك أو راحتك النفسية. الأصوات تُنتج برمجياً بالكامل في متصفحك.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Rain Sound Control */}
        <div style={soundRowStyle}>
          <button 
            onClick={() => toggleSound("rain")} 
            style={playing.rain ? activeSoundBtnStyle : soundBtnStyle}
            title={playing.rain ? "إيقاف صوت المطر" : "تشغيل صوت المطر"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M16 14v6" />
              <path d="M8 14v6" />
              <path d="M12 16v6" />
            </svg>
            <span>مطر هادئ</span>
          </button>
          <div style={volumeControlStyle}>
            <span style={volumeIconStyle}>🔉</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={volumes.rain} 
              onChange={(e) => handleVolumeChange("rain", parseFloat(e.target.value))}
              style={rangeStyle}
              disabled={!playing.rain}
            />
            <span style={volumeIconStyle}>🔊</span>
          </div>
        </div>

        {/* Ocean Sound Control */}
        <div style={soundRowStyle}>
          <button 
            onClick={() => toggleSound("ocean")} 
            style={playing.ocean ? activeSoundBtnStyle : soundBtnStyle}
            title={playing.ocean ? "إيقاف صوت البحر" : "تشغيل صوت البحر"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
            <span>أمواج البحر</span>
          </button>
          <div style={volumeControlStyle}>
            <span style={volumeIconStyle}>🔉</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={volumes.ocean} 
              onChange={(e) => handleVolumeChange("ocean", parseFloat(e.target.value))}
              style={rangeStyle}
              disabled={!playing.ocean}
            />
            <span style={volumeIconStyle}>🔊</span>
          </div>
        </div>

        {/* Meditation Zen Drone Control */}
        <div style={soundRowStyle}>
          <button 
            onClick={() => toggleSound("zen")} 
            style={playing.zen ? activeSoundBtnStyle : soundBtnStyle}
            title={playing.zen ? "إيقاف نغمة التأمل" : "تشغيل نغمة التأمل"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
            <span>رنين التأمل</span>
          </button>
          <div style={volumeControlStyle}>
            <span style={volumeIconStyle}>🔉</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={volumes.zen} 
              onChange={(e) => handleVolumeChange("zen", parseFloat(e.target.value))}
              style={rangeStyle}
              disabled={!playing.zen}
            />
            <span style={volumeIconStyle}>🔊</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styling structures
const soundRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const soundBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 18px",
  backgroundColor: "var(--bg-accent)",
  color: "var(--text-main)",
  border: "none",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontSize: "14px",
  fontFamily: "inherit",
  fontWeight: "500",
  transition: "var(--transition-normal)",
  flex: "1 0 150px",
  justifyContent: "center",
};

const activeSoundBtnStyle: React.CSSProperties = {
  ...soundBtnStyle,
  backgroundColor: "var(--color-sage)",
  color: "var(--text-light)",
  boxShadow: "0 4px 12px rgba(125, 156, 130, 0.25)",
};

const volumeControlStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flex: "1 0 180px",
};

const volumeIconStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-muted)",
};

const rangeStyle: React.CSSProperties = {
  width: "100%",
  accentColor: "var(--color-sage)",
  height: "6px",
  borderRadius: "4px",
  cursor: "pointer",
};
