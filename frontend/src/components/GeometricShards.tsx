import React, { useEffect, useState } from "react";

interface GeometricShardsProps {
  accentColor?: string;
  mouseX?: number;
  mouseY?: number;
}

export const GeometricShards: React.FC<GeometricShardsProps> = ({
  accentColor = "#70F8C1",
  mouseX: externalMouseX,
  mouseY: externalMouseY,
}) => {
  // Internal mouse state if not passed from parent
  const [internalMouse, setInternalMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (externalMouseX !== undefined && externalMouseY !== undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isRunning = false;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      targetY = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setInternalMouse({ x: currentX, y: currentY });

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        isRunning = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [externalMouseX, externalMouseY]);

  const x = externalMouseX !== undefined ? externalMouseX : internalMouse.x;
  const y = externalMouseY !== undefined ? externalMouseY : internalMouse.y;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
      {/* =========================================================================
          LAYER 0: Halftone Polka Dots / Screentone Shader Grid (Comic / Printmaking)
          ========================================================================= */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Halftone Dot Pattern 1 - Dense Comic Dots */}
          <pattern id="dl-halftone-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx="2" cy="2" r="1.8" fill="#FFEFD7" />
            <circle cx="10" cy="10" r="1.8" fill="#FFEFD7" />
            <circle cx="2" cy="10" r="0.9" fill={accentColor} opacity="0.6" />
            <circle cx="10" cy="2" r="0.9" fill={accentColor} opacity="0.6" />
          </pattern>
          {/* Halftone Dot Pattern 2 - Coarse Poster Dots */}
          <pattern id="dl-coarse-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx="6" cy="6" r="3.5" fill="#FFEFD7" opacity="0.4" />
            <circle cx="20" cy="20" r="3.5" fill="#FFEFD7" opacity="0.4" />
            <circle cx="6" cy="20" r="1.5" fill={accentColor} opacity="0.8" />
            <circle cx="20" cy="6" r="1.5" fill={accentColor} opacity="0.8" />
          </pattern>
        </defs>

        {/* Diagonal Halftone Masked Bands */}
        <rect
          x="40%"
          y="-20%"
          width="80%"
          height="140%"
          fill="url(#dl-halftone-dots)"
          transform={`rotate(-15) translate(${x * 15}, ${y * 15})`}
          style={{ mixBlendMode: "overlay" }}
        />
        <rect
          x="20%"
          y="40%"
          width="60%"
          height="80%"
          fill="url(#dl-coarse-dots)"
          transform={`rotate(12) translate(${x * 22}, ${y * 22})`}
          style={{ mixBlendMode: "color-dodge" }}
        />
      </svg>

      {/* =========================================================================
          LAYER 1: Occult Astrological Mandala & Celestial Dial (Behind Hero)
          ========================================================================= */}
      <div
        className="absolute right-[-10vw] top-[5vh] lg:right-[8vw] lg:top-[12vh] w-[540px] h-[540px] lg:w-[680px] lg:h-[680px] pointer-events-none opacity-25"
        style={{
          transform: `translate3d(${x * 18}px, ${y * 18}px, 0) scale(1)`,
          transition: "transform 80ms ease-out",
        }}
      >
        <svg
          className="w-full h-full animate-dl-spin-slow"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Orbit Circle */}
          <circle cx="300" cy="300" r="280" stroke="#FFEFD7" strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />
          <circle cx="300" cy="300" r="260" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
          <circle cx="300" cy="300" r="240" stroke="#FFEFD7" strokeWidth="0.8" strokeDasharray="12 4" opacity="0.4" />

          {/* Astrological Degree Ticks (36 Ticks) */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const x1 = 300 + 260 * Math.cos(angle);
            const y1 = 300 + 260 * Math.sin(angle);
            const isMajor = i % 3 === 0;
            const r2 = isMajor ? 246 : 252;
            const x2 = 300 + r2 * Math.cos(angle);
            const y2 = 300 + r2 * Math.sin(angle);
            return (
              <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? accentColor : "#FFEFD7"}
                strokeWidth={isMajor ? 1.8 : 0.8}
                opacity={isMajor ? 0.8 : 0.4}
              />
            );
          })}

          {/* Concentric Mid Rings */}
          <circle cx="300" cy="300" r="180" stroke="#FFEFD7" strokeWidth="1.2" opacity="0.5" />
          <circle cx="300" cy="300" r="140" stroke={accentColor} strokeWidth="2" strokeDasharray="8 6" opacity="0.8" />
          <circle cx="300" cy="300" r="90" stroke="#FFEFD7" strokeWidth="1" opacity="0.6" />
          <circle cx="300" cy="300" r="30" stroke={accentColor} strokeWidth="2" opacity="0.9" fill={`${accentColor}15`} />

          {/* 12-Spoke Radial Rays */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 300 + 30 * Math.cos(angle);
            const y1 = 300 + 30 * Math.sin(angle);
            const x2 = 300 + 280 * Math.cos(angle);
            const y2 = 300 + 280 * Math.sin(angle);
            return (
              <line
                key={`ray-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFEFD7"
                strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
                strokeDasharray={i % 2 === 0 ? "none" : "6 4"}
                opacity={i % 3 === 0 ? 0.6 : 0.3}
              />
            );
          })}

          {/* Inscribed Sacred Hexagram / Dual Triangles */}
          <polygon
            points="300,60 495,390 105,390"
            stroke={accentColor}
            strokeWidth="1.5"
            opacity="0.45"
            fill="none"
          />
          <polygon
            points="300,540 495,210 105,210"
            stroke="#FFEFD7"
            strokeWidth="1"
            opacity="0.3"
            fill="none"
          />

          {/* Orbital Celestial Nodes */}
          <circle cx="300" cy="40" r="6" fill={accentColor} stroke="#10130D" strokeWidth="2" />
          <circle cx="560" cy="300" r="5" fill="#FFED79" stroke="#10130D" strokeWidth="2" />
          <circle cx="300" cy="560" r="6" fill={accentColor} stroke="#10130D" strokeWidth="2" />
          <circle cx="40" cy="300" r="5" fill="#FFED79" stroke="#10130D" strokeWidth="2" />
          <circle cx="484" cy="484" r="4" fill="#8A55B3" />
          <circle cx="116" cy="116" r="4" fill="#8A55B3" />
        </svg>
      </div>

      {/* =========================================================================
          LAYER 2: Angular Geometric Speed Wedges & Color Shards (Deadlock Construction)
          ========================================================================= */}
      {/* Primary Hero Accent Speed Shard (Right-to-Center Wedge) */}
      <div
        className="absolute right-0 top-[10%] w-[55vw] h-[75vh] pointer-events-none opacity-30"
        style={{
          clipPath: "polygon(35% 0%, 100% 12%, 88% 92%, 0% 100%)",
          background: `linear-gradient(135deg, ${accentColor} 0%, rgba(229, 138, 0, 0.45) 50%, rgba(16, 19, 13, 0.8) 100%)`,
          transform: `translate3d(${x * 30}px, ${y * 24}px, 0) rotate(-8deg)`,
          filter: "drop-shadow(0 0 50px rgba(0,0,0,0.9))",
          transition: "transform 100ms ease-out",
        }}
      >
        {/* Halftone texture overlay inside shard */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(#FFEFD7 2px, transparent 2px)",
            backgroundSize: "16px 16px",
          }}
        />
      </div>

      {/* Secondary Warm Backer & Spirit Purple Shard (Contrast Wedge) */}
      <div
        className="absolute right-[18%] top-[25%] w-[38vw] h-[55vh] pointer-events-none opacity-22"
        style={{
          clipPath: "polygon(0% 15%, 85% 0%, 100% 85%, 15% 100%)",
          background: "linear-gradient(220deg, #8A55B3 0%, #564a48 60%, transparent 100%)",
          transform: `translate3d(${x * -24}px, ${y * -18}px, 0) rotate(22deg)`,
          transition: "transform 100ms ease-out",
        }}
      >
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(#FFEFD7 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>

      {/* Tertiary Amber Speed Slash (Lower Cross Wedge) */}
      <div
        className="absolute right-[5%] bottom-[5%] w-[48vw] h-[35vh] pointer-events-none opacity-18"
        style={{
          clipPath: "polygon(12% 0%, 100% 35%, 85% 100%, 0% 70%)",
          background: "linear-gradient(45deg, rgba(255, 197, 51, 0.6) 0%, #FF410D 60%, transparent 100%)",
          transform: `translate3d(${x * 40}px, ${y * 32}px, 0) rotate(-4deg)`,
          transition: "transform 100ms ease-out",
        }}
      />

      {/* =========================================================================
          LAYER 3: Aerodynamic Kinetic Speed Sweeps & Blade Arcs (Apollo / Vindicta)
          ========================================================================= */}
      <svg
        className="absolute right-0 top-[15%] w-[60vw] h-[70vh] pointer-events-none opacity-25"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `translate3d(${x * 45}px, ${y * 36}px, 0)`,
          transition: "transform 100ms ease-out",
        }}
      >
        <path
          d="M 800 100 C 500 200, 300 400, 100 580"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.7"
          style={{ filter: "drop-shadow(0 0 12px currentColor)" }}
        />
        <path
          d="M 800 160 C 550 250, 380 430, 200 600"
          stroke="#FFED79"
          strokeWidth="2"
          strokeDasharray="16 8"
          opacity="0.5"
        />
        <path
          d="M 800 60 C 450 180, 250 360, 50 520"
          stroke="#FF410D"
          strokeWidth="1.5"
          opacity="0.4"
        />
      </svg>

      {/* =========================================================================
          LAYER 4: Floating Soul Embers & Drifting Dust Particles
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[30%] w-1.5 h-1.5 rounded-full bg-[#70F8C1] shadow-[0_0_8px_#70F8C1] animate-dl-float-slow opacity-60" />
        <div className="absolute top-[45%] right-[15%] w-2 h-2 rounded-full bg-[#FFED79] shadow-[0_0_10px_#FFED79] animate-dl-float-medium opacity-50" />
        <div className="absolute top-[65%] right-[25%] w-1 h-1 rounded-full bg-[#70F8C1] shadow-[0_0_6px_#70F8C1] animate-dl-float-fast opacity-70" />
        <div className="absolute top-[30%] right-[45%] w-1.5 h-1.5 rounded-full bg-[#99FFD6] shadow-[0_0_8px_#99FFD6] animate-dl-float-slow opacity-40" />
      </div>
    </div>
  );
};

