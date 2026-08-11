import { useState, useEffect } from "react";
import type { BotStatus } from "../types";
import { getStatus } from "../api";

interface StatusProps {
  status: BotStatus | null;
}

export default function Status({ status: initialStatus }: StatusProps) {
  const [statusData, setStatusData] = useState<BotStatus | null>(initialStatus);

  useEffect(() => {
    const fetchFreshStatus = () => {
      getStatus()
        .then((data) => setStatusData(data))
        .catch((err) => console.error("Failed to fetch bot status", err));
    };

    fetchFreshStatus();
    const interval = setInterval(fetchFreshStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialStatus) {
      setStatusData(initialStatus);
    }
  }, [initialStatus]);

  const status = statusData ?? {
    uptime_seconds: 0,
    servers_connected: 0,
    voice_connections: 0,
    latency_ms: 0,
    memory_mb: 0,
    memory_limit_mb: 1024,
    version: "1.0.0",
  };

  const formatUptime = (totalSec: number): string => {
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const memLimit = status.memory_limit_mb || 1024;
  const memPct = Math.min(100, Math.max(0, Math.round((status.memory_mb / memLimit) * 100)));
  const filledVerticalSegments = Math.round((memPct / 100) * 10);

  const lat = status.latency_ms;
  const clampedLat = Math.max(0, Math.min(300, lat));
  const angleRad = Math.PI - (clampedLat / 300) * Math.PI;
  const needleX = 110 + 75 * Math.cos(angleRad);
  const needleY = 100 - 75 * Math.sin(angleRad);
  const latencyColor = lat < 50 ? "var(--soul-color)" : lat < 150 ? "var(--weapon-color)" : "var(--enemy-color)";

  const isConnectedToVoice = status.voice_connections > 0;

  return (
    <section className="status-panel paper-sculpted-panel flex flex-col p-6 gap-4 w-full h-full">
      <div className="status-header flex flex-col gap-1">
        <h2 className="status-title stamped-title text-2xl">STATUS</h2>
        <span className="text-[11px] font-mono tracking-widest text-[#55503E] uppercase">
          APPARATUS DIAGNOSTICS
        </span>
        <div className="deco-divider mt-1" />
      </div>

      {/* Dense 3-Column Diagnostic Layout */}
      <div className="diagnostic-grid flex gap-4 flex-1 h-[calc(100%-40px)] min-h-0">
        {/* LEFT COLUMN (40% width) */}
        <div className="diag-col col-left flex-col gap-3 flex-[40]">
          {/* 1. System Health Panel */}
          <div className="diag-card">
            <div className="card-header-sm">
              <span className="card-tag">SYSTEM HEALTH</span>
            </div>

            <div className="stat-block">
              <div className="numeral-huge">{formatUptime(status.uptime_seconds)}</div>
              <div className="numeral-label">UPTIME</div>
            </div>

            <div className="gold-hairline-divider" />

            <div className="stat-block">
              <div className="numeral-mid">v{status.version}</div>
              <div className="numeral-label">BUILD</div>
            </div>
          </div>

          {/* 2. Memory Gauge */}
          <div className="diag-card">
            <div className="card-header-sm">
              <span className="card-tag">MEMORY</span>
            </div>

            <div className="stat-block">
              <div className="numeral-large">
                {status.memory_mb} / {memLimit} MB
              </div>
            </div>

            <div className="mem-bar-track">
              <div
                className="mem-bar-fill"
                style={{
                  transform: `scaleX(${status.memory_mb / memLimit})`,
                  backgroundColor: "var(--gold-color)",
                }}
              />
            </div>
          </div>

          {/* 3. Latency Gauge */}
          <div className="diag-card">
            <div className="card-header-sm">
              <span className="card-tag">LATENCY</span>
            </div>

            <div className="gauge-arc-wrapper">
              <svg width="220" height="110" viewBox="0 0 220 110" className="arc-svg">
                {/* Base Track */}
                <path
                  d="M 20 100 A 90 90 0 0 1 200 100"
                  fill="none"
                  stroke="#22201b"
                  strokeWidth="12"
                  strokeLinecap="butt"
                />
                {/* Green Mint Zone (<100ms) */}
                <path
                  d="M 20 100 A 90 90 0 0 1 100 10"
                  fill="none"
                  stroke="var(--soul-color)"
                  strokeWidth="12"
                  strokeLinecap="butt"
                  opacity="0.9"
                />
                {/* Amber Zone (100-300ms) */}
                <path
                  d="M 100 10 A 90 90 0 0 1 170 35"
                  fill="none"
                  stroke="var(--weapon-color)"
                  strokeWidth="12"
                  strokeLinecap="butt"
                  opacity="0.6"
                />
                {/* Red Zone (>300ms) */}
                <path
                  d="M 170 35 A 90 90 0 0 1 200 100"
                  fill="none"
                  stroke="var(--enemy-color)"
                  strokeWidth="12"
                  strokeLinecap="butt"
                  opacity="0.6"
                />
                {/* Dynamic Needle */}
                <line
                  x1="110"
                  y1="100"
                  x2={needleX}
                  y2={needleY}
                  stroke="var(--gold-color)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="110" cy="100" r="6" fill="var(--weapon-color)" stroke="#10130D" strokeWidth="2" />
              </svg>
              <div className="arc-center-stat">
                <span className="numeral-large" style={{ color: latencyColor }}>
                  {lat} MS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN (35% width) */}
        <div className="diag-col col-mid flex-col gap-3 flex-[35]">
          {/* 4. Connection Status */}
          <div className="diag-card">
            <div className="card-header-sm">
              <span className="card-tag">NETWORK CONNECTIONS</span>
            </div>

            <div className="conn-stat-row">
              <div className="conn-info">
                <div className="numeral-giant text-gold">{status.servers_connected}</div>
                <div className="numeral-label">SERVERS CONNECTED</div>
              </div>
              <span className="pulse-dot-mint" />
            </div>

            <div className="gold-hairline-divider" />

            <div className="conn-stat-row">
              <div className="conn-info">
                <div className="numeral-giant text-mint">{status.voice_connections}</div>
                <div className="numeral-label">VOICE CHANNELS</div>
              </div>
              <span className={isConnectedToVoice ? "pulse-dot-mint" : "pulse-dot-red"} />
            </div>
          </div>

          {/* 5. Service Status List */}
          <div className="diag-card flex-1">
            <div className="card-header-sm">
              <span className="card-tag">SERVICE STATUS</span>
            </div>

            <div className="service-list">
              <div className="service-row">
                <div className="service-left">
                  <span className="pulse-dot-mint" />
                  <span className="service-name">BOT PROCESS</span>
                </div>
                <span className="service-val text-soul">RUNNING</span>
              </div>
              <div className="gold-hairline-divider" />

              <div className="service-row">
                <div className="service-left">
                  <span className="pulse-dot-mint" />
                  <span className="service-name">WEB SERVER</span>
                </div>
                <span className="service-val text-gold">LISTENING :2497</span>
              </div>
              <div className="gold-hairline-divider" />

              <div className="service-row">
                <div className="service-left">
                  <span className="pulse-dot-mint" />
                  <span className="service-name">DATABASE</span>
                </div>
                <span className="service-val text-soul">CONNECTED</span>
              </div>
              <div className="gold-hairline-divider" />

              <div className="service-row">
                <div className="service-left">
                  <span className="pulse-dot-mint" />
                  <span className="service-name">FFMPEG</span>
                </div>
                <span className="service-val text-shard">AVAILABLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (25% width) */}
        <div className="diag-col col-right flex-col gap-3 flex-[25]">
          {/* 6. ON AIR Indicator */}
          <div className="diag-card on-air-box">
            <div className="on-air-header">
              <span className={isConnectedToVoice ? "pulse-dot-mint" : "pulse-dot-red"} />
              <span className="on-air-text stamped-title">
                {isConnectedToVoice ? "ON AIR" : "OFF AIR"}
              </span>
            </div>
            <div className="on-air-subtext">
              {status.servers_connected} STATIONS CONNECTED
            </div>
          </div>

          {/* 7. Resource Bar (Vertical 10 Segments) */}
          <div className="diag-card flex-fill">
            <div className="card-header-sm">
              <span className="card-tag">RESOURCE PRESSURE</span>
            </div>

            <div className="vertical-meter-container">
              <div className="vertical-segments">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const segIndexFromBottom = 9 - idx;
                  const isFilled = segIndexFromBottom < filledVerticalSegments;
                  return (
                    <div
                      key={idx}
                      className={`v-segment ${isFilled ? "filled-gold" : ""}`}
                    />
                  );
                })}
              </div>
              <div className="meter-readout">{memPct}% MEMORY PRESSURE</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
