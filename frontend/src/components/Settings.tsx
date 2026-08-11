import { useState, useEffect } from "react";
import type { User, ServerSettings } from "../types";
import { getSettings, patchSettings } from "../api";

interface SettingsProps {
  user: User;
  settings: ServerSettings;
  onSave: (settings: Partial<ServerSettings>) => Promise<void> | void;
}

export default function Settings({ user, settings, onSave }: SettingsProps) {
  const [volume, setVolume] = useState<number>(settings.default_volume ?? 50);
  const [djRoleId, setDjRoleId] = useState<string>(settings.dj_role_id ?? "");
  const [autoDisconnect, setAutoDisconnect] = useState<boolean>(true);
  const [autoAnnounce, setAutoAnnounce] = useState<boolean>(true);
  const [repeatQueue, setRepeatQueue] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data) {
          if (data.default_volume !== undefined) setVolume(data.default_volume);
          if (data.dj_role_id !== undefined) setDjRoleId(data.dj_role_id ?? "");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch settings on mount", err);
      });
  }, []);

  useEffect(() => {
    if (settings) {
      if (settings.default_volume !== undefined) setVolume(settings.default_volume);
      if (settings.dj_role_id !== undefined) setDjRoleId(settings.dj_role_id ?? "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload: Partial<ServerSettings> = {
        default_volume: volume,
        dj_role_id: djRoleId.trim() || null,
      };
      const result = await patchSettings(payload);
      await onSave(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden">
      {/* LEFT COLUMN: FORM CONTROLS */}
      <section className="left-column paper-sculpted-panel flex-1.35 flex flex-col gap-5 p-6 h-full">
        <div className="settings-header flex flex-col gap-1">
          <h2 className="settings-title stamped-title text-2xl">SETTINGS</h2>
          <span className="text-[11px] font-mono tracking-widest text-[#55503E] uppercase">
            PARLOR CONFIGURATION
          </span>
          <div className="deco-divider mt-1" />
        </div>

        {/* 1. DJ Role (dj_role_id) */}
        <div className="brass-control-plate">
          <div className="plate-title-row">
            <span className="plate-label stamped-title">DJ ROLE</span>
          </div>
          <input
            type="text"
            className="dl-input"
            placeholder="Role ID or @Role"
            value={djRoleId}
            onChange={(e) => setDjRoleId(e.target.value)}
          />
        </div>

        {/* 2. Default Settings Toggles */}
        <div className="brass-control-plate">
          <div className="plate-title-row">
            <span className="plate-label stamped-title">DEFAULT SETTINGS</span>
          </div>
          <div className="toggles-list flex flex-col gap-3">
            <div className="toggle-row flex items-center justify-between py-1">
              <span className="toggle-text text-sm">Auto-disconnect when empty</span>
              <button
                type="button"
                className={`brass-mech-switch ${autoDisconnect ? "on" : ""}`}
                onClick={() => setAutoDisconnect(!autoDisconnect)}
                aria-label="Toggle auto disconnect"
              >
                <div className="switch-knob" />
              </button>
            </div>

            <div className="toggle-row flex items-center justify-between py-1">
              <span className="toggle-text text-sm">Auto-announce tracks</span>
              <button
                type="button"
                className={`brass-mech-switch ${autoAnnounce ? "on" : ""}`}
                onClick={() => setAutoAnnounce(!autoAnnounce)}
                aria-label="Toggle auto announce"
              >
                <div className="switch-knob" />
              </button>
            </div>

            <div className="toggle-row flex items-center justify-between py-1">
              <span className="toggle-text text-sm">Repeat queue</span>
              <button
                type="button"
                className={`brass-mech-switch ${repeatQueue ? "on" : ""}`}
                onClick={() => setRepeatQueue(!repeatQueue)}
                aria-label="Toggle repeat queue"
              >
                <div className="switch-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          className="save-stamp-btn font-serif font-bold text-sm tracking-widest uppercase mt-2"
          onClick={handleSave}
          disabled={saving}
        >
          <span className="stamped-title">
            {saving ? "SAVING..." : saved ? "SAVED!" : "SAVE"}
          </span>
        </button>
      </section>

      {/* RIGHT COLUMN: LIVE PROFILE PANEL */}
      <section className="right-column flex-1 flex flex-col h-full">
        <div className="preview-panel paper-sculpted-panel p-6 flex flex-col gap-5">
          <h3 className="preview-title stamped-title text-base border-b border-[#FFEFD7]/10 pb-2">
            LIVE PROFILE
          </h3>

          {/* User Info Header */}
          <div className="flex items-center gap-3 p-3 bg-black/40 border border-[#FFEFD7]/10">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-10 h-10 rounded-full border border-[#70F8C1]"
              />
            ) : (
              <div className="w-10 h-10 bg-[#8A55B3] border border-[#70F8C1] flex items-center justify-center font-serif font-bold text-lg text-[#FFEFD7]">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#FFEFD7]">{user.username}</span>
              <span className="text-[9px] font-mono tracking-widest text-[#8A55B3] bg-[#8A55B3]/20 px-1 border border-[#8A55B3]/40 w-fit">
                {user.tier.toUpperCase()} BADGE
              </span>
            </div>
          </div>

          <div className="preview-grid flex flex-col gap-4">
            <div className="preview-item">
              <span className="preview-item-label text-[10px] font-mono text-[#55503E] tracking-widest">
                SERVER IDENTIFIER
              </span>
              <span className="preview-item-val font-mono text-sm text-[#FFEFD7] font-bold">
                {user.guild_id || "N/A"}
              </span>
            </div>

            <div className="preview-item">
              <span className="preview-item-label text-[10px] font-mono text-[#55503E] tracking-widest">
                DJ ROLE
              </span>
              <span className="preview-item-val font-mono text-sm text-[#5FE69E] font-bold">
                {djRoleId || "None"}
              </span>
            </div>

            <div className="preview-item">
              <span className="preview-item-label text-[10px] font-mono text-[#55503E] tracking-widest">
                AUTO-DISCONNECT
              </span>
              <span
                className="preview-item-val font-mono text-sm font-bold"
                style={{ color: autoDisconnect ? "var(--soul-color)" : "var(--silvered)" }}
              >
                {autoDisconnect ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            <div className="preview-item">
              <span className="preview-item-label text-[10px] font-mono text-[#55503E] tracking-widest">
                AUTO-ANNOUNCE
              </span>
              <span
                className="preview-item-val font-mono text-sm font-bold"
                style={{ color: autoAnnounce ? "var(--soul-color)" : "var(--silvered)" }}
              >
                {autoAnnounce ? "ENABLED" : "DISABLED"}
              </span>
            </div>

            <div className="preview-item">
              <span className="preview-item-label text-[10px] font-mono text-[#55503E] tracking-widest">
                REPEAT QUEUE
              </span>
              <span
                className="preview-item-val font-mono text-sm font-bold"
                style={{ color: repeatQueue ? "var(--soul-color)" : "var(--silvered)" }}
              >
                {repeatQueue ? "ENABLED" : "DISABLED"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
