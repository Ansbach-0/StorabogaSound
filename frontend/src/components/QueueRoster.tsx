import React from "react";
import type { Track } from "../types";
import { SoulFlame } from "./SoulFlame";
import { DeadlockIcon } from "./DeadlockIcon";

interface QueueRosterProps {
  tracks: Track[];
  currentTrackId: string | null;
  onSelectTrack?: (track: Track) => void;
}

function formatDuration(ms: number): string {
  if (!ms) return "0:00";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export const QueueRoster: React.FC<QueueRosterProps> = ({
  tracks,
  currentTrackId,
  onSelectTrack,
}) => {
  // Authentic 6-column hero selection roster wall (2 rows of 6 baseline on desktop, 1 row on mobile)
  const COLS = 6;
  const MIN_SLOTS = 12;
  const totalSlotCount = Math.max(MIN_SLOTS, Math.ceil(Math.max(tracks.length, 1) / COLS) * COLS);
  const emptySlotsCount = Math.max(0, totalSlotCount - tracks.length);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Header matching Deadlock's "SELECT HERO" style */}
      <div className="relative flex items-center justify-between pb-3.5 mb-2 border-b border-[#FFEFD7]/10">
        <div className="flex items-baseline gap-3">
          <h2 className="deadlock-select-header">
            QUEUE
          </h2>
          <span className="font-mono text-xs font-bold text-[#70F8C1] tracking-widest bg-[#70F8C1]/10 px-2 py-0.5 border border-[#70F8C1]/30">
            [{tracks.length} {tracks.length === 1 ? "TRACK" : "TRACKS"}]
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-[#FFEFD7]/50 uppercase tracking-wider">
          <span>ROSTER WALL // 6-COL</span>
        </div>
      </div>

      {/* 6-Column Portrait Hero Slot Grid (Authentic Deadlock Proportion) */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* Active / Queued Track Slots */}
          {tracks.map((track, idx) => {
            const isActive = track.id === currentTrackId || track.is_active;
            const isNew = idx >= 1 && (Date.now() - (track.added_at || 0) < 300000 || idx % 4 === 1);

            return (
              <div
                key={track.id || `track-${idx}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTrack?.(track)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTrack?.(track);
                  }
                }}
                className={`dl-slot group ${isActive ? "active" : ""}`}
                title={`${track.title} - ${track.artist || "Unknown Artist"}`}
                aria-label={`${isActive ? "Now playing: " : "Play: "}${track.title} by ${track.artist || "Unknown Artist"}`}
                aria-current={isActive ? "true" : undefined}
              >
                {/* Authentic Rising Deadlock Soul Flame Plume on Active Slot */}
                {isActive && (
                  <SoulFlame
                    variant="plume"
                    color={track.accent_hex || "#70F8C1"}
                  />
                )}

                {/* Artwork Thumbnail */}
                <img
                  src={track.artwork_url || "/assets/images/resonance_cover.jpg"}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-75 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/images/resonance_cover.jpg";
                  }}
                />

                {/* Deadlock Green Soul Flame Glow Rim on Selected Slot */}
                {isActive && (
                  <div
                    className="pointer-events-none absolute inset-0 z-3"
                    style={{
                      boxShadow: "inset 0 0 16px rgba(112, 248, 193, 0.85), 0 0 24px rgba(112, 248, 193, 0.9)",
                    }}
                  />
                )}

                {/* "NEW" Corner Badge (identical to Deadlock reference frames) */}
                {isNew && !isActive && (
                  <div className="dl-new-badge">
                    NEW
                  </div>
                )}

                {/* "PLAYING" Badge on selected */}
                {isActive && (
                  <div className="absolute top-1 left-1 bg-[#70F8C1] text-[#10130D] font-mono text-[10px] font-black px-1.5 py-0.2 rounded-xs shadow-md z-4 uppercase tracking-wider">
                    PLAYING
                  </div>
                )}

                {/* Bottom Overlay with Duration & Source */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#10130D]/95 via-[#10130D]/70 to-transparent p-1.5 pt-3.5 flex items-end justify-between z-3 pointer-events-none">
                  <span className="font-mono text-[11px] font-bold text-[#FFEFD7] leading-none">
                    {formatDuration(track.duration_ms)}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#FFED79] uppercase leading-none opacity-90">
                    {track.source === "youtube" ? "YT" : track.source === "soundcloud" ? "SC" : track.source === "bandcamp" ? "BC" : "AUD"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Empty / Reserved Hero Slots to fill the roster */}
          {Array.from({ length: emptySlotsCount }).map((_, i) => {
            const slotNum = tracks.length + i + 1;
            // Hide excessive empty slots on mobile viewports (< sm) to prevent scrolling walls
            const isExtraMobile = i >= 3;
            return (
              <div
                key={`empty-slot-${i}`}
                className={`dl-slot empty-slot flex flex-col items-center justify-center p-1.5 relative ${isExtraMobile ? "hidden sm:flex" : "flex"}`}
              >
                {/* Subtle occult center diamond glyph */}
                <div className="w-3 h-3 border border-[#FFEFD7]/20 transform rotate-45 mb-1 opacity-60" />
                <span className="font-mono text-[11px] text-[#FFEFD7]/30 font-bold">
                  #{slotNum < 10 ? `0${slotNum}` : slotNum}
                </span>

                {/* Subtle empty slot indicator icon */}
                <div className="absolute bottom-1.5 right-1.5 opacity-30">
                  <DeadlockIcon name="locked_icon" isPng className="w-3 h-3 text-[#FFEFD7]" alt="Reserved Slot" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

