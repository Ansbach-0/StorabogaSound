import React, { useEffect, useState } from "react";

interface ArchiveBackgroundProps {
  mouseX?: number;
  mouseY?: number;
}

export const ArchiveBackground: React.FC<ArchiveBackgroundProps> = ({
  mouseX: externalMouseX,
  mouseY: externalMouseY,
}) => {
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
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
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
      {/* Warm Ambient Radial Glows (goldenShine and warm backer) */}
      <div
        className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #E6C694 0%, #92703C 40%, transparent 70%)",
          transform: `translate3d(${x * 15}px, ${y * 12}px, 0)`,
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[10%] w-[700px] h-[700px] rounded-full opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #564a48 0%, #2b2219 50%, transparent 70%)",
          transform: `translate3d(${x * -18}px, ${y * -15}px, 0)`,
        }}
      />

      {/* Layer 1: Warm Halftone Dot Matrix Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-12 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="archive-halftone" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.5" fill="#FFEFD7" />
          </pattern>
          <pattern id="archive-subtle-lines" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <line x1="0" y1="47.5" x2="48" y2="47.5" stroke="#564a48" strokeWidth="0.8" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#archive-halftone)" />
        <rect width="100%" height="100%" fill="url(#archive-subtle-lines)" />
      </svg>

      {/* Layer 2: Faint Art-Deco Ledger Ruling & Framing (Cream & Amber) */}
      <div
        className="absolute inset-4 lg:inset-8 border border-[#FFEFD7]/8 pointer-events-none"
        style={{
          transform: `translate3d(${x * 4}px, ${y * 4}px, 0)`,
        }}
      >
        {/* Corner Art Deco Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FFED79]/25" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FFED79]/25" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FFED79]/25" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FFED79]/25" />
      </div>

      {/* Layer 3: Understated Vintage Vinyl / Spool Rings (Very faint, warm amber) */}
      <div
        className="absolute right-[-10vw] bottom-[-15vh] w-[550px] h-[550px] opacity-10 pointer-events-none"
        style={{
          transform: `translate3d(${x * 10}px, ${y * 8}px, 0)`,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="250" cy="250" r="240" stroke="#FFEFD7" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="250" cy="250" r="200" stroke="#FFED79" strokeWidth="1" />
          <circle cx="250" cy="250" r="150" stroke="#564a48" strokeWidth="1.5" />
          <circle cx="250" cy="250" r="90" stroke="#FFEFD7" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="250" cy="250" r="30" stroke="#FFED79" strokeWidth="1.5" fill="#10130D" />
        </svg>
      </div>

      {/* Soft Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#10130D]/30 to-[#10130D]/80 pointer-events-none" />
    </div>
  );
};
