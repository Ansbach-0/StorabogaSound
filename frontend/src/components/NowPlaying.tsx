import React, { useState } from "react";
import type { User, Track, QueueState } from "../types";

export interface NowPlayingProps {
  user: User;
  nowPlaying: Track | null;
  queue: QueueState | null;
  positionMs: number;
  onSkip: () => void;
  onPause: () => void;
  onLeave: () => void;
  isPaused: boolean;
  subView?: "now-playing" | "queue";
}

function formatMs(ms: number): string {
  if (!ms || isNaN(ms)) return "00:00";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function NowPlaying({
  user,
  nowPlaying,
  queue,
  positionMs,
  onSkip,
  onPause,
  onLeave,
  isPaused,
  subView = "now-playing",
}: NowPlayingProps) {
  const [removedTrackIds, setRemovedTrackIds] = useState<string[]>([]);
  const isMod = user?.tier === "moderator" || user?.tier === "admin";

  const durationMs = nowPlaying?.duration_ms || 0;
  const progressRatio = durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;
  const activeSegments = Math.min(12, Math.max(0, Math.round(progressRatio * 12)));

  // Filter out the active track from queue list, plus any locally removed tracks
  const upcomingTracks = (queue?.tracks || [])
    .filter((t) => (nowPlaying ? t.id !== nowPlaying.id && !t.is_active : true))
    .filter((t) => !removedTrackIds.includes(t.id));

  const handleRemoveTrack = (id: string) => {
    setRemovedTrackIds((prev) => [...prev, id]);
  };

  const handleClearQueue = () => {
    const allIds = upcomingTracks.map((t) => t.id);
    setRemovedTrackIds((prev) => [...prev, ...allIds]);
  };

  const showSpotlight = subView === "now-playing" || subView === undefined;
  const showQueue = subView === "queue" || subView === undefined;

  return (
    <section
      className="now-playing-region w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-6 overflow-y-auto"
      style={{ "--accent-dynamic": nowPlaying?.accent_hex || "#70F8C1" } as React.CSSProperties}
    >
      {/* Spotlight Card (Now Playing) */}
      <div
        className={`spotlight-card paper-sculpted-panel dl-card state-now-playing lg:col-span-6 flex flex-col justify-between ${
          !showSpotlight && subView === "queue" ? "hidden lg:flex" : ""
        }`}
        style={{ animation: "breathNowPlaying 4s infinite ease-in-out" }}
      >
        {nowPlaying ? (
          <>
            <div className="spotlight-top-row flex gap-5">
              <div className="spotlight-art-wrapper relative w-44 h-44 flex-shrink-0">
                <div className="art-halo-drift absolute -inset-4 rounded-full pointer-events-none" />
                <div className="spotlight-art-box relative z-10 w-full h-full border-2 border-[#70F8C1] shadow-2xl bg-[#10130D] overflow-hidden">
                  {nowPlaying.artwork_url ? (
                    <img
                      src={nowPlaying.artwork_url}
                      alt={nowPlaying.title}
                      className="spotlight-art-img w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#2A2D25] to-[#10130D]">
                      <div className="summoning-circle w-20 h-20 flex items-center justify-center border border-[#70F8C1]/40 rounded-full animate-pulse">
                        <span className="text-[#70F8C1] text-xs font-mono">OPUS</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="spotlight-details flex flex-col justify-center gap-1.5 flex-1 min-w-0">
                <div className="spotlight-tag-bar flex items-center gap-2">
                  <span className="spotlight-badge bg-[#33e59f] text-[#10130D] font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
                    Now Playing
                  </span>
                  <span className="genre-chip font-mono text-[9px] text-[#FFEFD7] bg-[#333]/60 border border-[#FFEFD7]/15 px-2 py-0.5 uppercase">
                    {nowPlaying.source.toUpperCase()}
                  </span>
                </div>

                <h2
                  className="spotlight-title stamped-title font-serif text-2xl font-bold truncate text-[#FFEFD7]"
                  title={nowPlaying.title}
                >
                  {nowPlaying.title}
                </h2>
                <span className="spotlight-artist font-sans font-bold text-lg text-[var(--flux,#70F8C1)] truncate">
                  {nowPlaying.artist || "Unknown Artist"}
                </span>
                {nowPlaying.album && (
                  <span className="spotlight-album font-sans text-xs text-[#55503E] truncate">
                    {nowPlaying.album}
                  </span>
                )}

                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#5FE69E]">
                  {nowPlaying.requester.avatar_url ? (
                    <img
                      src={nowPlaying.requester.avatar_url}
                      alt={nowPlaying.requester.name}
                      className="w-4 h-4 rounded-full border border-[#5FE69E]/40"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#8A55B3] text-white text-[9px] font-bold flex items-center justify-center">
                      {nowPlaying.requester.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>Requested by {nowPlaying.requester.name}</span>
                </div>
              </div>
            </div>

            {/* Playback Progress Section */}
            <div className="progress-section flex flex-col gap-2 mt-4">
              <div className="progress-labels flex justify-between font-mono text-xs text-[#C6C6C6]">
                <span className="progress-title-label tracking-widest uppercase">Position</span>
                <span className="progress-time-display font-bold text-[#FFED79]">
                  {formatMs(positionMs)} / {formatMs(nowPlaying.duration_ms)}
                </span>
              </div>

              {/* 12 Segment Progress Bar */}
              <div className="threshold-progress-track w-full h-7 bg-[#10130D]/95 border border-[#FFEFD7]/18 p-1 flex gap-0.5 items-center">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className={`progress-segment flex-1 h-full border border-[#5C4A2A]/40 transition-all duration-75 ${
                      i < activeSegments
                        ? "active bg-gradient-to-b from-[#70F8C1] via-[#33e59f] to-[#1f4f3c] border-[#70F8C1]/60 shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                        : "bg-[#2e281c]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Transport Controls */}
            <div className="controls-row flex items-center justify-between gap-3 mt-4">
              <button
                onClick={onPause}
                disabled={!isMod}
                className={`tactile-btn flex-1 py-3 px-4 font-serif font-bold text-sm tracking-wider uppercase label-glyph transition-transform active:scale-95 ${
                  isPaused
                    ? "bg-gradient-to-r from-[#FFED79] to-[#ffc533] text-[#10130D]"
                    : "btn-primary-highlight bg-gradient-to-r from-[#9AFFD6] to-[#33e59f] text-[#10130D]"
                } ${!isMod ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isMod ? "Pause / Resume playback" : "Moderator role required to pause"}
              >
                <span className="speckle-label flex items-center gap-2 justify-center">
                  {isPaused ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 2l9 5-9 5V2z" />
                      </svg>
                      RESUME
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 2v10M10 2v10" />
                      </svg>
                      PAUSE
                    </>
                  )}
                </span>
              </button>

              <button
                onClick={onSkip}
                className="tactile-btn flex-1 py-3 px-4 bg-[#383731] hover:bg-[#48463f] text-[#FFEFD7] font-serif font-bold text-sm tracking-wider uppercase label-glyph transition-transform active:scale-95"
                title="Skip to next track"
              >
                <span className="speckle-label flex items-center gap-2 justify-center">
                  SKIP
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 2l8 5-8 5V2zM12 2v10" />
                  </svg>
                </span>
              </button>
            </div>

            <div className="connection-row mt-3 pt-3 border-t border-[#FFED79]/15">
              <button
                onClick={onLeave}
                disabled={!isMod}
                className={`tactile-btn btn-destructive btn-leave w-full py-2.5 px-4 font-serif font-bold text-xs tracking-wider uppercase label-glyph transition-transform active:scale-95 ${
                  !isMod ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title={isMod ? "Disconnect bot and clear queue" : "Moderator role required to disconnect"}
              >
                <span className="speckle-label flex items-center gap-2 justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 2l10 10M12 2L2 12" />
                  </svg>
                  LEAVE VOICE
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="summoning-circle w-32 h-32 flex flex-col items-center justify-center p-4 mb-6 animate-pulse border border-[#70F8C1]/40 rounded-full">
              <span className="text-[#70F8C1] text-xs font-mono tracking-widest">IDLE</span>
            </div>
            <h3 className="stamped-title text-xl font-serif font-bold text-[#FFEFD7] mb-2">
              No track is currently playing
            </h3>
            <p className="font-mono text-xs text-[#C6C6C6] max-w-sm">
              Play audio by using <span className="text-[#70F8C1]">/play &lt;query&gt;</span> in your Discord server.
            </p>
          </div>
        )}
      </div>

      {/* Queue Card */}
      <div
        className={`queue-card paper-sculpted-panel lg:col-span-6 flex flex-col gap-4 min-h-[400px] ${
          !showQueue && subView === "now-playing" ? "hidden lg:flex" : ""
        }`}
      >
        <div className="queue-header flex items-center justify-between pb-2.5 border-b border-[#FFEFD7]/12">
          <h3 className="queue-title stamped-title font-serif font-bold text-lg text-[#FFEFD7]">
            Upcoming Track Queue
          </h3>
          <div className="queue-header-actions flex items-center gap-3">
            <button
              onClick={handleClearQueue}
              disabled={upcomingTracks.length === 0}
              className="queue-clear-btn font-serif font-bold text-[10px] tracking-wider uppercase text-[#FFEFD7] bg-[#FF410D]/20 border border-[#FF410D]/40 px-2.5 py-1 hover:bg-[#FF410D]/45 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Clear entire queue"
            >
              <span className="speckle-label">CLEAR</span>
            </button>
            <span className="queue-count-badge font-mono text-xs font-bold text-[#ffc533]">
              {upcomingTracks.length} IN QUEUE
            </span>
          </div>
        </div>

        {/* Scrollable Queue List */}
        <div className="queue-list flex flex-col gap-2.5 overflow-y-auto flex-1 max-h-[500px] pr-1">
          {upcomingTracks.length > 0 ? (
            upcomingTracks.map((track, idx) => (
              <div
                key={track.id}
                className="queue-item-row flex items-center justify-between p-2.5 bg-gradient-to-r from-[#2D3026]/75 to-[#191B15]/85 border border-[#FFEFD7]/08 hover:border-[#FFEFD7]/25 hover:translate-x-1 transition-all"
              >
                <div className="queue-item-left flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="queue-drag-handle font-mono text-sm text-[#55503E] cursor-grab" title="Drag handle">
                    ⋮⋮
                  </span>
                  <div className="queue-index-badge font-mono font-bold text-xs text-[#10130D] bg-[#ffc533] w-6 h-6 flex items-center justify-center shadow-md flex-shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  {track.artwork_url ? (
                    <img
                      src={track.artwork_url}
                      alt={track.title}
                      className="queue-art-mini w-9 h-9 object-cover border border-[#FFEFD7]/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="queue-art-mini w-9 h-9 bg-[#333] border border-[#FFEFD7]/20 flex items-center justify-center text-[10px] font-mono text-[#70F8C1] flex-shrink-0">
                      ♪
                    </div>
                  )}
                  <div className="queue-track-meta flex flex-col truncate min-w-0">
                    <span className="queue-track-name stamped-title font-serif font-bold text-sm text-[#FFEFD7] truncate">
                      {track.title}
                    </span>
                    <span className="queue-artist-name font-sans text-xs text-[#55503E] truncate">
                      {track.artist || "Unknown Artist"}
                    </span>
                  </div>
                </div>

                <div className="queue-item-right flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="queue-duration font-mono text-xs text-[#FFED79]">
                    {formatMs(track.duration_ms)}
                  </span>
                  {track.requester && (
                    <div className="flex items-center" title={`Requested by ${track.requester.name}`}>
                      {track.requester.avatar_url ? (
                        <img
                          src={track.requester.avatar_url}
                          alt={track.requester.name}
                          className="w-5 h-5 rounded-full border border-[#FFEFD7]/20"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#8A55B3] text-white text-[10px] font-bold flex items-center justify-center">
                          {track.requester.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onSkip}
                    className="queue-play-btn text-[#FFEFD7]/40 hover:text-[#70F8C1] hover:scale-125 cursor-pointer p-1 transition-all"
                    title="Jump to play track"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 2l9 5-9 5V2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(track.id)}
                    className="queue-remove-btn text-[#FFEFD7]/40 hover:text-[#FF410D] hover:scale-125 cursor-pointer p-1 transition-all"
                    title="Remove from queue"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 2l10 10M12 2L2 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#C6C6C6]">
              <span className="font-mono text-xs tracking-wider">Queue is empty</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default NowPlaying;
