import React, { useEffect, useState, useCallback } from "react";
import { DlProvider } from "@deadlock-api/ui-react";
import { Language } from "@deadlock-api/ui-core";
import { useSSE } from "./useSSE";
import * as api from "./api";
import type { User, Track, QueueState, BotStatus, ServerSettings, ViewName } from "./types";
import { DeadlockNavRail } from "./components/DeadlockNavRail";
import { DeadlockKeyboardHints } from "./components/DeadlockKeyboardHints";
import { NowPlayingShowcase } from "./components/NowPlayingShowcase";
import { QueueRoster } from "./components/QueueRoster";
import { HistoryArchive } from "./components/HistoryArchive";
import { StatusHideout } from "./components/StatusHideout";
import { SettingsPanel } from "./components/SettingsPanel";
import { GeometricShards } from "./components/GeometricShards";
import { ArchiveBackground } from "./components/ArchiveBackground";
import { TelemetryBackground } from "./components/TelemetryBackground";
import { CalibrationBackground } from "./components/CalibrationBackground";


export const App: React.FC = () => {
  // SSE Real-time state
  const sse = useSSE();

  // App & API states
  const [currentView, setCurrentView] = useState<ViewName>(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    return (["dashboard", "history", "status", "settings"].includes(v || "") ? v : "dashboard") as ViewName;
  });
  const [user, setUser] = useState<User | null>(null);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [queue, setQueue] = useState<QueueState>({ tracks: [], total: 0 });
  const [volume, setVolume] = useState<number>(50);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [history, setHistory] = useState<Track[]>([]);
  const [positionMs, setPositionMs] = useState<number>(0);

  // Sync SSE updates with local state
  useEffect(() => {
    if (sse.nowPlaying !== undefined && sse.nowPlaying !== null) {
      setNowPlaying(sse.nowPlaying);
    }
  }, [sse.nowPlaying]);

  useEffect(() => {
    if (sse.queue !== undefined && sse.queue !== null) {
      setQueue(sse.queue);
    }
  }, [sse.queue]);

  useEffect(() => {
    if (sse.positionMs !== undefined) {
      setPositionMs(sse.positionMs);
    }
  }, [sse.positionMs]);

  // Initial Data Fetching
  const loadInitialData = useCallback(async () => {
    try {
      const [u, np, q, volData, st, setts, hist] = await Promise.allSettled([
        api.getMe(),
        api.getNowPlaying(),
        api.getQueue(),
        api.getVolume(),
        api.getStatus(),
        api.getSettings(),
        api.getHistory(),
      ]);

      if (u.status === "fulfilled") setUser(u.value);
      if (np.status === "fulfilled" && np.value) setNowPlaying(np.value);
      if (q.status === "fulfilled" && q.value) setQueue(q.value);
      if (volData.status === "fulfilled" && volData.value) setVolume(volData.value.volume);
      if (st.status === "fulfilled") setStatus(st.value);
      if (setts.status === "fulfilled") setSettings(setts.value);
      if (hist.status === "fulfilled" && hist.value) setHistory(hist.value);
    } catch {
      // Backend may be launching or offline, grace handled
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic status poll (every 10s)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const st = await api.getStatus();
        if (st) setStatus(st);
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Playback Control Handlers
  const handleSkip = async () => {
    try {
      await api.postSkip();
      const nextNp = await api.getNowPlaying();
      setNowPlaying(nextNp);
      const nextQ = await api.getQueue();
      setQueue(nextQ);
    } catch {
      // ignore
    }
  };

  const handlePause = async () => {
    try {
      await api.postPause();
    } catch {
      // ignore
    }
  };

  const handleLeave = async () => {
    try {
      await api.postLeave();
      setNowPlaying(null);
      setPositionMs(0);
    } catch {
      // ignore
    }
  };

  const handleVolumeChange = async (newVol: number) => {
    setVolume(newVol);
    try {
      await api.postVolume(newVol);
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = async (updated: Partial<ServerSettings>) => {
    const saved = await api.patchSettings(updated);
    setSettings(saved);
  };

  const handleLogin = () => {
    window.location.href = api.getLoginUrl();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  // Global Keyboard Shortcuts (Deadlock style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handlePause();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setCurrentView("dashboard");
      } else if (e.key === "1") {
        setCurrentView("dashboard");
      } else if (e.key === "2") {
        setCurrentView("history");
      } else if (e.key === "3") {
        setCurrentView("status");
      } else if (e.key === "4") {
        setCurrentView("settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeTrack = nowPlaying;
  const currentAccent = activeTrack?.accent_hex || "#70F8C1";

  // Assemble full queue list ensuring active track is at index 0 if not already present
  const displayTracks = React.useMemo(() => {
    const list = [...queue.tracks];
    if (activeTrack && !list.some((t) => t.id === activeTrack.id)) {
      return [{ ...activeTrack, is_active: true }, ...list];
    }
    return list;
  }, [queue.tracks, activeTrack]);

  return (
    <DlProvider
      language={Language.EN}
      tooltipTrigger="hover"
      tooltipPlacement="auto"
      tooltipDelay={100}
      showTierBadge={true}
    >
      <div className="relative min-h-screen w-full bg-[#10130D] text-[#FFEFD7] overflow-x-hidden selection:bg-[#70F8C1] selection:text-[#10130D] flex flex-col justify-between">
        {/* Background Ambience Layers: Paper grain + Smoke + Dedicated Screen Backgrounds */}
        <div className="fixed inset-0 paper-grain opacity-25 pointer-events-none z-0" />
        <div className="fixed inset-0 smoke-backdrop pointer-events-none z-0" />

        {/* Unique elaborate background per screen fiction */}
        {currentView === "dashboard" && <GeometricShards accentColor={currentAccent} />}
        {currentView === "history" && <ArchiveBackground />}
        {currentView === "status" && <TelemetryBackground />}
        {currentView === "settings" && <CalibrationBackground />}

        {/* Far-Right Art-Deco Circular HUD Nav Rail */}
        <DeadlockNavRail
          currentView={currentView}
          onSelectView={setCurrentView}
          queueCount={queue.tracks.length}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          latencyMs={status?.latency_ms ?? 18}
          connected={sse.connected}
        />

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
                loadingQuery={sse.loadingQuery}
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
        {/* Main Canvas Area */}
        <main className="relative z-10 flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 pr-16 lg:pr-20 flex flex-col justify-between">
          {currentView === "dashboard" && (
            <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8 min-h-[calc(100vh-5rem)]">
              {/* Left Column: ~42-44% Width - Deadlock Header + 6-Column Hero Select Roster Wall */}
              <section className="w-full lg:w-[44%] xl:w-[42%] max-w-[680px] flex flex-col justify-between shrink-0">
                <QueueRoster
                  tracks={displayTracks}
                  currentTrackId={sse.trackId || activeTrack?.id || null}
                  onSelectTrack={(selectedTrack) => {
                    setNowPlaying(selectedTrack);
                  }}
                />

                {/* Bottom Keyboard Hint */}
                <div className="pt-2">
                  <DeadlockKeyboardHints
                    currentView={currentView}
                    onSelectView={setCurrentView}
                  />
                </div>
              </section>

              {/* Right Column: Full-Bleed Hero Showcase (Now Playing & Parallax) */}
              <section className="flex-1 flex flex-col justify-end relative rounded-sm overflow-hidden min-h-[500px] lg:min-h-full">
                <NowPlayingShowcase
                  track={activeTrack}
                  positionMs={positionMs}
                  volume={volume}
                  onSkip={handleSkip}
                  onPause={handlePause}
                  onLeave={handleLeave}
                  onVolumeChange={handleVolumeChange}
                  loadingQuery={sse.loadingQuery}
                />
              </section>
            </div>
          )}

          {/* Secondary Views (History Archive, Status Hideout, Settings Calibration) */}
          {currentView === "history" && (
            <div className="flex-1 flex flex-col justify-start py-4 w-full">
              <HistoryArchive
                history={history}
                onPlayTrack={(track) => {
                  setNowPlaying(track);
                  setCurrentView("dashboard");
                }}
                onBack={() => setCurrentView("dashboard")}
              />
            </div>
          )}

          {currentView === "status" && (
            <div className="flex-1 flex flex-col justify-start py-4 w-full">
              <StatusHideout
                status={status}
                onBack={() => setCurrentView("dashboard")}
              />
            </div>
          )}

          {currentView === "settings" && (
            <div className="flex-1 flex flex-col justify-start py-4 w-full">
              <SettingsPanel
                settings={settings}
                onSave={handleSaveSettings}
                onBack={() => setCurrentView("dashboard")}
              />
            </div>
          )}
        </main>
      </div>
    </DlProvider>
  );
};
