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
    if (v === "dashboard" || v === "history" || v === "status" || v === "settings") {
      return v;
    }
    return "dashboard";
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
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
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
      <div className="relative min-h-screen w-full bg-off-black text-off-white overflow-x-hidden selection:bg-soul selection:text-off-black flex flex-col justify-between">
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
