import React, { useState, useEffect } from "react";
import type { BotStatus } from "../types";
import { DeadlockIcon } from "./DeadlockIcon";

interface StatusHideoutProps {
  status: BotStatus | null;
  onBack?: () => void;
}

const DEFAULT_STATUS: BotStatus = {
  uptime_seconds: 148200,
  servers_connected: 12,
  voice_connections: 3,
  latency_ms: 18,
  memory_mb: 164,
  memory_limit_mb: 1024,
  version: "2.4.0",
};

function formatUptime(seconds: number): { days: number; hours: number; minutes: number; secs: number; text: string } {
  if (!seconds) return { days: 0, hours: 0, minutes: 0, secs: 0, text: "0s" };
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}D`);
  if (hours > 0) parts.push(`${hours}H`);
  if (minutes > 0) parts.push(`${minutes}M`);
  parts.push(`${secs}S`);

  return { days, hours, minutes, secs, text: parts.join(" ") };
}

export const StatusHideout: React.FC<StatusHideoutProps> = ({ status: propStatus, onBack }) => {
  const [pulseCount, setPulseCount] = useState(0);

  const status = propStatus || DEFAULT_STATUS;

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((p) => p + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const memoryLimit = status.memory_limit_mb || 1024;
  const memoryPercent = Math.min(100, Math.round((status.memory_mb / memoryLimit) * 100));
  const uptimeData = formatUptime(status.uptime_seconds);

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-6 select-none animate-fadeIn pb-12">
      {/* =========================================================================
          ATMOSPHERIC HIDEOUT TELEMETRY HEADER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-sm bg-[#161a12] border border-[#FFEFD7]/20 shadow-[0_16px_48px_rgba(0,0,0,0.9)] p-4 sm:p-6 lg:p-8 dl-skew-panel">
        <div className="absolute inset-0 paper-grain opacity-20 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#70F8C1] via-[#FFED79] to-[#70F8C1]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#10130D] bg-[#70F8C1] px-2.5 py-0.5 transform -skew-x-6 flex items-center gap-1.5 shadow-md">
                <DeadlockIcon name="icon_spirit" className="w-3.5 h-3.5 text-[#10130D]" />
                <span>NODE TELEMETRY</span>
              </span>
              <span className="font-mono text-xs text-[#FFED79] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#70F8C1] animate-ping" />
                FIRMWARE v{status.version}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFEFD7] deadlock-hero-title">
              NODE TELEMETRY
            </h1>

            <p className="mt-2 text-xs font-body text-[#FFEFD7]/70">
              Citadel audio transmission node and daemon telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#10130D] border-2 border-[#FFED79] rounded-sm shadow-[0_0_20px_rgba(255,237,121,0.2)] transform -rotate-1">
              <DeadlockIcon name="damage_crit" className="w-4 h-4 text-[#FFED79]" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-black text-[#FFED79] uppercase tracking-widest">
                  GATEWAY STATUS
                </span>
                <span className="font-display text-base font-bold text-[#FFEFD7] leading-none">
                  {status.latency_ms < 50 ? "PEAK EFFICIENCY" : "STABLE FLUX"}
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
          MAIN VITALS MATRIX: 4 STRUCTURED TELEMETRY MODULES
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Module 1: Daemon Uptime */}
        <div className="p-5 bg-[#161a12] border border-[#FFEFD7]/20 rounded-sm shadow-md dl-panel flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#FFEFD7]/15">
            <div className="flex items-center gap-2">
              <DeadlockIcon name="duration" className="w-4 h-4 text-[#FFED79]" />
              <span className="font-mono text-xs font-bold text-[#FFED79] uppercase tracking-wider">
                SYSTEM UPTIME
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#70F8C1]" />
          </div>

          <div className="flex flex-col gap-2 my-1">
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
              <div className="bg-[#10130D] p-2 border border-[#FFEFD7]/10 rounded-xs">
                <span className="text-[9px] text-[#FFEFD7]/50 block">DAYS</span>
                <span className="text-base font-bold text-[#FFED79]">{uptimeData.days}</span>
              </div>
              <div className="bg-[#10130D] p-2 border border-[#FFEFD7]/10 rounded-xs">
                <span className="text-[9px] text-[#FFEFD7]/50 block">HOURS</span>
                <span className="text-base font-bold text-[#FFED79]">{uptimeData.hours}</span>
              </div>
              <div className="bg-[#10130D] p-2 border border-[#FFEFD7]/10 rounded-xs">
                <span className="text-[9px] text-[#FFEFD7]/50 block">MINS</span>
                <span className="text-base font-bold text-[#FFED79]">{uptimeData.minutes}</span>
              </div>
              <div className="bg-[#10130D] p-2 border border-[#FFEFD7]/10 rounded-xs">
                <span className="text-[9px] text-[#FFEFD7]/50 block">SECS</span>
                <span className="text-base font-bold text-[#70F8C1]">{uptimeData.secs}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#FFEFD7]/10 flex flex-col gap-1 font-mono text-[11px] text-[#FFEFD7]/70">
            <div className="flex justify-between">
              <span>Cycle Stability:</span>
              <span className="text-[#70F8C1] font-bold">100%</span>
            </div>
            <div className="flex justify-between">
              <span>Drift Error:</span>
              <span className="text-[#FFED79]">±0.00 ms</span>
            </div>
          </div>
        </div>

        {/* Module 2: Connected Guilds & Shards */}
        <div className="p-5 bg-[#161a12] border border-[#FFEFD7]/20 rounded-sm shadow-md dl-panel flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#FFEFD7]/15">
            <div className="flex items-center gap-2">
              <DeadlockIcon name="armor_bullet" className="w-4 h-4 text-[#70F8C1]" />
              <span className="font-mono text-xs font-bold text-[#70F8C1] uppercase tracking-wider">
                CONNECTED GUILDS
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#FFEFD7]">
              {status.servers_connected} GUILDS
            </span>
          </div>

          {/* Shard Matrix Visual */}
          <div className="p-2.5 bg-[#10130D] border border-[#70F8C1]/30 rounded-xs flex flex-wrap items-center justify-center gap-2 py-3">
            {Array.from({ length: Math.min(16, Math.max(status.servers_connected, 8)) }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 transform rotate-45 border flex items-center justify-center transition-all ${
                  i < status.servers_connected
                    ? "border-[#70F8C1] bg-[#70F8C1]/20 shadow-[0_0_6px_#70F8C1]"
                    : "border-[#FFEFD7]/15 bg-transparent opacity-25"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-[#70F8C1] rounded-full" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#FFEFD7]/10 flex flex-col gap-1 font-mono text-[11px] text-[#FFEFD7]/70">
            <div className="flex justify-between">
              <span>Gateway Protocol:</span>
              <span className="text-[#FFEFD7] font-bold">Discord v10</span>
            </div>
            <div className="flex justify-between">
              <span>Shard Intents:</span>
              <span className="text-[#70F8C1]">Voice States</span>
            </div>
          </div>
        </div>

        {/* Module 3: Voice Relays */}
        <div className="p-5 bg-[#161a12] border border-[#FFEFD7]/20 rounded-sm shadow-md dl-panel flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#FFEFD7]/15">
            <div className="flex items-center gap-2">
              <DeadlockIcon name="voice_chat_icon" isPng className="w-4 h-4 text-[#8A55B3]" />
              <span className="font-mono text-xs font-bold text-[#8A55B3] uppercase tracking-wider">
                VOICE RELAYS
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#70F8C1]">
              {status.voice_connections} ACTIVE
            </span>
          </div>

          {/* Voice Conduit Meters */}
          <div className="p-2.5 bg-[#10130D] border border-[#8A55B3]/40 rounded-xs flex items-center justify-around py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`relative w-7 h-12 rounded-t-full border border-[#FFEFD7]/20 flex flex-col justify-end p-0.5 overflow-hidden ${
                  i < Math.max(status.voice_connections, 1)
                    ? "border-[#8A55B3] bg-[#8A55B3]/15 shadow-[0_0_10px_rgba(138,85,179,0.4)]"
                    : "opacity-25"
                }`}
              >
                <div className="w-full h-6 bg-gradient-to-t from-[#8A55B3] to-transparent rounded-xs animate-dl-filament" />
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FFED79] animate-pulse" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#FFEFD7]/10 flex flex-col gap-1 font-mono text-[11px] text-[#FFEFD7]/70">
            <div className="flex justify-between">
              <span>Audio Codec:</span>
              <span className="text-[#FFEFD7] font-bold">Opus 48kHz</span>
            </div>
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="text-[#8A55B3]">Stereo Duplex</span>
            </div>
          </div>
        </div>

        {/* Module 4: Heap Memory */}
        <div className="p-5 bg-[#161a12] border border-[#FFEFD7]/20 rounded-sm shadow-md dl-panel flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#FFEFD7]/15">
            <div className="flex items-center gap-2">
              <DeadlockIcon name="debuff_remove" className="w-4 h-4 text-[#5FE69E]" />
              <span className="font-mono text-xs font-bold text-[#5FE69E] uppercase tracking-wider">
                HEAP MEMORY
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#70F8C1]">
              {memoryPercent}% LOAD
            </span>
          </div>

          {/* Memory Segmented Bar */}
          <div className="my-2 flex flex-col gap-2">
            <div className="relative h-6 bg-[#0e110b] border border-[#FFEFD7]/25 rounded-xs p-0.5 shadow-inner overflow-hidden">
              <div
                className="h-full rounded-xs transition-all duration-300"
                style={{
                  width: `${memoryPercent}%`,
                  background:
                    memoryPercent > 80
                      ? "linear-gradient(90deg, #ffc533 0%, #ff410d 100%)"
                      : "linear-gradient(90deg, #5fe69e 0%, #70f8c1 80%, #99ffd6 100%)",
                }}
              />
              <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="w-[1px] h-full bg-black/40" />
                ))}
              </div>
            </div>

            <div className="flex justify-between font-mono text-[10px] text-[#FFEFD7]/60">
              <span>USED: {status.memory_mb} MB</span>
              <span>MAX: {memoryLimit} MB</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#FFEFD7]/10 flex flex-col gap-1 font-mono text-[11px] text-[#FFEFD7]/70">
            <div className="flex justify-between">
              <span>Available Headroom:</span>
              <span className="text-[#70F8C1] font-bold">{memoryLimit - status.memory_mb} MB</span>
            </div>
            <div className="flex justify-between">
              <span>GC Cycle:</span>
              <span className="text-[#5FE69E]">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SIGNAL ACTIVITY & HARDWARE LATENCY MONITOR
          ========================================================================= */}
      <div className="p-6 bg-[#161a12] border border-[#FFEFD7]/20 rounded-sm dl-panel flex flex-col gap-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#FFEFD7]/15">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#70F8C1] animate-ping" />
            <h3 className="font-display text-xl font-bold text-[#FFEFD7] deadlock-hero-title">
              TRANSMISSION SIGNAL ACTIVITY
            </h3>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-[#FFEFD7]/60">GATEWAY LATENCY:</span>
            <span className="text-lg font-bold text-[#70F8C1]">
              {status.latency_ms} <span className="text-xs text-[#FFEFD7]/60">MS</span>
            </span>
          </div>
        </div>

        {/* Real-time Smooth Analog Audio Activity Bars */}
        <div className="h-14 flex items-center justify-between gap-1.5 px-2 bg-[#10130D] border border-[#FFEFD7]/15 rounded-xs">
          {Array.from({ length: 32 }).map((_, i) => {
            const height = Math.abs(Math.sin(pulseCount * 0.5 + i * 0.25)) * 90;
            return (
              <div
                key={i}
                className="flex-1 rounded-xs transition-all duration-150"
                style={{
                  height: `${Math.max(10, height)}%`,
                  backgroundColor: i % 4 === 0 ? "#FFED79" : "#70F8C1",
                  opacity: i % 2 === 0 ? 0.9 : 0.6,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM TELEMETRY HEARTBEAT BAR
          ========================================================================= */}
      <div className="p-4 bg-[#10130D] border border-[#FFEFD7]/15 rounded-sm dl-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-[#FFEFD7]/75 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-[#FFED79] text-[#10130D] font-black text-[10px] uppercase tracking-wider rounded-xs">
            LIVE HEARTBEAT
          </span>
          <span className="truncate">
            DAEMON RUNTIME: {uptimeData.text} // LATENCY: {status.latency_ms}ms // STATUS: OK
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#70F8C1] shrink-0">
          <span>● SSE SYNCHRONIZED</span>
          <span>◈ REFRESH INTERVAL: 10s</span>
        </div>
      </div>
    </div>
  );
};
