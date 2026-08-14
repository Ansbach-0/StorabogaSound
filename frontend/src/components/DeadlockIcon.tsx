import React from "react";

interface DeadlockIconProps {
  name: string;
  className?: string;
  isPng?: boolean;
  isDirectImg?: boolean;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * DeadlockIcon renders official Deadlock game SVGs and HUD PNG assets.
 * 
 * - Default mode uses CSS maskImage with `backgroundColor: currentColor`,
 *   which seamlessly inherits Tailwind text color classes (text-[#70F8C1],
 *   text-[#FFED79], text-[#FF410D], group-hover:text-white, etc.).
 * - `isDirectImg={true}` renders direct <img> tag for full-color multicolored SVGs
 *   (e.g., gold, damage_magic_color, damage_weapon_color) or raw image assets.
 * - `isPng={true}` references PNG assets in /assets/icons/ (e.g., locked_icon, voice_chat_icon).
 */
export const DeadlockIcon: React.FC<DeadlockIconProps> = ({
  name,
  className = "w-5 h-5",
  isPng = false,
  isDirectImg = false,
  alt = "",
  style = {},
}) => {
  const isExplicitPng = isPng || name.endsWith(".png");
  const filename = isExplicitPng
    ? name.endsWith(".png")
      ? name
      : `${name}.png`
    : name.endsWith(".svg")
    ? name
    : `${name}.svg`;

  const src = `/assets/icons/${filename}`;

  if (isDirectImg) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`inline-block object-contain pointer-events-none select-none ${className}`}
        style={style}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt || name}
      className={`inline-block pointer-events-none select-none shrink-0 ${className}`}
      style={{
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        backgroundColor: "currentColor",
        ...style,
      }}
    />
  );
};
