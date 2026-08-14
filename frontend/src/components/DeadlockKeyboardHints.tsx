import React from "react";
import type { ViewName } from "../types";

interface DeadlockKeyboardHintsProps {
  currentView: ViewName;
  onSelectView: (view: ViewName) => void;
}

export const DeadlockKeyboardHints: React.FC<DeadlockKeyboardHintsProps> = ({
  currentView,
  onSelectView,
}) => {
  return (
    <div className="flex items-center gap-4 text-xs font-mono select-none">
      {currentView !== "dashboard" ? (
        <button
          onClick={() => onSelectView("dashboard")}
          className="flex items-center gap-2 text-[#FFEFD7] hover:text-[#70F8C1] transition-colors cursor-pointer group"
        >
          <span className="dl-key-hint group-hover:border-[#70F8C1]">ESC</span>
          <span className="font-bold tracking-wider uppercase text-[11px]">BACK TO QUEUE</span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#FFEFD7]/70">
            <span className="dl-key-hint">SPACE</span>
            <span className="text-[11px]">PAUSE</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#FFEFD7]/70">
            <span className="dl-key-hint">S</span>
            <span className="text-[11px]">SKIP</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[#FFEFD7]/50">
            <span className="dl-key-hint">1-4</span>
            <span className="text-[11px]">VIEWS</span>
          </div>
        </div>
      )}
    </div>
  );
};
