import { useEffect, useRef, useState } from "react";
import type { Track, QueueState } from "./types";

export interface SSEState {
  nowPlaying: Track | null;
  queue: QueueState | null;
  positionMs: number;
  trackId: string | null;
  connected: boolean;
  loadingQuery: string | null;
}

/**
 * SSE hook — connects to /api/events via EventSource.
 * Dispatches on event name, retries with exponential backoff (1s → 2s → 5s → 10s cap).
 */
export function useSSE(): SSEState {
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [positionMs, setPositionMs] = useState<number>(0);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [loadingQuery, setLoadingQuery] = useState<string | null>(null);

  const retryDelayRef = useRef<number>(1000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let active = true;

    function connect() {
      if (!active) return;

      const es = new EventSource("/api/events");
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!active) return;
        setConnected(true);
        retryDelayRef.current = 1000;
      };

      es.addEventListener("now-playing", (event: MessageEvent) => {
        if (!active) return;
        try {
          const data: Track = JSON.parse(event.data);
          setNowPlaying(data);
          setTrackId(data ? data.id : null);
          setPositionMs(data ? data.position_ms : 0);
          setLoadingQuery(null);
        } catch {
          // ignore malformed JSON
        }
      });

      es.addEventListener("queue-update", (event: MessageEvent) => {
        if (!active) return;
        try {
          const data: QueueState = JSON.parse(event.data);
          setQueue(data);
        } catch {
          // ignore malformed JSON
        }
      });

      es.addEventListener("position-tick", (event: MessageEvent) => {
        if (!active) return;
        try {
          const data: { position_ms: number; track_id: string } = JSON.parse(event.data);
          setPositionMs(data.position_ms);
          setTrackId(data.track_id);
        } catch {
          // ignore malformed JSON
        }
      });

      es.addEventListener("track-end", (event: MessageEvent) => {
        if (!active) return;
        try {
          const data: { track_id: string } = JSON.parse(event.data);
          setTrackId((currentTrackId) => {
            if (currentTrackId === data.track_id) {
              setNowPlaying(null);
              setPositionMs(0);
              return null;
            }
            return currentTrackId;
          });
        } catch {
          // ignore malformed JSON
        }
      });

      es.addEventListener("loading", (event: MessageEvent) => {
        if (!active) return;
        try {
          const data: { query: string } = JSON.parse(event.data);
          setLoadingQuery(data.query);
        } catch {
          // ignore malformed JSON
        }
      });

      es.addEventListener("connection", (event: MessageEvent) => {
        if (!active) return;
        try {
          const data: { status: "connected" | "disconnected" } = JSON.parse(event.data);
          setConnected(data.status === "connected");
        } catch {
          // ignore malformed JSON
        }
      });

      es.onerror = () => {
        if (!active) return;
        setConnected(false);
        es.close();

        // Exponential backoff: 1s → 2s → 5s → 10s cap
        const delay = retryDelayRef.current;
        if (delay < 2000) retryDelayRef.current = 2000;
        else if (delay < 5000) retryDelayRef.current = 5000;
        else retryDelayRef.current = 10000;

        timerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      active = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { nowPlaying, queue, positionMs, trackId, connected, loadingQuery };
}
