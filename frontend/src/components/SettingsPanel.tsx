import React, { useState, useEffect } from "react";
import type { ServerSettings } from "../types";
import { DeadlockIcon } from "./DeadlockIcon";

interface SettingsPanelProps {
  settings: ServerSettings | null;
  onSave: (updated: Partial<ServerSettings>) => Promise<void>;
  onBack?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSave,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<string>("AUDIO");
  const [defaultVolume, setDefaultVolume] = useState<number>(50);
  const [djRoleId, setDjRoleId] = useState<string>("");

  // Machine calibration toggles (DSP processing options)
  const [autoCrossfade, setAutoCrossfade] = useState<boolean>(true);
  const [streamerSafe, setStreamerSafe] = useState<boolean>(false);
  const [audioNormalization, setAudioNormalization] = useState<boolean>(true);
  const [highFidelity, setHighFidelity] = useState<boolean>(true);
  const [codecBitrate, setCodecBitrate] = useState<string>("128");

  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDefaultVolume(settings.default_volume ?? 50);
      setDjRoleId(settings.dj_role_id ?? "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        default_volume: defaultVolume,
        dj_role_id: djRoleId.trim() || null,
      });
      setSaveMessage("CALIBRATION COMMITTED");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("CALIBRATION ERROR");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Decibel calculation for master gain
  const dbValue = defaultVolume === 0 ? "-∞" : ((defaultVolume / 100) * 12 - 6).toFixed(1);

  const tabs = [
    {
      id: "AUDIO",
      label: "MASTER GAIN & DSP",
      badge: `${defaultVolume}% GAIN`,
      icon: <DeadlockIcon name="voice_chat_icon" isPng className="w-4 h-4 mr-2" />,
    },
    {
      id: "PERMISSIONS",
      label: "SECURITY & DJ ACCESS",
      badge: djRoleId ? "RESTRICTED" : "OPEN",
      icon: <DeadlockIcon name="armor_alt" className="w-4 h-4 mr-2" />,
    },
    {
      id: "TRANSMITTER",
      label: "CODEC & DIAGNOSTICS",
      badge: `${codecBitrate}k OPUS`,
      icon: <DeadlockIcon name="icon_spirit" className="w-4 h-4 mr-2" />,
    },
    {
      id: "INTERFACE",
      label: "KEYBOARD BINDINGS",
      badge: "KEYBOARD",
      icon: <DeadlockIcon name="debuff_remove" className="w-4 h-4 mr-2" />,
    },
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-6 select-none animate-fadeIn pb-12">
      {/* =========================================================================
          MACHINE ROOM CONSOLE HEADER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-sm bg-[#161a12] border border-[#FFEFD7]/20 shadow-[0_16px_48px_rgba(0,0,0,0.9)] p-4 sm:p-6 lg:p-8 dl-skew-panel">
        <div className="absolute inset-0 paper-grain opacity-20 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FFED79] via-[#70F8C1] to-[#E58A00]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#10130D] bg-[#5FE69E] px-2.5 py-0.5 transform -skew-x-6 flex items-center gap-1.5 shadow-md">
                <DeadlockIcon name="armor_spirit" className="w-3.5 h-3.5 text-[#10130D]" />
                <span>CALIBRATION CONSOLE</span>
              </span>
              <span className="font-mono text-xs text-[#FFED79] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5FE69E] animate-ping" />
                READY
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFEFD7] deadlock-hero-title">
              CALIBRATION CONSOLE
            </h1>

            <p className="mt-2 text-xs font-body text-[#FFEFD7]/70">
              Hardware stream gain, DSP filters, and access controls.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            {saveMessage ? (
              <span className="font-mono text-xs font-black uppercase text-[#5FE69E] bg-[#10130D] px-4 py-2 border-2 border-[#5FE69E] shadow-[0_0_20px_#5FE69E] animate-pulse">
                {saveMessage}
              </span>
            ) : (
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-[#10130D] border-2 border-[#5FE69E]/60 rounded-sm shadow-[0_0_20px_rgba(95,230,158,0.25)] transform rotate-1">
                <DeadlockIcon name="ammo" className="w-5 h-5 text-[#5FE69E]" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-black text-[#5FE69E] uppercase tracking-widest">
                    OUTPUT GAIN
                  </span>
                  <span className="font-display text-lg font-bold text-[#FFEFD7] leading-none">
                    {defaultVolume}% ({dbValue} dB)
                  </span>
                </div>
              </div>
            )}

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
          MAIN CONSOLE CANVAS: 2-COLUMN INDUSTRIAL FACEPLATE
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        {/* =======================================================================
            LEFT COLUMN: CONSOLE RACK SELECTORS
            ======================================================================= */}
        <aside className="w-full lg:w-[28%] shrink-0 flex flex-col gap-4">
          <div role="tablist" aria-label="Console rack tabs" className="p-4 bg-[#141810]/95 border border-[#FFEFD7]/20 rounded-sm dl-panel shadow-[0_12px_28px_rgba(0,0,0,0.7)] flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#FFEFD7]/50 px-1 pb-1 border-b border-[#FFEFD7]/10">
              CONSOLE RACKS
            </span>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative w-full text-left p-3 rounded-xs border transition-all cursor-pointer flex items-center justify-between overflow-hidden transform ${
                    isActive
                      ? "bg-[#5FE69E] text-[#10130D] border-white shadow-[0_0_20px_rgba(95,230,158,0.7)] font-black -translate-y-0.5"
                      : "bg-[#181c14] text-[#FFEFD7]/75 border-[#FFEFD7]/15 hover:border-[#5FE69E]/60 hover:text-[#FFEFD7] hover:bg-[#20261b]"
                  }`}
                >
                  <div className="flex items-center">
                    {tab.icon}
                    <span className="font-body text-xs font-bold tracking-wide">
                      {tab.label}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded-xs uppercase ${
                      isActive ? "bg-[#10130D] text-[#5FE69E]" : "bg-[#10130D] text-[#FFED79]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Machine Calibration Status Readout */}
          <div className="p-4 bg-[#12150e] border border-[#FFEFD7]/20 rounded-sm dl-panel flex flex-col gap-3 font-mono text-xs text-[#FFEFD7]/70">
            <div className="flex items-center justify-between pb-1 border-b border-[#FFEFD7]/10 text-[10px] text-[#FFED79]">
              <span className="font-black uppercase tracking-wider">CHASSIS DIAGNOSTICS</span>
              <span className="text-[#70F8C1]">OK</span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span>IMPEDANCE:</span>
              <span className="text-[#FFEFD7] font-bold">600Ω BALANCED</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>SAMPLE RATE:</span>
              <span className="text-[#70F8C1] font-bold">48,000 Hz</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>BUFFER HEADROOM:</span>
              <span className="text-[#FFED79] font-bold">+6.0 dBFS</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>AUDIO ENGINE:</span>
              <span className="text-[#5FE69E] font-bold">READY</span>
            </div>
          </div>
        </aside>

        {/* =======================================================================
            RIGHT COLUMN: PHYSICAL CONTROLS & MACHINE FACEPLATES
            ======================================================================= */}
        <main className="flex-1 w-full flex flex-col gap-6">
          {/* ===================================================================
              PANEL 1: MASTER GAIN & DSP TOGGLES
              =================================================================== */}
          {activeTab === "AUDIO" && (
            <div className="flex flex-col gap-6">
              {/* Stepped Potentiometer Master Gain Console */}
              <div className="p-6 bg-[#161a12] border border-[#5FE69E]/50 rounded-sm dl-panel flex flex-col gap-6 shadow-[0_16px_36px_rgba(0,0,0,0.85)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FFEFD7]/15">
                  <div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#10130D] bg-[#5FE69E] px-2 py-0.5 rounded-xs">
                      GAIN STAGE
                    </span>
                    <h3 className="font-display text-2xl font-bold text-[#FFEFD7] deadlock-hero-title mt-1">
                      MASTER STREAM GAIN
                    </h3>
                  </div>

                  {/* VU Level Readout */}
                  <div className="flex items-center gap-3 bg-[#10130D] px-3.5 py-2 border border-[#5FE69E]/40 rounded-xs font-mono">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-[#5FE69E] font-black uppercase">CALIBRATION LEVEL</span>
                      <span className="text-sm font-bold text-[#FFEFD7]">{defaultVolume}% ({dbValue} dB)</span>
                    </div>
                    <div className="w-3 h-8 bg-[#181c14] border border-[#5FE69E]/40 rounded-xs flex flex-col justify-end p-0.5">
                      <div
                        className="w-full bg-[#5FE69E] rounded-xs transition-all duration-150"
                        style={{ height: `${defaultVolume}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Potentiometer Slide & Tactile Scale */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between font-mono text-xs text-[#FFEFD7]/70">
                    <span>-∞ dB (MUTE)</span>
                    <span className="text-[#FFED79]">-12 dB</span>
                    <span className="text-[#5FE69E] font-bold">0 dB (UNITY)</span>
                    <span className="text-[#FFED79]">+3 dB</span>
                    <span className="text-[#FF410D]">+6 dB (MAX)</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={defaultVolume}
                    onChange={(e) => setDefaultVolume(Number(e.target.value))}
                    aria-label="Master stream gain level"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={defaultVolume}
                    className="w-full dl-slider h-4 cursor-pointer"
                  />

                  {/* Machined Calibration Scale Ticks */}
                  <div className="flex justify-between px-1 text-[9px] font-mono text-[#FFEFD7]/40 border-t border-[#FFEFD7]/10 pt-1">
                    {["0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"].map((pct) => (
                      <span key={pct} className="flex flex-col items-center">
                        <span>|</span>
                        <span className="text-[8px]">{pct}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Physical Machine Toggle Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle 1: Auto Crossfade */}
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={autoCrossfade}
                  aria-label="Gapless auto-crossfade"
                  onClick={() => setAutoCrossfade(!autoCrossfade)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setAutoCrossfade(!autoCrossfade);
                    }
                  }}
                  className={`p-4 bg-[#141810] border rounded-sm dl-panel flex items-center justify-between gap-4 cursor-pointer transition-all duration-75 ${
                    autoCrossfade ? "border-[#5FE69E]/70 shadow-[0_0_16px_rgba(95,230,158,0.2)]" : "border-[#FFEFD7]/15 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] font-black uppercase text-[#FFED79] tracking-wider">
                      DSP-01
                    </span>
                    <h4 className="font-display text-lg font-bold text-[#FFEFD7]">
                      GAPLESS AUTO-CROSSFADE
                    </h4>
                    <p className="font-body text-xs text-[#FFEFD7]/60">
                      3.5s smooth exponential equal-power overlap.
                    </p>
                  </div>

                  {/* Tactile Switch Visual */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-12 h-6 rounded-full border-2 p-0.5 transition-all flex items-center ${
                        autoCrossfade
                          ? "bg-[#5FE69E]/30 border-[#5FE69E] justify-end shadow-[0_0_10px_#5FE69E]"
                          : "bg-[#10130D] border-[#FFEFD7]/30 justify-start"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          autoCrossfade ? "bg-[#5FE69E] shadow-[0_0_8px_#5FE69E]" : "bg-[#FFEFD7]/40"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[8px] text-[#FFEFD7]/60 font-bold uppercase">
                      {autoCrossfade ? "ENGAGED" : "BYPASS"}
                    </span>
                  </div>
                </div>

                {/* Toggle 2: EBU R128 Normalization */}
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={audioNormalization}
                  aria-label="Loudness normalization"
                  onClick={() => setAudioNormalization(!audioNormalization)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setAudioNormalization(!audioNormalization);
                    }
                  }}
                  className={`p-4 bg-[#141810] border rounded-sm dl-panel flex items-center justify-between gap-4 cursor-pointer transition-all duration-75 ${
                    audioNormalization ? "border-[#5FE69E]/70 shadow-[0_0_16px_rgba(95,230,158,0.2)]" : "border-[#FFEFD7]/15 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] font-black uppercase text-[#FFED79] tracking-wider">
                      DSP-02
                    </span>
                    <h4 className="font-display text-lg font-bold text-[#FFEFD7]">
                      LOUDNESS NORMALIZATION
                    </h4>
                    <p className="font-body text-xs text-[#FFEFD7]/60">
                      EBU R128 broadcast standardized to -14.0 LUFS.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-12 h-6 rounded-full border-2 p-0.5 transition-all flex items-center ${
                        audioNormalization
                          ? "bg-[#5FE69E]/30 border-[#5FE69E] justify-end shadow-[0_0_10px_#5FE69E]"
                          : "bg-[#10130D] border-[#FFEFD7]/30 justify-start"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          audioNormalization ? "bg-[#5FE69E] shadow-[0_0_8px_#5FE69E]" : "bg-[#FFEFD7]/40"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[8px] text-[#FFEFD7]/60 font-bold uppercase">
                      {audioNormalization ? "ENGAGED" : "BYPASS"}
                    </span>
                  </div>
                </div>

                {/* Toggle 3: Streamer Safe Mode */}
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={streamerSafe}
                  aria-label="Streamer safe mode"
                  onClick={() => setStreamerSafe(!streamerSafe)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setStreamerSafe(!streamerSafe);
                    }
                  }}
                  className={`p-4 bg-[#141810] border rounded-sm dl-panel flex items-center justify-between gap-4 cursor-pointer transition-all duration-75 ${
                    streamerSafe ? "border-[#5FE69E]/70 shadow-[0_0_16px_rgba(95,230,158,0.2)]" : "border-[#FFEFD7]/15 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] font-black uppercase text-[#FFED79] tracking-wider">
                      DSP-03
                    </span>
                    <h4 className="font-display text-lg font-bold text-[#FFEFD7]">
                      STREAMER SAFE MODE
                    </h4>
                    <p className="font-body text-xs text-[#FFEFD7]/60">
                      Auto-filters copyright flagged audio tracks.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-12 h-6 rounded-full border-2 p-0.5 transition-all flex items-center ${
                        streamerSafe
                          ? "bg-[#5FE69E]/30 border-[#5FE69E] justify-end shadow-[0_0_10px_#5FE69E]"
                          : "bg-[#10130D] border-[#FFEFD7]/30 justify-start"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          streamerSafe ? "bg-[#5FE69E] shadow-[0_0_8px_#5FE69E]" : "bg-[#FFEFD7]/40"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[8px] text-[#FFEFD7]/60 font-bold uppercase">
                      {streamerSafe ? "ENGAGED" : "BYPASS"}
                    </span>
                  </div>
                </div>

                {/* Toggle 4: 48kHz Sinc Reconstruction */}
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={highFidelity}
                  aria-label="High-fidelity resampling"
                  onClick={() => setHighFidelity(!highFidelity)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHighFidelity(!highFidelity);
                    }
                  }}
                  className={`p-4 bg-[#141810] border rounded-sm dl-panel flex items-center justify-between gap-4 cursor-pointer transition-all duration-75 ${
                    highFidelity ? "border-[#5FE69E]/70 shadow-[0_0_16px_rgba(95,230,158,0.2)]" : "border-[#FFEFD7]/15 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] font-black uppercase text-[#FFED79] tracking-wider">
                      DSP-04
                    </span>
                    <h4 className="font-display text-lg font-bold text-[#FFEFD7]">
                      HIGH-FIDELITY RESAMPLING
                    </h4>
                    <p className="font-body text-xs text-[#FFEFD7]/60">
                      Polyphase sinc resampler with high headroom.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-12 h-6 rounded-full border-2 p-0.5 transition-all flex items-center ${
                        highFidelity
                          ? "bg-[#5FE69E]/30 border-[#5FE69E] justify-end shadow-[0_0_10px_#5FE69E]"
                          : "bg-[#10130D] border-[#FFEFD7]/30 justify-start"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          highFidelity ? "bg-[#5FE69E] shadow-[0_0_8px_#5FE69E]" : "bg-[#FFEFD7]/40"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[8px] text-[#FFEFD7]/60 font-bold uppercase">
                      {highFidelity ? "ENGAGED" : "BYPASS"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PANEL 2: PERMISSIONS & DJ ROLE ACCESS KEY
              =================================================================== */}
          {activeTab === "PERMISSIONS" && (
            <div className="flex flex-col gap-6">
              <div className="p-6 bg-[#161a12] border border-[#8A55B3]/60 rounded-sm dl-panel flex flex-col gap-5 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-[#FFEFD7]/15">
                  <div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#FFFFFF] bg-[#8A55B3] px-2 py-0.5 rounded-xs">
                      ACCESS PERMISSIONS
                    </span>
                    <h3 className="font-display text-2xl font-bold text-[#FFEFD7] deadlock-hero-title mt-1">
                      DJ ROLE RESTRICTION KEY
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 bg-[#10130D] px-3 py-1.5 border border-[#8A55B3]/40 rounded-xs font-mono text-xs">
                    <span className="text-[#FFEFD7]/50 uppercase text-[10px]">STATUS:</span>
                    <span className={djRoleId ? "text-[#70F8C1] font-bold" : "text-[#FFED79] font-bold"}>
                      {djRoleId ? "RESTRICTED" : "OPEN"}
                    </span>
                  </div>
                </div>

                <p className="font-body text-xs text-[#FFEFD7]/75">
                  Insert the 18-digit Discord Snowflake Role ID to restrict track skipping, master gain adjustments, and queue priority. Leave blank for open broadcast access to all server members.
                </p>

                {/* Keycard Slot Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 109283746592837465 (or blank for public)"
                    value={djRoleId}
                    onChange={(e) => setDjRoleId(e.target.value)}
                    aria-label="Discord DJ Role Snowflake ID"
                    className="w-full bg-[#0e110b] border border-[#8A55B3]/40 px-4 py-2.5 font-mono text-sm text-[#FFEFD7] placeholder-[#FFEFD7]/30 rounded-xs focus:outline-none focus:border-[#5FE69E] transition-all"
                  />
                  {djRoleId && (
                    <button
                      onClick={() => setDjRoleId("")}
                      aria-label="Clear DJ Role ID"
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#FFEFD7]/60 hover:text-[#FF410D] cursor-pointer"
                    >
                      CLEAR KEY
                    </button>
                  )}
                </div>

                {/* Permission Scope Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#FFEFD7]/10 font-mono text-xs">
                  <div className="p-2 bg-[#10130D] border border-[#FFEFD7]/10 rounded-xs text-center">
                    <span className="text-[9px] text-[#FFEFD7]/50 block">SKIP TRACK</span>
                    <span className="font-bold text-[#5FE69E]">{djRoleId ? "DJ ROLE" : "ALL MEMBERS"}</span>
                  </div>
                  <div className="p-2 bg-[#10130D] border border-[#FFEFD7]/10 rounded-xs text-center">
                    <span className="text-[9px] text-[#FFEFD7]/50 block">GAIN TUNING</span>
                    <span className="font-bold text-[#5FE69E]">{djRoleId ? "DJ ROLE" : "ALL MEMBERS"}</span>
                  </div>
                  <div className="p-2 bg-[#10130D] border border-[#FFEFD7]/10 rounded-xs text-center">
                    <span className="text-[9px] text-[#FFEFD7]/50 block">QUEUE TRACK</span>
                    <span className="font-bold text-[#FFED79]">ALL MEMBERS</span>
                  </div>
                  <div className="p-2 bg-[#10130D] border border-[#FFEFD7]/10 rounded-xs text-center">
                    <span className="text-[9px] text-[#FFEFD7]/50 block">EJECT BOT</span>
                    <span className="font-bold text-[#8A55B3]">ADMIN ONLY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PANEL 3: TRANSMITTER CODEC & DSP PIPELINE
              =================================================================== */}
          {activeTab === "TRANSMITTER" && (
            <div className="flex flex-col gap-6">
              {/* Bitrate Selector */}
              <div className="p-6 bg-[#161a12] border border-[#FFED79]/50 rounded-sm dl-panel flex flex-col gap-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-[#FFEFD7]/15">
                  <div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#10130D] bg-[#FFED79] px-2 py-0.5 rounded-xs">
                      CODEC PIPELINE
                    </span>
                    <h3 className="font-display text-2xl font-bold text-[#FFEFD7] deadlock-hero-title mt-1">
                      OPUS STREAM BITRATE
                    </h3>
                  </div>
                  <DeadlockIcon name="damage_weapon_color" isDirectImg className="w-7 h-7" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {["96", "128", "192"].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setCodecBitrate(rate)}
                      aria-pressed={codecBitrate === rate}
                      aria-label={`Set Opus bitrate to ${rate} kbps`}
                      className={`p-3 rounded-xs border font-mono text-center cursor-pointer transition-all ${
                        codecBitrate === rate
                          ? "bg-[#FFED79] text-[#10130D] font-black border-white shadow-[0_0_16px_rgba(255,237,121,0.6)]"
                          : "bg-[#10130D] text-[#FFEFD7]/70 border-[#FFEFD7]/20 hover:border-[#FFED79]"
                      }`}
                    >
                      <span className="text-base block">{rate} KBPS</span>
                      <span className="text-[10px] opacity-75">
                        {rate === "96" ? "VOICE LOW-BW" : rate === "128" ? "STANDARD" : "HIGH QUALITY"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* READ-ONLY DIAGNOSTICS: Signal Chain DSP Pipeline */}
              <div className="p-6 bg-[#12150e] border border-[#FFEFD7]/20 rounded-sm dl-panel flex flex-col gap-4 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-[#FFEFD7]/15">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-black text-[#10130D] bg-[#FFED79] px-2 py-0.5 rounded-xs uppercase">
                      DIAGNOSTICS
                    </span>
                    <h4 className="font-display text-lg font-bold text-[#FFEFD7]">
                      SIGNAL PROCESSING CHAIN
                    </h4>
                  </div>
                  <span className="font-mono text-xs text-[#5FE69E]">ACTIVE // 0 ERROR</span>
                </div>

                {/* DSP Stages Flow */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="p-2.5 bg-[#10130D] border border-[#FFED79]/30 rounded-xs flex flex-col">
                    <span className="text-[9px] text-[#FFED79] uppercase">STAGE 1</span>
                    <span className="font-bold text-[#FFEFD7]">INPUT BUFFER</span>
                    <span className="text-[9px] text-[#FFEFD7]/50 mt-1">256ms Ring Array</span>
                  </div>
                  <div className="p-2.5 bg-[#10130D] border border-[#5FE69E]/30 rounded-xs flex flex-col">
                    <span className="text-[9px] text-[#5FE69E] uppercase">STAGE 2</span>
                    <span className="font-bold text-[#FFEFD7]">SINC RESAMPLE</span>
                    <span className="text-[9px] text-[#FFEFD7]/50 mt-1">48,000 Hz Stereo</span>
                  </div>
                  <div className="p-2.5 bg-[#10130D] border border-[#70F8C1]/30 rounded-xs flex flex-col">
                    <span className="text-[9px] text-[#70F8C1] uppercase">STAGE 3</span>
                    <span className="font-bold text-[#FFEFD7]">R128 LIMITER</span>
                    <span className="text-[9px] text-[#FFEFD7]/50 mt-1">-14.0 LUFS Ceiling</span>
                  </div>
                  <div className="p-2.5 bg-[#10130D] border border-[#8A55B3]/30 rounded-xs flex flex-col">
                    <span className="text-[9px] text-[#8A55B3] uppercase">STAGE 4</span>
                    <span className="font-bold text-[#FFEFD7]">OPUS SOCKET</span>
                    <span className="text-[9px] text-[#FFEFD7]/50 mt-1">{codecBitrate} kbps Duplex</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PANEL 4: KEYBINDS & CONTROL MANUAL
              =================================================================== */}
          {activeTab === "INTERFACE" && (
            <div className="flex flex-col gap-6">
              <div className="p-6 bg-[#161a12] border border-[#5FE69E]/50 rounded-sm dl-panel flex flex-col gap-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-[#FFEFD7]/15">
                  <h3 className="font-display text-2xl font-bold text-[#FFEFD7] deadlock-hero-title">
                    KEYBOARD SHORTCUTS
                  </h3>
                  <span className="font-mono text-xs text-[#5FE69E] bg-[#10130D] px-2.5 py-1 border border-[#5FE69E]/40 rounded-xs">
                    ACTIVE MAPPINGS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {[
                    { key: "SPACE", action: "Toggle Play / Pause Transmission" },
                    { key: "S", action: "Skip Current Audio Track" },
                    { key: "ESC", action: "Return to Queue Roster View" },
                    { key: "1", action: "Switch to Queue Roster Dashboard" },
                    { key: "2", action: "Open Transmission Archive Logs" },
                    { key: "3", action: "Open Node Telemetry View" },
                    { key: "4", action: "Open Calibration Console" },
                  ].map((kb, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#10130D] border border-[#FFEFD7]/15 rounded-xs flex items-center justify-between"
                    >
                      <span className="text-[#FFEFD7]/75">{kb.action}</span>
                      <span className="dl-key-hint">{kb.key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              BOTTOM ACTION COMMIT BAR
              =================================================================== */}
          <div className="p-4 bg-[#141810]/95 border border-[#5FE69E]/40 rounded-sm dl-panel flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-mono text-[#FFEFD7]/75">
              <span className="w-2 h-2 rounded-full bg-[#5FE69E] animate-ping" />
              <span>CHANGES READY TO COMMIT</span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="dl-button dl-button-mint w-full sm:w-auto text-xs font-black px-6 py-2.5 shadow-[0_0_20px_rgba(95,230,158,0.5)] cursor-pointer"
            >
              {saving ? "SAVING CALIBRATION..." : "SAVE SETTINGS"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
