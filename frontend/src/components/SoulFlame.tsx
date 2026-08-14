import React from "react";

interface SoulFlameProps {
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero" | "plume";
  variant?: "halo" | "plume" | "ambient";
}

export const SoulFlame: React.FC<SoulFlameProps> = ({
  color = "#70F8C1",
  className = "",
  size = "md",
  variant = "halo",
}) => {
  if (variant === "plume" || size === "plume") {
    // Authentic Deadlock Rising Soul Flame Plume (seen above selected hero cards in reference)
    return (
      <div className={`pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-24 overflow-visible z-20 ${className}`}>
        {/* Core hot white-mint flame tongue */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-16 rounded-full animate-dl-flame-core"
          style={{
            background: `linear-gradient(to top, #FFFFFF 0%, #99FFD6 40%, ${color} 80%, transparent 100%)`,
            filter: "blur(2px)",
            transformOrigin: "bottom center",
          }}
        />

        {/* Primary organic soul flame body */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-20 rounded-full animate-dl-flame-main"
          style={{
            background: `radial-gradient(ellipse at bottom, ${color} 0%, rgba(112, 248, 193, 0.7) 40%, rgba(95, 230, 158, 0.3) 70%, transparent 100%)`,
            filter: "blur(4px)",
            mixBlendMode: "screen",
            transformOrigin: "bottom center",
          }}
        />

        {/* Secondary flickering flame wisp */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-16 rounded-full animate-dl-flame-flicker"
          style={{
            background: `radial-gradient(circle at 60% 80%, #99FFD6 0%, ${color} 50%, transparent 80%)`,
            filter: "blur(6px)",
            mixBlendMode: "screen",
            transformOrigin: "bottom center",
          }}
        />

        {/* Outer ethereal ambient bloom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 rounded-full opacity-60 animate-pulse"
          style={{
            background: `radial-gradient(circle at bottom, ${color} 0%, rgba(112, 248, 193, 0.25) 50%, transparent 80%)`,
            filter: "blur(12px)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    );
  }

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-64 h-64",
    hero: "w-[480px] h-[480px]",
    plume: "w-20 h-24",
  }[size];

  return (
    <div
      className={`pointer-events-none absolute transition-all duration-300 ${sizeClasses} ${className}`}
      style={{
        background: `radial-gradient(circle, ${color} 0%, rgba(86, 143, 120, 0.45) 40%, rgba(16, 19, 13, 0) 75%)`,
        filter: "blur(28px)",
        mixBlendMode: "screen",
      }}
    />
  );
};

