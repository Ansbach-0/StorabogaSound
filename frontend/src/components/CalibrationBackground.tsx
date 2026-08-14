import React, { useEffect, useState } from "react";

interface CalibrationBackgroundProps {
  mouseX?: number;
  mouseY?: number;
}

export const CalibrationBackground: React.FC<CalibrationBackgroundProps> = ({
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
      {/* Warm Ambient Glows (Warm Backer & GoldenShine) */}
      <div
        className="absolute top-[-15%] left-[20%] w-[650px] h-[650px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #564a48 0%, #2b2219 50%, transparent 70%)",
          transform: `translate3d(${x * 12}px, ${y * 10}px, 0)`,
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #E6C694 0%, #92703C 45%, transparent 70%)",
          transform: `translate3d(${x * -14}px, ${y * -12}px, 0)`,
        }}
      />

      {/* Layer 1: Warm Machine Room Grid & Halftone Screentone */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="calib-halftone" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.3" fill="#FFEFD7" />
          </pattern>
          <pattern id="calib-schematic-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <line x1="0" y1="47.5" x2="48" y2="47.5" stroke="#564a48" strokeWidth="0.8" opacity="0.5" />
            <line x1="47.5" y1="0" x2="47.5" y2="48" stroke="#564a48" strokeWidth="0.8" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#calib-halftone)" />
        <rect width="100%" height="100%" fill="url(#calib-schematic-grid)" />
      </svg>

      {/* Layer 2: Faint Warm Copper / Gold Routing Lines */}
      <div
        className="absolute inset-6 lg:inset-10 pointer-events-none opacity-10"
        style={{
          transform: `translate3d(${x * 6}px, ${y * 5}px, 0)`,
        }}
      >
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 100 100 L 400 100 L 500 200 L 900 200 L 1100 400" stroke="#FFED79" strokeWidth="1" strokeDasharray="6 8" />
          <path d="M 200 700 L 600 700 L 700 600 L 1000 600" stroke="#E58A00" strokeWidth="1" strokeDasharray="4 6" />
          {/* Subtle Octal Socket Motif */}
          <circle cx="1050" cy="200" r="45" stroke="#FFEFD7" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="1050" cy="200" r="15" stroke="#FFED79" strokeWidth="1" />
        </svg>
      </div>

      {/* Soft Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#10130D]/30 to-[#10130D]/85 pointer-events-none" />
    </div>
  );
};
