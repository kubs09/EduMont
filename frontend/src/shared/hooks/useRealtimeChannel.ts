import { useEffect, useRef } from 'react';
import { realtimeClient } from '@frontend/shared/services/realtimeClient';

const DEFAULT_POLL_INTERVAL_MS = 3 * 60 * 1000;

export type RealtimeEventHandler = (eventType: string, payload: Record<string, unknown>) => void;

/**
 * Subscribes to a Supabase Realtime broadcast channel and calls onEvent for
 * every event received, plus synthetic "poll" (fixed interval, resilience
 * fallback) and "reconnect" (tab refocus, or the socket reconnecting after a
 * drop) events. Pass null as channelName to skip subscribing (e.g. while the
 * relevant id isn't known yet, or the viewer shouldn't receive this channel).
 */
export const useRealtimeChannel = (
  channelName: string | null | undefined,
  onEvent: RealtimeEventHandler,
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS
): void => {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const pollId = setInterval(() => onEventRef.current('poll', {}), pollIntervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        onEventRef.current('reconnect', {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Captured as a local const (rather than referencing the imported
    // `realtimeClient` binding directly below) so TypeScript's null-narrowing
    // from this guard carries into the cleanup closure returned further down.
    const client = realtimeClient;
    if (!channelName || !client) {
      return () => {
        clearInterval(pollId);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    let hasConnectedBefore = false;
    const channel = client.channel(channelName);
    channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
      onEventRef.current(event, payload ?? {});
    });
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        if (hasConnectedBefore) {
          onEventRef.current('reconnect', {});
        }
        hasConnectedBefore = true;
      }
    });

    return () => {
      clearInterval(pollId);
      document.removeEventListener('visibilitychange', handleVisibility);
      client.removeChannel(channel);
    };
  }, [channelName, pollIntervalMs]);
};
