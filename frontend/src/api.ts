import type { User, Track, QueueState, ServerSettings, BotStatus } from "./types";

/** API client for Storaboga Sound. All URLs are relative (same origin). */

export async function getMe(): Promise<User | null> {
  const res = await fetch("/api/me");
  if (res.status === 401) return null;
  return res.json();
}

export async function getNowPlaying(): Promise<Track | null> {
  return fetch("/api/now-playing").then((r) => r.json());
}

export async function getQueue(): Promise<QueueState> {
  return fetch("/api/queue").then((r) => r.json());
}

export async function postSkip(): Promise<{ ok: boolean }> {
  return fetch("/api/skip", { method: "POST" }).then((r) => r.json());
}

export async function postPause(): Promise<{ ok: boolean; paused: boolean }> {
  return fetch("/api/pause", { method: "POST" }).then((r) => r.json());
}

export async function postLeave(): Promise<{ ok: boolean }> {
  return fetch("/api/leave", { method: "POST" }).then((r) => r.json());
}

export async function getVolume(): Promise<{ volume: number }> {
  return fetch("/api/volume").then((r) => r.json());
}

export async function postVolume(value: number): Promise<{ ok: boolean; volume: number }> {
  return fetch(`/api/volume/${value}`, { method: "POST" }).then((r) => r.json());
}

export async function getSettings(): Promise<ServerSettings> {
  return fetch("/api/settings").then((r) => r.json());
}

export async function patchSettings(settings: Partial<ServerSettings>): Promise<ServerSettings> {
  return fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  }).then((r) => r.json());
}

export async function getStatus(): Promise<BotStatus> {
  return fetch("/api/status").then((r) => r.json());
}

export async function getHistory(): Promise<Track[]> {
  return fetch("/api/history").then((r) => r.json());
}

export function getLoginUrl(): string {
  return "/auth/login";
}

export async function logout(): Promise<void> {
  await fetch("/auth/logout", { method: "POST" });
}
