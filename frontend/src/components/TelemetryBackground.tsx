import React, { useEffect, useState } from "react";

interface TelemetryBackgroundProps {
  mouseX?: number;
  mouseY?: number;
}

export const TelemetryBackground: React.FC<TelemetryBackgroundProps> = ({
  mouseX: externalMouseX,
  mouseY: externalMouseY,
}) => {
  const [internalMouse, setInternalMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (externalMouseX !== undefined && externalMouseY !== undefined) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      targetY = (e.clientY - innerHeight / 2) / (innerHeight / 2);
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setInternalMouse({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [externalMouseX, externalMouseY]);

  const x = externalMouseX !== undefined ? externalMouseX : internalMouse.x;
  const y = externalMouseY !== undefined ? externalMouseY : internalMouse.y;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
      {/* Warm Occult Radial Glows (SoulShine & Warm Backer) */}
      <div
        className="absolute top-[-10%] right-[10%] w-[650px] h-[650px] rounded-full opacity-18 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #9AFFD6 0%, #568F78 45%, transparent 70%)",
          transform: `translate3d(${x * -16}px, ${y * -12}px, 0)`,
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[5%] w-[700px] h-[700px] rounded-full opacity-22 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #564a48 0%, #1f1814 55%, transparent 70%)",
          transform: `translate3d(${x * 14}px, ${y * 10}px, 0)`,
        }}
      />

      {/* Layer 1: Subtle Halftone Dot Matrix Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-12 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="telemetry-halftone" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.2" fill="#70F8C1" opacity="0.8" />
          </pattern>
          <pattern id="telemetry-subtle-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <line x1="0" y1="59.5" x2="60" y2="59.5" stroke="#564a48" strokeWidth="0.6" opacity="0.4" />
            <line x1="59.5" y1="0" x2="59.5" y2="60" stroke="#564a48" strokeWidth="0.6" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#telemetry-halftone)" />
        <rect width="100%" height="100%" fill="url(#telemetry-subtle-grid)" />
      </svg>

      {/* Layer 2: Faint Hideout Architecture & Deco Sigil Geometry */}
      <div
        className="absolute inset-4 lg:inset-8 pointer-events-none opacity-10"
        style={{
          transform: `translate3d(${x * 6}px, ${y * 6}px, 0)`,
        }}
      >
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Faint Occult Energy Relays */}
          <path d="M 0 200 L 400 200 L 600 400 L 1200 400" stroke="#70F8C1" strokeWidth="1.2" strokeDasharray="6 12" />
          <path d="M 0 600 L 600 600 L 800 400 L 1200 400" stroke="#FFED79" strokeWidth="1" strokeDasharray="4 8" />
          {/* Decorative Ring Hubs */}
          <circle cx="600" cy="400" r="120" stroke="#FFEFD7" strokeWidth="1" strokeDasharray="8 8" />
          <circle cx="600" cy="400" r="40" stroke="#70F8C1" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#10130D]/30 to-[#10130D]/85 pointer-events-none" />
    </div>
  );
};
