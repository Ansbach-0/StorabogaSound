import React from "react";
import type { User } from "../types";
import { DeadlockIcon } from "./DeadlockIcon";

interface DeadlockHeaderProps {
  user: User | null;
  connected: boolean;
  onLogin: () => void;
  onLogout: () => void;
  latencyMs?: number;
  voiceConnections?: number;
  currentView: string;
  onSelectView: (view: any) => void;
}

export const DeadlockHeader: React.FC<DeadlockHeaderProps> = ({
  user,
  connected,
  onLogin,
  onLogout,
  latencyMs = 18,
  voiceConnections = 1,
}) => {
  return (
    <header className="relative z-20 w-full bg-[#141811]/95 border-b border-[#FFEFD7]/15 px-4 lg:px-8 py-3.5 shadow-2xl backdrop-blur-md">
      {/* Texture grain */}
      <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Left: Brand Identity in Deadlock Hero Select Header Style */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 bg-[#1e2419] border border-[#70F8C1]/40 rounded-sm shadow-[0_0_15px_rgba(112,248,193,0.3)]">
            <div className="absolute inset-0 bg-[#70F8C1]/10 animate-pulse" />
            {/* Authentic Deadlock Soul Flame Icon */}
            <DeadlockIcon
              name="icon_soul"
              className="w-6 h-6 text-[#70F8C1] drop-shadow-[0_0_8px_rgba(112,248,193,0.8)] z-10"
              alt="Soul Flame"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-[#FFEFD7] text-shadow-[0px_0px_0px_3px_rgba(16,19,13,0.9),2px_2px_0px_2px_#10130D]">
                STORABOGA SOUND
              </h1>
              <span className="hidden sm:inline-block font-mono text-[11px] font-bold text-[#70F8C1] bg-[#70F8C1]/15 px-2 py-0.5 border border-[#70F8C1]/30 transform -skew-x-6">
                <span>NEW BLOOD 2026</span>
              </span>
            </div>
            <p className="font-mono text-xs text-[#FFEFD7]/60 tracking-wider uppercase">
              CITADEL AUDIO TRANSMITTER // DISCORD SECTOR
            </p>
          </div>
        </div>

        {/* Center: Live Transmission Telemetry */}
        <div className="hidden md:flex items-center gap-6 bg-[#10130D]/80 px-4 py-1.5 border border-[#FFEFD7]/10 rounded shadow-inner">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected
                  ? "bg-[#70F8C1] shadow-[0_0_10px_#70F8C1] animate-pulse"
                  : "bg-[#FF410D] shadow-[0_0_10px_#FF410D]"
              }`}
            />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFEFD7]/90">
              {connected ? "TRANSMISSION LINKED" : "RECONNECTING"}
            </span>
          </div>

          <div className="h-3.5 w-px bg-[#FFEFD7]/15" />

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#FFEFD7]/70">
            <span className="text-[#FFED79]">PING</span>
            <span className="font-bold text-[#FFEFD7]">{latencyMs}ms</span>
          </div>

          <div className="h-3.5 w-px bg-[#FFEFD7]/15" />

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#FFEFD7]/70">
            <span className="text-[#70F8C1]">VOICE NODE</span>
            <span className="font-bold text-[#FFEFD7]">{voiceConnections} ACTIVE</span>
          </div>
        </div>

        {/* Right: User / Auth Module */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-[#181c15] border border-[#FFEFD7]/15 p-1.5 pr-3 shadow-md">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-8 h-8 rounded border border-[#70F8C1]/50 object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-[#283023] border border-[#70F8C1]/40 flex items-center justify-center font-display font-bold text-sm text-[#70F8C1]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col">
                <span className="font-body text-sm font-bold text-[#FFEFD7] leading-tight">
                  {user.username}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase px-1 py-0.2 rounded w-fit ${
                    user.tier === "admin"
                      ? "bg-[#FFED79] text-[#10130D]"
                      : user.tier === "moderator"
                      ? "bg-[#70F8C1] text-[#10130D]"
                      : "bg-[#FFEFD7]/20 text-[#FFEFD7]"
                  }`}
                >
                  {user.tier}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="ml-2 font-mono text-xs text-[#FFEFD7]/60 hover:text-[#FF410D] transition-colors uppercase tracking-wider underline cursor-pointer"
                title="Disconnect Account"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="dl-button dl-button-mint text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              LOGIN WITH DISCORD
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
