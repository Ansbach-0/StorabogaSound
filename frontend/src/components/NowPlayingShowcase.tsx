import React, { useState, useEffect, useRef } from "react";
import type { Track } from "../types";
import { SoulFlame } from "./SoulFlame";
import { DeadlockIcon } from "./DeadlockIcon";

interface NowPlayingShowcaseProps {
  track: Track | null;
  positionMs: number;
  volume: number;
  onSkip: () => void;
  onPause: () => void;
  onLeave: () => void;
  onVolumeChange: (vol: number) => void;
  loadingQuery?: string | null;
}

const HERO_NAMES = [
  "abrams", "bebop", "billy", "calico", "doorman", "drifter", "dynamo",
  "familiar", "fencer", "grey_talon", "haze", "holliday", "infernus",
  "ivy", "kelvin", "lady_geist", "lash", "mcginnis", "mina", "mirage",
  "mo_krill", "necro", "paige", "paradox", "pocket", "priest", "seven",
  "shiv", "sinclair", "unicorn", "victor", "vindicta", "viscous", "vyper",
  "warden", "werewolf", "wraith", "yamato"
];

function findMatchingHero(trackTitle: string, artistName?: string | null): string | null {
  const combined = `${trackTitle} ${artistName || ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const hero of HERO_NAMES) {
    const normalized = hero.replace(/_/g, "");
    if (combined.includes(normalized)) return hero;
  }
  return null;
}

function formatTime(ms: number): string {
  if (!ms || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

export const NowPlayingShowcase: React.FC<NowPlayingShowcaseProps> = ({
  track,
  positionMs,
  volume,
  onSkip,
  onPause,
  onLeave,
  onVolumeChange,
  loadingQuery,
}) => {
  const [showVolumePopup, setShowVolumePopup] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Parallax mouse coordinates
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      targetY = (e.clientY - innerHeight / 2) / (innerHeight / 2);
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setMousePos({ x: currentX, y: currentY });
      animId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  const durationMs = track?.duration_ms || 1;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / durationMs) * 100));
  const accentColor = track?.accent_hex || "#70F8C1";
  const matchedHero = track ? findMatchingHero(track.title, track.artist) : null;

  if (loadingQuery) {
    return (
      <div className="relative w-full h-full min-h-[520px] flex flex-col justify-end p-6 lg:p-12 overflow-hidden select-none">
        <SoulFlame color="#70F8C1" size="hero" className="top-1/4 right-1/4" />
        <div className="relative z-10 flex flex-col items-end text-right">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 border-2 border-[#70F8C1] border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#70F8C1] bg-[#10130D]/80 px-2.5 py-1 border border-[#70F8C1]/40">
              NOW TRANSMITTING
            </span>
          </div>
          <h1 className="deadlock-hero-title text-4xl sm:text-5xl lg:text-6xl font-bold uppercase">
            "{loadingQuery}"
          </h1>
          <div className="mt-4 flex gap-2">
            <span className="dl-tag dl-tag-mint"><span>FETCHING STREAM</span></span>
          </div>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="relative w-full h-full min-h-[520px] flex flex-col justify-end p-6 lg:p-12 overflow-hidden select-none">
        <SoulFlame color="#FFED79" size="hero" className="top-1/3 right-1/4 opacity-40" />
        <div className="relative z-10 flex flex-col items-end text-right max-w-xl ml-auto">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FFED79] bg-[#10130D]/80 px-3 py-1 border border-[#FFED79]/40 mb-3 inline-block">
            TRANSMITTER IDLE
          </span>
          <h1 className="deadlock-hero-title text-4xl sm:text-5xl lg:text-6xl font-bold uppercase mb-3">
            STANDBY MODE
          </h1>
          <p className="font-body text-base text-[#FFEFD7]/70 mb-6">
            Enqueue a track from the queue on the left or summon audio via Discord commands to initiate playback.
          </p>
          <div className="flex gap-2">
            <span className="dl-tag dl-tag-dark"><span>DISCORD /PLAY</span></span>
            <span className="dl-tag dl-tag-mint"><span>READY</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[560px] flex flex-col justify-end p-6 lg:p-12 overflow-hidden select-none"
    >
      {/* =========================================================================
          HERO ARTWORK & CHARACTER CUTOUT PARALLAX LAYER
          ========================================================================= */}
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        style={{
          transform: `translate3d(${mousePos.x * 24}px, ${mousePos.y * 20}px, 0) scale(1.04)`,
          transition: "transform 100ms ease-out",
        }}
      >
        <img
          src={track.artwork_url || "/assets/images/resonance_cover.jpg"}
          alt={track.title}
          className="w-full h-full object-cover object-center opacity-45 filter contrast-125 saturate-125"
          onError={(e) => {
            e.currentTarget.src = "/assets/images/resonance_cover.jpg";
          }}
        />
        {/* Halftone Dot Screen on Cover */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(#FFEFD7 2px, transparent 2px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Deep atmospheric vignettes ensuring 100% text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10130D] via-[#10130D]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#10130D] via-[#10130D]/65 to-transparent" />
      </div>

      {/* Radiant Circular Radial Soul Glow directly behind hero */}
      <div
        className="absolute right-[10%] bottom-[20%] pointer-events-none z-1"
        style={{
          transform: `translate3d(${mousePos.x * 35}px, ${mousePos.y * 30}px, 0)`,
          transition: "transform 100ms ease-out",
        }}
      >
        <SoulFlame color={accentColor} size="hero" className="opacity-80" />
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT HERO SHOWCASE CONTENT & CONTROLS
          ========================================================================= */}
      <div
        className="relative z-10 flex flex-col items-end text-right max-w-2xl ml-auto w-full"
        style={{
          transform: `translate3d(${mousePos.x * 45}px, ${mousePos.y * 38}px, 0)`,
          transition: "transform 100ms ease-out",
        }}
      >
        {/* Live Status Pill & Optional Hero Crest Watermark */}
        <div className="flex items-center gap-3 mb-2.5">
          {matchedHero && (
            <img
              src={`/assets/icons/${matchedHero}.svg`}
              alt={matchedHero}
              className="h-6 max-w-[140px] object-contain opacity-80 filter drop-shadow-[0_0_8px_rgba(112,248,193,0.6)]"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#70F8C1] shadow-[0_0_10px_#70F8C1] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#70F8C1] bg-[#10130D]/90 px-3 py-0.5 border border-[#70F8C1]/40">
              NOW PLAYING
            </span>
          </div>
        </div>

        {/* Hero Track Title (Reaver display serif with 2-layer hard stamp shadow) */}
        <h1
          className="deadlock-hero-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold uppercase tracking-tight mb-3 leading-none"
          title={track.title}
        >
          {track.title}
        </h1>

        {/* Rectangular Blocky Tags (Sniper / Soaring / One Shot Kill style) */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 mb-6">
          {track.artist && (
            <span className="dl-tag dl-tag-amber">
              <span>{track.artist.toUpperCase()}</span>
            </span>
          )}

          <span className="dl-tag">
            <span>{track.source.toUpperCase()}</span>
          </span>

          {track.requester && (
            <span className="dl-tag dl-tag-spirit">
              <span>REQ: {track.requester.name.toUpperCase()}</span>
            </span>
          )}

          {track.album && (
            <span className="dl-tag dl-tag-dark">
              <span>{track.album.toUpperCase()}</span>
            </span>
          )}
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full max-w-lg mb-6 flex flex-col gap-1.5">
          <div className="flex justify-between items-center font-mono text-xs font-bold text-[#FFEFD7]">
            <span className="text-[#70F8C1] font-extrabold">{formatTime(positionMs)}</span>
            <span className="text-[#FFEFD7]/60 text-[11px] uppercase tracking-wider">
              {formatTime(track.duration_ms)}
            </span>
          </div>
          <div className="dl-progress-track rounded-xs">
            <div
              className="dl-progress-fill"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, #5fe69e 0%, ${accentColor} 80%, #99ffd6 100%)`,
              }}
            />
          </div>
        </div>

        {/* Row of Circular Ability Icons Controls (Authentic Deadlock HUD Ability Row) */}
        <div className="relative flex items-center justify-end gap-4">
          {/* Volume Popup Modal / Popover */}
          {showVolumePopup && (
            <div className="absolute bottom-16 right-0 bg-[#10130D] border border-[#70F8C1]/60 p-3.5 shadow-2xl rounded-sm z-50 flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#FFED79]">VOL</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="dl-slider w-28"
                autoFocus
              />
              <span className="font-mono text-xs font-bold text-[#FFEFD7] min-w-[32px] text-right">
                {volume}%
              </span>
            </div>
          )}

          {/* Ability 1: Play / Pause */}
          <button
            onClick={onPause}
            className="dl-ability-btn dl-ability-btn-mint group flex items-center justify-center"
            title="Pause / Resume Playback [SPACE]"
          >
            <DeadlockIcon name="pause_icon" isPng className="w-5 h-5 text-[#10130D]" alt="Pause" />
            <span className="dl-ability-key">SPACE</span>
          </button>

          {/* Ability 2: Skip Track */}
          <button
            onClick={onSkip}
            className="dl-ability-btn group flex items-center justify-center"
            title="Skip to Next Track [S]"
          >
            <DeadlockIcon name="jump_skip3_icon" isPng className="w-5 h-3.5 text-[#FFEFD7]" alt="Skip Track" />
            <span className="dl-ability-key">S</span>
          </button>

          {/* Ability 3: Loop / Replay */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`dl-ability-btn group flex items-center justify-center ${isLooping ? "dl-ability-btn-mint" : ""}`}
            title="Toggle Repeat"
          >
            <DeadlockIcon
              name="icon_infinite"
              className={`w-5 h-5 ${isLooping ? "text-[#10130D]" : "text-[#FFEFD7]"}`}
              alt="Repeat"
            />
            <span className="dl-ability-key">R</span>
          </button>

          {/* Ability 4: Disconnect / Leave Voice */}
          <button
            onClick={onLeave}
            className="dl-ability-btn dl-ability-btn-danger group flex items-center justify-center"
            title="Leave Voice Channel"
          >
            <DeadlockIcon
              name="death"
              className="w-5 h-5 text-[#FF410D] group-hover:text-white"
              alt="Leave Voice"
            />
            <span className="dl-ability-key">L</span>
          </button>

          {/* Ability 5: Volume Control Dial */}
          <button
            onClick={() => setShowVolumePopup(!showVolumePopup)}
            className={`dl-ability-btn group flex items-center justify-center ${showVolumePopup ? "dl-ability-btn-mint" : ""}`}
            title={`Volume: ${volume}%`}
          >
            <DeadlockIcon
              name="voice_chat_icon"
              isPng
              className={`w-5 h-4.5 ${showVolumePopup ? "text-[#10130D]" : "text-[#FFEFD7]"}`}
              alt="Volume"
            />
            <span className="dl-ability-key">{volume}%</span>
          </button>
        </div>
      </div>
    </div>
  );
};

