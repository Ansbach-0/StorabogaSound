import { useState, useEffect, useCallback } from "react";
import type { ViewName, User, Track, ServerSettings, BotStatus } from "./types";
import {
  getMe,
  logout,
  postSkip,
  postPause,
  postLeave,
  getHistory,
  postVolume,
  getSettings,
  getStatus,
} from "./api";
import { useSSE } from "./useSSE";
import NowPlaying from "./components/NowPlaying";
import Login from "./components/Login";
import History from "./components/History";
import Settings from "./components/Settings";
import Status from "./components/Status";
import Admin from "./components/Admin";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewName>("dashboard");
  const [subView, setSubView] = useState<"now-playing" | "queue">("now-playing");
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [historyTracks, setHistoryTracks] = useState<Track[]>([]);
  const [volume, setVolume] = useState(50);
  const [serverSettings, setServerSettings] = useState<ServerSettings>({
    default_volume: 50,
    dj_role_id: null,
  });
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);

  const sse = useSSE();

  const fetchAuth = useCallback(async () => {
    try {
      const currentUser = await getMe();
      setUser(currentUser);
      if (!currentUser) {
        setView("login");
      }
    } catch {
      setUser(null);
      setView("login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  useEffect(() => {
    if (view === "history") {
      getHistory()
        .then((data) => setHistoryTracks(data || []))
        .catch(() => setHistoryTracks([]));
    } else if (view === "settings") {
      getSettings()
        .then((data) => {
          if (data) {
            setServerSettings(data);
            if (data.default_volume !== undefined) {
              setVolume(data.default_volume);
            }
          }
        })
        .catch((err) => console.error("Failed to fetch server settings", err));
    } else if (view === "status") {
      getStatus()
        .then((data) => {
          if (data) setBotStatus(data);
        })
        .catch((err) => console.error("Failed to fetch status", err));
    }
  }, [view]);

  // Status view auto-refresh timer (5s)
  useEffect(() => {
    if (view !== "status") return;
    const interval = setInterval(() => {
      getStatus()
        .then((data) => {
          if (data) setBotStatus(data);
        })
        .catch((err) => console.error("Failed to refresh status", err));
    }, 5000);
    return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
    setIsPaused(false);
  }, [sse.nowPlaying?.id]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setView("login");
  };

  const handleSkip = async () => {
    try {
      await postSkip();
    } catch (err) {
      console.error("Failed to skip track", err);
    }
  };

  const handlePause = async () => {
    try {
      const res = await postPause();
      setIsPaused(res.paused);
    } catch (err) {
      console.error("Failed to toggle pause", err);
    }
  };

  const handleLeave = async () => {
    try {
      await postLeave();
    } catch (err) {
      console.error("Failed to leave voice channel", err);
    }
  };

  const handleVolumeChange = async (newVal: number) => {
    setVolume(newVal);
    try {
      await postVolume(newVal);
    } catch (err) {
      console.error("Failed to set volume", err);
    }
  };

  const handleSaveSettings = async (updated: Partial<ServerSettings>) => {
    setServerSettings((prev) => ({ ...prev, ...updated }));
    if (updated.default_volume !== undefined) {
      setVolume(updated.default_volume);
    }
  };

  const isMod = user?.tier === "moderator" || user?.tier === "admin";
  const isAdmin = user?.tier === "admin";

  return (
    <div className="dashboard-viewport relative w-full h-screen overflow-hidden bg-[#10130D] text-[#FFEFD7]">
      {/* Hidden SVG defs for masks and filters */}
      <svg width="0" height="0" className="absolute" style={{ overflow: "hidden" }}>
        <defs>
          <filter id="paper-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
            <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
          </filter>

          <filter id="speckle">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="highContrast" />
            <feComposite in="SourceGraphic" in2="highContrast" operator="in" />
          </filter>

          <mask id="chamfer-mask">
            <rect width="100%" height="100%" fill="white" />
            <polygon points="0,0 8,0 0,8" fill="black" />
            <polygon points="100%,0 100%,8 92%,0" fill="black" />
            <polygon points="0,100% 0,92% 8,100%" fill="black" />
            <polygon points="100%,100% 92%,100% 100%,92%" fill="black" />
          </mask>

          <mask id="chamfer-mask-sm">
            <rect width="100%" height="100%" fill="white" />
            <polygon points="0,0 4,0 0,4" fill="black" />
            <polygon points="100%,0 100%,4 96%,0" fill="black" />
            <polygon points="0,100% 0,96% 4,100%" fill="black" />
            <polygon points="100%,100% 96%,100% 100%,96%" fill="black" />
          </mask>
        </defs>
      </svg>

      {/* Viewport Vignette & Atmospheric Layers */}
      <div className="vignette-noir" />
      <div className="smoke-bg-layer" />
      <div className="ambient-glow-left" />
      <div className="ambient-glow-right" />

      {loading ? (
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="summoning-circle w-16 h-16 animate-spin mb-4" />
          <span className="font-serif text-lg tracking-widest label-glyph">INITIALIZING DASHBOARD...</span>
        </div>
      ) : view === "login" || !user ? (
        /* UNAAUTHENTICATED / LOGIN VIEW */
        <Login />
      ) : (
        /* AUTHENTICATED APP SHELL */
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Header Bar with Logo, Nav Tabs, and User Profile */}
          <header className="top-bar flex items-center justify-between px-8 h-18 bg-black/40 border-b border-[#FFEFD7]/15 min-w-0">
            {/* Brand Logo & Title */}
            <div className="brand-section flex items-center gap-4 flex-shrink-0">
              <div className="brand-logo-crest">
                <div className="brand-logo-inner" />
              </div>
              <div className="brand-title-box">
                <h1 className="brand-title stamped-title text-xl">STORABOGA SOUND</h1>
                <span className="brand-subtitle text-[10px] tracking-widest text-[#5FE69E]">
                  {sse.connected ? "REALTIME SSE ACTIVE" : "RECONNECTING SSE..."}
                </span>
              </div>
            </div>

            {/* Top Header Nav Tabs */}
            <nav className="nav-tabs flex items-center gap-2.5 flex-shrink-0">
              {/* Tab 1: Now Playing */}
              <button
                className={`nav-tab label-glyph ${view === "dashboard" && subView === "now-playing" ? "active" : ""}`}
                onClick={() => {
                  setView("dashboard");
                  setSubView("now-playing");
                }}
              >
                {view === "dashboard" && subView === "now-playing" && (
                  <span className="tab-active-dot animate-ember-pulse" />
                )}
                <span>Now Playing</span>
              </button>

              {/* Tab 2: Queue */}
              <button
                className={`nav-tab label-glyph ${view === "dashboard" && subView === "queue" ? "active" : ""}`}
                onClick={() => {
                  setView("dashboard");
                  setSubView("queue");
                }}
              >
                {view === "dashboard" && subView === "queue" && (
                  <span className="tab-active-dot animate-ember-pulse" />
                )}
                <span>Queue</span>
              </button>

              {/* Tab 3: History */}
              <button
                className={`nav-tab label-glyph ${view === "history" ? "active" : ""}`}
                onClick={() => setView("history")}
              >
                {view === "history" && <span className="tab-active-dot animate-ember-pulse" />}
                <span>History</span>
              </button>

              {/* Tab 4: Status */}
              <button
                className={`nav-tab label-glyph ${view === "status" ? "active" : ""}`}
                onClick={() => setView("status")}
              >
                {view === "status" && <span className="tab-active-dot animate-ember-pulse" />}
                <span>Status</span>
              </button>

              {/* Tab 5: Settings (Mod+ gated) */}
              {isMod ? (
                <button
                  className={`nav-tab label-glyph ${view === "settings" ? "active" : ""}`}
                  onClick={() => setView("settings")}
                >
                  {view === "settings" && <span className="tab-active-dot animate-ember-pulse" />}
                  <span>Settings</span>
                </button>
              ) : (
                <button
                  className="nav-tab label-glyph tab-disabled-mod"
                  disabled
                  title="Moderator role required"
                >
                  <span>Settings</span>
                  <span className="mod-only-stamp">MOD ONLY</span>
                </button>
              )}

              {/* Tab 6: Admin (Admin only) */}
              {isAdmin && (
                <button
                  className={`nav-tab label-glyph ${view === "admin" ? "active" : ""}`}
                  onClick={() => setView("admin")}
                >
                  {view === "admin" && <span className="tab-active-dot animate-ember-pulse" />}
                  <span>Admin</span>
                </button>
              )}
            </nav>

            {/* User Profile & Avatar Badge Area */}
            <div className="user-profile flex items-center gap-4 flex-shrink-0 min-w-0">
              <div className="user-card-badge flex items-center gap-3 px-3 py-1 bg-[#1E201A] border border-[#FFEFD7]/15 flex-shrink-0 min-w-0">
                <div className="user-avatar-frame flex-shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-info flex flex-col flex-shrink-0 min-w-0">
                  <span className="user-name text-xs font-bold truncate max-w-[110px]">{user.username}</span>
                  <span className="admin-badge text-[9px] font-mono tracking-widest text-[#8A55B3] bg-[#8A55B3]/20 px-1 border border-[#8A55B3]/40 w-fit">
                    {user.tier.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-btn flex-shrink-0"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main View Area */}
          <main className="main-container flex-1 p-8 lg:p-10 overflow-hidden min-w-0">
            {view === "dashboard" && (
              <NowPlaying
                user={user}
                nowPlaying={sse.nowPlaying}
                queue={sse.queue}
                positionMs={sse.positionMs}
                onSkip={handleSkip}
                onPause={handlePause}
                onLeave={handleLeave}
                isPaused={isPaused}
                subView={subView}
              />
            )}

            {view === "history" && <History tracks={historyTracks} />}

            {view === "status" && <Status status={botStatus} />}

            {view === "settings" && isMod && (
              <Settings user={user} settings={serverSettings} onSave={handleSaveSettings} />
            )}

            {view === "admin" && isAdmin && <Admin user={user} />}
          </main>

          {/* Bottom Footer Bar */}
          <footer className="bottom-bar flex items-center justify-between px-8 h-14 bg-black/60 border-t border-[#FFEFD7]/15">
            <div className="footer-left flex items-center gap-3">
              <div className="pulse-dot" />
              <span className="footer-channel-title text-xs font-mono text-[#5FE69E] font-bold">
                {view === "settings" ? "PARLOR CONFIGURATION COMPARTMENT" : "#lounge"}
              </span>
            </div>

            <div className="footer-center-engine text-[10px] font-mono tracking-widest text-[#C6C6C6] px-4 py-1 bg-[#1E201A] border border-[#FFEFD7]/10">
              RAW PCM • DISCORD OPUS
            </div>

            {/* Threshold Volume Slider */}
            <div className="footer-volume-control flex items-center gap-3">
              <span className="volume-icon text-[#FFED79]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 5h3l3.5-3v10L5 9H2V5zM11 4.5a4 4 0 0 1 0 5" />
                </svg>
              </span>
              <span className="volume-label font-mono text-xs text-[#FFEFD7] font-bold w-20">
                VOL {volume}%
              </span>
              <div
                className="threshold-volume-track relative w-36 h-4 bg-[#10130D]/95 border border-[#FFEFD7]/18 cursor-pointer p-0.5"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                  handleVolumeChange(pct);
                }}
                title={`Adjust master volume (currently ${volume}%)`}
              >
                <div
                  className="threshold-volume-fill h-full bg-gradient-to-r from-[#E58A00] to-[#FFED79] origin-left"
                  style={{ transform: `scaleX(${volume / 100})` }}
                />
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
