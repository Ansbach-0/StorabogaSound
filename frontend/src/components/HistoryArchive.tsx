import React, { useState, useMemo } from "react";
import type { Track } from "../types";
import { DeadlockIcon } from "./DeadlockIcon";

interface HistoryArchiveProps {
  history: Track[];
  onPlayTrack?: (track: Track) => void;
  onBack?: () => void;
}

const DEFAULT_ARCHIVE_TRACKS: Track[] = [
  {
    id: "hist-01",
    title: "Resonance",
    artist: "HOME",
    album: "Odyssey",
    source: "youtube",
    duration_ms: 212000,
    artwork_url: "/assets/images/resonance_cover.jpg",
    requester: { id: "abrams", name: "Abrams", avatar_url: "" },
    url: "https://youtube.com",
    position_ms: 0,
    accent_hex: "#70F8C1",
    is_active: false,
    added_at: Date.now() - 1000 * 60 * 14,
  },
  {
    id: "hist-02",
    title: "Get Lucky",
    artist: "Daft Punk",
    album: "Random Access Memories",
    source: "youtube",
    duration_ms: 248000,
    artwork_url: "/assets/images/get_lucky_cover.jpg",
    requester: { id: "wraith", name: "Wraith", avatar_url: "" },
    url: "https://youtube.com",
    position_ms: 0,
    accent_hex: "#FFED79",
    is_active: false,
    added_at: Date.now() - 1000 * 60 * 32,
  },
  {
    id: "hist-03",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    source: "bandcamp",
    duration_ms: 243000,
    artwork_url: "/assets/images/midnight_city_cover.jpg",
    requester: { id: "infernus", name: "Infernus", avatar_url: "" },
    url: "https://bandcamp.com",
    position_ms: 0,
    accent_hex: "#8A55B3",
    is_active: false,
    added_at: Date.now() - 1000 * 60 * 55,
  },
  {
    id: "hist-04",
    title: "Strobe",
    artist: "Deadmau5",
    album: "For Lack of a Better Name",
    source: "soundcloud",
    duration_ms: 637000,
    artwork_url: "/assets/images/strobe_cover.jpg",
    requester: { id: "haze", name: "Haze", avatar_url: "" },
    url: "https://soundcloud.com",
    position_ms: 0,
    accent_hex: "#5FE69E",
    is_active: false,
    added_at: Date.now() - 1000 * 60 * 95,
  },
  {
    id: "hist-05",
    title: "Electric Feel",
    artist: "MGMT",
    album: "Oracular Spectacular",
    source: "youtube",
    duration_ms: 229000,
    artwork_url: "/assets/images/electric_feel_cover.jpg",
    requester: { id: "seven", name: "Seven", avatar_url: "" },
    url: "https://youtube.com",
    position_ms: 0,
    accent_hex: "#70F8C1",
    is_active: false,
    added_at: Date.now() - 1000 * 60 * 140,
  },
  {
    id: "hist-06",
    title: "Sailing",
    artist: "Christopher Cross",
    album: "Christopher Cross",
    source: "bandcamp",
    duration_ms: 254000,
    artwork_url: "/assets/images/sailing_cover.jpg",
    requester: { id: "lady-geist", name: "Lady Geist", avatar_url: "" },
    url: "https://bandcamp.com",
    position_ms: 0,
    accent_hex: "#8A55B3",
    is_active: false,
    added_at: Date.now() - 1000 * 60 * 210,
  },
];

