export interface Track {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  url: string;
  duration_ms: number;
  position_ms: number;
  artwork_url: string | null;
  accent_hex: string | null;
  requester: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  source: "youtube" | "soundcloud" | "bandcamp" | "direct";
  is_active: boolean;
  added_at: number;
}

export interface QueueState {
  tracks: Track[];
  total: number;
}

export interface BotStatus {
  uptime_seconds: number;
  servers_connected: number;
  voice_connections: number;
  latency_ms: number;
  memory_mb: number;
  memory_limit_mb: number;
  version: string;
}

export interface ServerSettings {
  dj_role_id: string | null;
  default_volume: number;
}

export interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  guild_id: string;
  tier: "user" | "moderator" | "admin";
}

export type ViewName = "dashboard" | "login" | "settings" | "history" | "status" | "admin";
