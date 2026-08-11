import type { Track } from "../types";

export interface HistoryProps {
  tracks: Track[];
}

function formatMs(ms: number): string {
  if (!ms || isNaN(ms)) return "00:00";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatRelativeTime(epochMs: number): string {
  if (!epochMs) return "";
  const now = Date.now();
  const diffMs = Math.max(0, now - epochMs);
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function History({ tracks }: HistoryProps) {
  return (
    <section className="ledger-container paper-sculpted-panel w-full h-full p-8 flex flex-col relative overflow-hidden">
      {/* Background Watermark */}
      <div className="watermark-bg select-none">HISTORY</div>

      {/* Ledger Header */}
      <div className="ledger-header relative z-10 flex flex-col gap-2 mb-4">
        <h2 className="ledger-title im-fell-title stamped-title font-serif text-3xl font-bold text-[#FFEFD7]">
          History
        </h2>
        <span className="text-xs font-mono text-[#C6C6C6] tracking-widest uppercase">
          Recently played tracks
        </span>
        <div className="deco-divider w-full h-0.5 my-2" />
      </div>

      {/* Scrollable Horizontal Lines Ledger List */}
      <div className="ledger-list relative z-10 flex-1 overflow-y-auto flex flex-col">
        {tracks && tracks.length > 0 ? (
          tracks.map((track, idx) => (
            <div
              key={track.id || idx}
              className="ledger-row flex items-center justify-between py-4 px-5 border-b border-[#E58A00]/15 hover:bg-[#564a48]/30 transition-colors odd:bg-[#141611]/40"
            >
              {/* Left: Index & Track Title */}
              <div className="ledger-left flex items-center gap-6 flex-1">
                <span className="ledger-index font-mono font-semibold text-xs text-[#55503E] w-8">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="ledger-track-title stamped-title font-serif text-base font-bold text-[#FFEFD7] truncate">
                  {track.title}
                </span>
              </div>

              {/* Center: Artist */}
              <div className="ledger-center flex-1 hidden sm:flex items-center">
                <span className="ledger-artist font-sans text-sm text-[#55503E] truncate">
                  {track.artist || "Unknown Artist"}
                </span>
              </div>

              {/* Right: Requester, Time Ago & Duration */}
              <div className="ledger-right flex items-center gap-6 flex-shrink-0">
                {track.requester && (
                  <span className="text-xs font-mono text-[#5FE69E] hidden md:inline truncate max-w-[120px]">
                    {track.requester.name}
                  </span>
                )}
                <span className="ledger-time-ago font-mono text-xs font-medium text-[#C6C6C6] uppercase">
                  {track.added_at ? formatRelativeTime(track.added_at) : "recently"}
                </span>
                <span className="ledger-duration font-mono text-xs text-[#FFED79] min-w-[48px] text-right">
                  {formatMs(track.duration_ms)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="font-mono text-sm text-[#C6C6C6] tracking-wider">
              No tracks have been played yet
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default History;