function formatDuration(ms: number): string {
  if (!ms) return "0:00";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function formatTotalAirtime(tracks: Track[]): string {
  const totalMs = tracks.reduce((acc, t) => acc + (t.duration_ms || 0), 0);
  const totalSecs = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${totalSecs % 60}s`;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "RECENT";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins}m AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h AGO`;
  const days = Math.floor(hours / 24);
  return `${days}d AGO`;
}

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({
  history,
  onPlayTrack,
  onBack,
}) => {
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"recent" | "duration" | "title">("recent");

  const effectiveHistory = useMemo(() => {
    return history.length > 0 ? history : DEFAULT_ARCHIVE_TRACKS;
  }, [history]);

  // Filter & Search & Sort
  const filteredTracks = useMemo(() => {
    return effectiveHistory
      .filter((t) => {
        if (activeSourceFilter === "ALL") return true;
        return t.source?.toLowerCase() === activeSourceFilter.toLowerCase();
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.artist && t.artist.toLowerCase().includes(q)) ||
          (t.requester && t.requester.name.toLowerCase().includes(q)) ||
          (t.album && t.album.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "duration") {
          return (b.duration_ms || 0) - (a.duration_ms || 0);
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return (b.added_at || 0) - (a.added_at || 0);
      });
  }, [effectiveHistory, activeSourceFilter, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const totalCount = effectiveHistory.length;
    const totalAirtime = formatTotalAirtime(effectiveHistory);

    const requesterCounts: Record<string, number> = {};
    effectiveHistory.forEach((t) => {
      if (t.requester?.name) {
        requesterCounts[t.requester.name] = (requesterCounts[t.requester.name] || 0) + 1;
      }
    });

    let topRequester = "Unknown listener";
    let maxCount = 0;
    Object.entries(requesterCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topRequester = name;
      }
    });

    return { totalCount, totalAirtime, topRequester };
  }, [effectiveHistory]);

  const sourceFilters = [
    { id: "ALL", label: "ALL LOGS", color: "#FFED79", icon: "gold" },
    { id: "youtube", label: "YOUTUBE", color: "#E58A00", icon: "damage_weapon_color" },
    { id: "soundcloud", label: "SOUNDCLOUD", color: "#5FE69E", icon: "armor_alt" },
    { id: "bandcamp", label: "BANDCAMP", color: "#8A55B3", icon: "damage_magic_color" },
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-6 select-none animate-fadeIn pb-12">
      {/* =========================================================================
          ATMOSPHERIC ARCHIVE VAULT HEADER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-sm bg-[#161a12] border border-[#FFEFD7]/20 shadow-[0_16px_48px_rgba(0,0,0,0.9)] p-4 sm:p-6 lg:p-8 dl-skew-panel">
        <div className="absolute inset-0 paper-grain opacity-20 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ffc533] via-[#FFED79] to-[#ffc533]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-[11px] font-black uppercase tracking-widest text-[#10130D] bg-[#ffc533] px-2.5 py-0.5 transform -skew-x-6 flex items-center gap-1.5 shadow-md">
                <DeadlockIcon name="ammo_clip_size" className="w-3.5 h-3.5 text-[#10130D]" />
                <span>ARCHIVE LEDGER</span>
              </span>
              <span className="font-mono text-xs text-[#FFED79] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ffc533] animate-ping" />
                <span>{effectiveHistory.length} TRACKS LOGGED</span>
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFEFD7] deadlock-hero-title">
              TRANSMISSION ARCHIVE
            </h1>

            <p className="mt-2 text-xs font-body text-[#FFEFD7]/70">
              Complete history of tracks played in this server.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#10130D] border-2 border-[#ffc533] rounded-sm shadow-[0_0_20px_rgba(255,197,51,0.25)] transform rotate-1">
              <DeadlockIcon name="duration" className="w-5 h-5 text-[#ffc533]" />
              <div className="flex flex-col">
                <span className="font-mono text-[11px] font-black text-[#ffc533] uppercase tracking-widest">
                  TOTAL AIRTIME
                </span>
                <span className="font-display text-lg font-bold text-[#FFEFD7] leading-none">
                  {stats.totalAirtime}
                </span>
              </div>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="dl-button text-xs font-bold flex items-center gap-2"
                title="Return to Queue Roster [ESC]"
              >
                <span className="dl-key-hint">ESC</span>
                <span>BACK TO ROSTER</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROL STRIP: SOURCE FILTER TABS + SEARCH + SORTING
          ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-[#141810]/95 border border-[#FFEFD7]/20 rounded-sm dl-panel shadow-[0_12px_28px_rgba(0,0,0,0.75)]">
        {/* Source Filter Buttons */}
        <div role="tablist" aria-label="Archive source filter tabs" className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {sourceFilters.map((f) => {
            const isActive = activeSourceFilter === f.id;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Filter by ${f.label}`}
                onClick={() => setActiveSourceFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xs font-mono text-xs font-black tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#ffc533] text-[#10130D] shadow-[0_0_14px_rgba(255,197,51,0.6)] border-white border"
                    : "bg-[#181c14] text-[#FFEFD7]/70 border border-[#FFEFD7]/15 hover:border-[#ffc533]/50 hover:text-[#FFEFD7]"
                }`}
              >
                <DeadlockIcon
                  name={f.icon}
                  isDirectImg={f.icon.includes("color") || f.icon === "gold"}
                  className="w-3.5 h-3.5"
                />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="Search title, artist, requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search title, artist, or requester"
              className="w-full bg-[#0e110b] border border-[#FFEFD7]/25 px-3.5 py-1.5 pl-8 font-body text-xs text-[#FFEFD7] placeholder-[#FFEFD7]/40 rounded-xs focus:outline-none focus:border-[#ffc533] focus:shadow-[0_0_12px_rgba(255,197,51,0.3)] transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-50">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#FFEFD7]/60 hover:text-[#FF410D]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "recent" || val === "duration" || val === "title") {
                setSortBy(val);
              }
            }}
            aria-label="Sort archive records"
            className="bg-[#0e110b] text-[#FFED79] border border-[#FFEFD7]/25 px-3 py-1.5 rounded-xs font-mono text-xs focus:outline-none focus:border-[#ffc533] cursor-pointer"
          >
            <option value="recent">SORT: RECENT</option>
            <option value="duration">SORT: DURATION</option>
            <option value="title">SORT: TITLE A-Z</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          MAIN ARCHIVE CONTENT: 2-COLUMN ASYMMETRIC RECORDS WALL & LEDGER AUDIT
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        {/* =======================================================================
            LEFT COLUMN: TRANSMISSION RECORDS CATALOGUE
            ======================================================================= */}
        <main className="flex-1 w-full flex flex-col gap-4">
          {filteredTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#141810]/80 border-2 border-dashed border-[#FFEFD7]/20 rounded-sm p-8 text-center">
              <span className="text-4xl mb-2">📜</span>
              <h3 className="font-display text-2xl font-bold text-[#FFEFD7] mb-1">
                NO TRANSMISSION RECORDS FOUND
              </h3>
              <p className="font-body text-xs text-[#FFEFD7]/60 max-w-md mb-4 font-bold">
                No archived recordings match the selected source filter or search query.
              </p>
              <button
                onClick={() => {
                  setActiveSourceFilter("ALL");
                  setSearchQuery("");
                }}
                className="dl-button dl-button-amber text-xs font-bold"
              >
                RESET ARCHIVE SEARCH
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTracks.map((track, idx) => {
                const sourceColor =
                  track.source === "youtube"
                    ? "#E58A00"
                    : track.source === "soundcloud"
                    ? "#5FE69E"
                    : track.source === "bandcamp"
                    ? "#8A55B3"
                    : "#70F8C1";

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className="group relative p-4 bg-[#161a12] border border-[#FFEFD7]/20 hover:border-[#ffc533] rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.8)] transition-all duration-75 flex flex-col justify-between gap-3 overflow-hidden dl-panel"
                  >
                    <div className="absolute inset-0 paper-grain opacity-15 pointer-events-none" />

                    {/* Top Record Tag & Accession ID */}
                    <div className="relative z-10 flex items-center justify-between border-b border-[#FFEFD7]/10 pb-2 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-xs font-black uppercase text-[#10130D]"
                          style={{ backgroundColor: sourceColor }}
                        >
                          {track.source?.toUpperCase() || "AUDIO"}
                        </span>
                        <span className="text-[#FFEFD7]/50">
                          LOG #{idx + 1}
                        </span>
                      </div>

                      <span className="text-[#FFED79] font-bold">
                        {formatRelativeTime(track.added_at)}
                      </span>
                    </div>

                    {/* Middle: Artwork + Title + Artist */}
                    <div className="relative z-10 flex items-center gap-3.5">
                      {/* Album / Sleeve Cover */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xs overflow-hidden border border-[#FFEFD7]/30 shadow-md group-hover:shadow-[0_0_16px_rgba(255,197,51,0.4)] transition-all">
                        <img
                          src={track.artwork_url || "/assets/images/resonance_cover.jpg"}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-100"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/images/resonance_cover.jpg";
                          }}
                        />
                        {/* Vinyl Groove Sheen Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                      </div>

                      {/* Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#FFEFD7] truncate group-hover:text-[#FFED79] transition-colors leading-snug deadlock-hero-title">
                          {track.title}
                        </h3>
                        <p className="font-body text-xs text-[#FFEFD7]/75 font-semibold truncate">
                          {track.artist || "Unknown Artist"}
                        </p>
                        {track.album && (
                          <p className="font-body text-[11px] text-[#FFEFD7]/50 italic truncate">
                            {track.album}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Requester Info + Duration + Replay Button */}
                    <div className="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-[#FFEFD7]/10">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#FFEFD7]/70 truncate">
                        <span className="text-[#FFEFD7]/40 uppercase text-[11px]">REQ:</span>
                        <span className="font-bold text-[#FFEFD7] truncate max-w-[120px]">
                          {track.requester?.name || "Unknown listener"}
                        </span>
                        <span className="text-[#70F8C1] ml-1">
                          ({formatDuration(track.duration_ms)})
                        </span>
                      </div>

                      <button
                        onClick={() => onPlayTrack?.(track)}
                        className="dl-button dl-button-amber text-xs font-black px-3.5 py-1.5 flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer group-hover:scale-[1.02]"
                        title={`Replay ${track.title}`}
                        aria-label={`Replay ${track.title}`}
                      >
                        <span>▶</span>
                        <span>REPLAY</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flavor Quote in Footer */}
          <div className="flex items-center justify-between p-4 bg-[#141810]/80 border border-[#FFEFD7]/15 rounded-sm font-body text-[#FFEFD7]/60 text-xs mt-2">
            <span>Citadel audio transmission archives are catalogued chronologically.</span>
            <span className="font-mono text-xs font-bold text-[#ffc533]">
              AUDIT REGISTRY // SECTOR 04
            </span>
          </div>
        </main>

        {/* =======================================================================
            RIGHT COLUMN: ARCHIVE AUDIT SLIP & VAULT SUMMARY
            ======================================================================= */}
        <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="dl-receipt-tape p-5 rounded-xs transform lg:rotate-1 shadow-[0_16px_36px_rgba(0,0,0,0.85)] border border-[#FFEFD7]/20 flex flex-col gap-4 text-[#FFEFD7] bg-[#141810]">
            <div className="absolute inset-0 paper-grain opacity-25 pointer-events-none" />

            {/* Stamped Ledger Header */}
            <div className="relative z-10 text-center pb-3 border-b border-dashed border-[#FFEFD7]/30">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#ffc533]/50 mb-1.5 bg-[#10130D] shadow-[0_0_12px_rgba(255,197,51,0.3)]">
                <DeadlockIcon name="gold" isDirectImg className="w-4 h-4" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-wider text-[#FFEFD7]">
                LEDGER AUDIT RECORD
              </h3>
              <span className="font-mono text-[11px] text-[#ffc533] uppercase tracking-widest block font-bold">
                AUDIT REGISTRY // VERIFIED
              </span>
            </div>

            {/* Ledger Statistics */}
            <div className="relative z-10 flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-[#FFEFD7]/10">
                <span className="text-[#FFEFD7]/60 uppercase">TOTAL LOGGED:</span>
                <span className="font-bold text-[#FFEFD7]">{stats.totalCount} BROADCASTS</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-[#FFEFD7]/10">
                <span className="text-[#FFEFD7]/60 uppercase">AIRTIME RUNTIME:</span>
                <span className="font-bold text-[#70F8C1]">{stats.totalAirtime}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-[#FFEFD7]/10">
                <span className="text-[#FFEFD7]/60 uppercase">STORAGE FORMAT:</span>
                <span className="font-bold text-[#FFED79]">48kHz / STEREO</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-[#FFEFD7]/10">
                <span className="text-[#FFEFD7]/60 uppercase">TOP BROADCASTER:</span>
                <span className="font-bold text-[#FFEFD7] truncate max-w-[120px]">
                  {stats.topRequester}
                </span>
              </div>
            </div>

            {/* Quick Replay Top Track */}
            {filteredTracks.length > 0 && onPlayTrack && (
              <button
                onClick={() => onPlayTrack(filteredTracks[0])}
                aria-label="Replay most recent record"
                className="relative z-10 dl-button dl-button-amber w-full text-xs font-black py-2.5 shadow-lg tracking-wider cursor-pointer"
              >
                REPLAY MOST RECENT RECORD
              </button>
            )}

            {/* Stamped Barcode & Security Strip */}
            <div className="relative z-10 pt-2 flex flex-col items-center gap-1.5 opacity-75">
              <div className="w-full h-8 flex items-stretch justify-center gap-0.5 bg-[#10130D] p-1 border border-[#FFEFD7]/20">
                {Array.from({ length: 38 }).map((_, i) => (
                  <span
                    key={i}
                    className="bg-[#FFEFD7]"
                    style={{
                      width: i % 4 === 0 ? "3px" : i % 2 === 0 ? "2px" : "1px",
                      opacity: i % 3 === 0 ? 0.95 : 0.65,
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] text-[#FFEFD7]/50 tracking-widest uppercase">
                CITADEL AUDIO REPOSITORY
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
