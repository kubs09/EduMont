import { renderHook } from '@testing-library/react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

const channelMock = {
  on: vi.fn(function (this: unknown) {
    return this;
  }),
  subscribe: vi.fn(),
};
const realtimeClientMock = {
  channel: vi.fn(() => channelMock),
  removeChannel: vi.fn(),
};

// NOTE: uses a relative path (not the "@frontend/..." alias used elsewhere
// in this codebase) because vite's resolve.tsconfigPaths respects
// tsconfig.json's `exclude: ["**/*.test.ts", ...]`, so aliases don't resolve
// from *.test.ts files here. Module identity still matches the hook's
// aliased import — both resolve to the same file — so the mock applies
// correctly.
vi.mock('../services/realtimeClient', () => ({
  get realtimeClient() {
    return realtimeClientMock;
  },
}));

import { useRealtimeChannel } from './useRealtimeChannel';

describe('useRealtimeChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when channelName is null', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeChannel(null, onEvent));

    expect(realtimeClientMock.channel).not.toHaveBeenCalled();
  });

  it('subscribes to the named channel and forwards broadcast events', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeChannel('class:5', onEvent));

    expect(realtimeClientMock.channel).toHaveBeenCalledWith('class:5');
    expect(channelMock.on).toHaveBeenCalledWith('broadcast', { event: '*' }, expect.any(Function));

    const broadcastHandler = channelMock.on.mock.calls[0][2];
    broadcastHandler({ event: 'presentation_changed', payload: { classId: 5 } });

    expect(onEvent).toHaveBeenCalledWith('presentation_changed', { classId: 5 });
  });

  it('does not fire "reconnect" on the initial subscribe', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeChannel('class:5', onEvent));

    const subscribeCallback = channelMock.subscribe.mock.calls[0][0];
    subscribeCallback('SUBSCRIBED');

    expect(onEvent).not.toHaveBeenCalledWith('reconnect', {});
  });

  it('fires "reconnect" on a subsequent SUBSCRIBED after the first', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeChannel('class:5', onEvent));

    const subscribeCallback = channelMock.subscribe.mock.calls[0][0];
    subscribeCallback('SUBSCRIBED');
    subscribeCallback('CHANNEL_ERROR');
    subscribeCallback('SUBSCRIBED');

    expect(onEvent).toHaveBeenCalledWith('reconnect', {});
  });

  it('fires "poll" on the fallback interval', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeChannel('class:5', onEvent, 5000));

    vi.advanceTimersByTime(5000);

    expect(onEvent).toHaveBeenCalledWith('poll', {});
  });

  it('removes the channel and clears the interval on unmount', () => {
    const onEvent = vi.fn();
    const { unmount } = renderHook(() => useRealtimeChannel('class:5', onEvent));

    unmount();

    expect(realtimeClientMock.removeChannel).toHaveBeenCalledWith(channelMock);
  });

  it('fires "reconnect" when the tab becomes visible', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeChannel('class:5', onEvent));

    // document.visibilityState is normally read-only in jsdom, so it must be
    // stubbed via Object.defineProperty. The original descriptor is restored
    // in finally so the stub doesn't leak into other tests.
    const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    try {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(onEvent).toHaveBeenCalledWith('reconnect', {});
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(document, 'visibilityState', originalDescriptor);
      } else {
        delete (document as { visibilityState?: string }).visibilityState;
      }
    }
  });

  it('does not resubscribe when onEvent changes, and calls the latest onEvent', () => {
    const firstOnEvent = vi.fn();
    const secondOnEvent = vi.fn();
    const { rerender } = renderHook(({ onEvent }) => useRealtimeChannel('class:5', onEvent), {
      initialProps: { onEvent: firstOnEvent },
    });

    rerender({ onEvent: secondOnEvent });

    expect(realtimeClientMock.channel).toHaveBeenCalledTimes(1);

    const broadcastHandler = channelMock.on.mock.calls[0][2];
    broadcastHandler({ event: 'presentation_changed', payload: {} });

    expect(firstOnEvent).not.toHaveBeenCalled();
    expect(secondOnEvent).toHaveBeenCalledWith('presentation_changed', {});
  });
});
