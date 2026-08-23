import React from "react";
import type { ViewName, User } from "../types";
import { DeadlockIcon } from "./DeadlockIcon";

interface DeadlockNavRailProps {
  currentView: ViewName;
  onSelectView: (view: ViewName) => void;
  queueCount: number;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  latencyMs?: number;
  connected?: boolean;
}

export const DeadlockNavRail: React.FC<DeadlockNavRailProps> = ({
  currentView,
  onSelectView,
  queueCount,
  user,
  onLogin,
  onLogout,
  latencyMs = 18,
  connected = true,
}) => {
  const navItems: { id: ViewName; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: "dashboard",
      label: "Queue / Select",
      badge: queueCount > 0 ? queueCount : undefined,
      icon: <DeadlockIcon name="ammo_clip_size" className="w-5 h-5" alt="Queue & Select" />,
    },
    {
      id: "history",
      label: "History Archive",
      icon: <DeadlockIcon name="cooldown" className="w-5 h-5" alt="History Archive" />,
    },
    {
      id: "status",
      label: "Node Status",
      icon: <DeadlockIcon name="icon_spirit" className="w-5 h-5" alt="Node Status" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <DeadlockIcon name="debuff_remove" className="w-5 h-5" alt="Settings" />,
    },
  ];

  return (
    <aside className="fixed right-0 top-0 bottom-0 z-40 w-14 lg:w-16 flex flex-col justify-between items-center py-6 bg-[#12160f]/90 border-l border-[#FFEFD7]/15 backdrop-blur-md select-none">
      {/* Top Logo Glyph / Telemetry Indicator */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => onSelectView("dashboard")}
          className="w-10 h-10 rounded-full bg-[#1e251a] border border-[#70F8C1]/50 flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(112,248,193,0.3)] hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70F8C1]"
          title="Storaboga Sound"
          aria-label="Storaboga Sound Home"
        >
          <DeadlockIcon name="icon_soul" className="w-5 h-5 text-[#70F8C1]" alt="" />
        </button>

        {/* Live Socket Ping */}
        <div className="flex items-center gap-1 font-mono text-[9px] text-[#FFEFD7]/60" title={`Gateway Ping: ${latencyMs}ms`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#70F8C1] animate-pulse" : "bg-[#FF410D]"}`} />
          <span>{latencyMs}ms</span>
        </div>
      </div>

      {/* Center Nav Circular Buttons */}
      <div className="flex flex-col gap-4 items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onSelectView(item.id)}
                className={`dl-rail-btn ${isActive ? "active" : ""}`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}

                {/* Badge for Queue Count */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 font-mono text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#FFED79] text-[#10130D] border border-[#10130D]">
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Slide-out Tooltip Box */}
              <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[#10130D] border border-[#70F8C1]/60 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#FFEFD7] shadow-2xl z-50">
                {item.label}
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#10130D] border-r border-t border-[#70F8C1]/60 transform rotate-45" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom User / Profile Module */}
      <div className="flex flex-col items-center gap-2">
        {user ? (
          <div className="relative group">
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-full bg-[#1e251a] border border-[#70F8C1]/40 overflow-hidden cursor-pointer hover:border-[#FF410D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF410D]"
              title={`Logged in as ${user.username} (${user.tier}) - Click to logout`}
              aria-label={`Logged in as ${user.username} (${user.tier}). Click to logout`}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-sm text-[#70F8C1]">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[#10130D] border border-[#FF410D]/60 px-3 py-1 font-mono text-xs text-[#FFEFD7] shadow-2xl z-50">
              LOGOUT: {user.username}
              <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#10130D] border-r border-t border-[#FF410D]/60 transform rotate-45" />
            </div>
          </div>
        ) : (
          <div className="relative group">
            <button
              onClick={onLogin}
              className="w-10 h-10 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70F8C1]"
              title="Login with Discord"
              aria-label="Login with Discord"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </button>
            <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[#10130D] border border-[#5865F2]/60 px-3 py-1 font-mono text-xs text-[#FFEFD7] shadow-2xl z-50">
              LOGIN WITH DISCORD
              <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#10130D] border-r border-t border-[#5865F2]/60 transform rotate-45" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
