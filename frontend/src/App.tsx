import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { DlProvider } from "@deadlock-api/ui-react";
import { Language } from "@deadlock-api/ui-core";
import { useSSE } from "./useSSE";
import * as api from "./api";
import type { User, Track, QueueState, BotStatus, ServerSettings, ViewName } from "./types";
import { DeadlockNavRail } from "./components/DeadlockNavRail";
import { DeadlockKeyboardHints } from "./components/DeadlockKeyboardHints";
import { NowPlayingShowcase } from "./components/NowPlayingShowcase";
import { QueueRoster } from "./components/QueueRoster";
import { GeometricShards } from "./components/GeometricShards";
import { ArchiveBackground } from "./components/ArchiveBackground";
import { TelemetryBackground } from "./components/TelemetryBackground";
import { CalibrationBackground } from "./components/CalibrationBackground";

// Code-split secondary views for optimized bundle load
const HistoryArchive = React.lazy(() =>
  import("./components/HistoryArchive").then((m) => ({ default: m.HistoryArchive }))
);
const StatusHideout = React.lazy(() =>
  import("./components/StatusHideout").then((m) => ({ default: m.StatusHideout }))
);
const SettingsPanel = React.lazy(() =>
  import("./components/SettingsPanel").then((m) => ({ default: m.SettingsPanel }))
);

const DeadlockViewLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full animate-fadeIn">
    <div className="flex items-center gap-3 bg-[#10130D] border border-[#70F8C1]/50 px-6 py-3 shadow-[0_0_24px_rgba(112,248,193,0.3)]">
      <span className="w-2.5 h-2.5 rounded-full bg-[#70F8C1] animate-ping" />
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FFEFD7]">
        LOADING VIEW
      </span>
    </div>
  </div>
);

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
  const [toast, setToast] = useState<{ message: string; type: "info" | "warn" | "error" | "success" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: "info" | "warn" | "error" | "success" = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

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

  // Playback Control Handlers with User Feedback Toasts
  const handleSkip = async () => {
    try {
      await api.postSkip();
      showToast("Skipped to next track", "success");
      const nextNp = await api.getNowPlaying();
      setNowPlaying(nextNp);
      const nextQ = await api.getQueue();
      setQueue(nextQ);
    } catch {
      showToast("Skip failed — DJ role or active playback required", "warn");
    }
  };

  const handlePause = async () => {
    try {
      await api.postPause();
      showToast("Playback state toggled", "info");
    } catch {
      showToast("Pause failed — Discord voice unreachable", "warn");
    }
  };

  const handleLeave = async () => {
    try {
      await api.postLeave();
      setNowPlaying(null);
      setPositionMs(0);
      showToast("Disconnected from voice channel", "info");
    } catch {
      showToast("Disconnect completed", "info");
      setNowPlaying(null);
      setPositionMs(0);
    }
  };

  const handleVolumeChange = async (newVol: number) => {
    setVolume(newVol);
    try {
      await api.postVolume(newVol);
    } catch {
      showToast("Volume sync failed — check permissions", "warn");
    }
  };

  const handleSaveSettings = async (updated: Partial<ServerSettings>) => {
    try {
      const saved = await api.patchSettings(updated);
      setSettings(saved);
      showToast("Settings saved", "success");
    } catch {
      showToast("Save failed — admin permissions required", "warn");
    }
  };

  const handleLogin = () => {
    window.location.href = api.getLoginUrl();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    showToast("Logged out", "info");
  };

  // Global Keyboard Shortcuts (Deadlock style, collision-safe)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      // Ignore all typing shortcuts if inside standard input or editable elements
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      // If user is focused on a button, switch, tab, or slider, avoid intercepting Space or Enter
      if (target.closest('button, [role="button"], [role="switch"], [role="tab"], [role="slider"]')) {
        if (e.code === "Space" || e.key === "Enter") {
          return;
        }
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

        {/* Floating Deadlock HUD Toast Notification */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-6 right-20 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#10130D] border shadow-[0_0_24px_rgba(0,0,0,0.9)] animate-fadeIn font-mono text-xs font-bold tracking-wider ${
              toast.type === "success"
                ? "border-[#70F8C1] text-[#70F8C1] shadow-[0_0_16px_rgba(112,248,193,0.3)]"
                : toast.type === "warn" || toast.type === "error"
                ? "border-[#FF410D] text-[#FF410D] shadow-[0_0_16px_rgba(255,65,13,0.3)]"
                : "border-[#FFED79] text-[#FFED79] shadow-[0_0_16px_rgba(255,237,121,0.25)]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === "success"
                  ? "bg-[#70F8C1]"
                  : toast.type === "warn" || toast.type === "error"
                  ? "bg-[#FF410D]"
                  : "bg-[#FFED79]"
              } animate-ping`}
            />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Main Canvas Area */}
        <main className="relative z-10 flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 pr-16 lg:pr-20 flex flex-col justify-between">
          {currentView === "dashboard" && (
            <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8 min-h-[calc(100vh-5rem)]">
              {/* Left Column on Desktop / Bottom on Mobile: Queue Roster */}
              <section className="order-2 lg:order-1 w-full lg:w-[44%] xl:w-[42%] max-w-[680px] flex flex-col justify-between shrink-0">
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

              {/* Right Column on Desktop / Top on Mobile: Hero Showcase */}
              <section className="order-1 lg:order-2 flex-1 flex flex-col justify-end relative rounded-sm overflow-hidden min-h-[440px] lg:min-h-full">
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

          {/* Secondary Views with Lazy Loading Suspense Fallback */}
          {currentView === "history" && (
            <div className="flex-1 flex flex-col justify-start py-4 w-full">
              <Suspense fallback={<DeadlockViewLoader />}>
                <HistoryArchive
                  history={history}
                  onPlayTrack={(track) => {
                    setNowPlaying(track);
                    setCurrentView("dashboard");
                  }}
                  onBack={() => setCurrentView("dashboard")}
                />
              </Suspense>
            </div>
          )}

          {currentView === "status" && (
            <div className="flex-1 flex flex-col justify-start py-4 w-full">
              <Suspense fallback={<DeadlockViewLoader />}>
                <StatusHideout
                  status={status}
                  onBack={() => setCurrentView("dashboard")}
                />
              </Suspense>
            </div>
          )}

          {currentView === "settings" && (
            <div className="flex-1 flex flex-col justify-start py-4 w-full">
              <Suspense fallback={<DeadlockViewLoader />}>
                <SettingsPanel
                  settings={settings}
                  onSave={handleSaveSettings}
                  onBack={() => setCurrentView("dashboard")}
                />
              </Suspense>
            </div>
          )}
        </main>
      </div>
    </DlProvider>
  );
};
