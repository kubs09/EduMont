import { jest, describe, beforeEach, test, expect } from '@jest/globals';

const channelMock = { httpSend: jest.fn() };
const supabaseMock = { channel: jest.fn(() => channelMock), removeChannel: jest.fn() };

jest.unstable_mockModule('#backend/config/supabase.js', () => ({
  __esModule: true,
  default: supabaseMock,
}));

const { publishEvent } = await import('#backend/utils/realtime.js');

describe('publishEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sends a broadcast message on the given channel', async () => {
    channelMock.httpSend.mockResolvedValueOnce({ success: true });

    await publishEvent('class:5', 'presentation_changed', { classId: 5 });

    expect(supabaseMock.channel).toHaveBeenCalledWith('class:5');
    expect(channelMock.httpSend).toHaveBeenCalledWith('presentation_changed', { classId: 5 });
    expect(supabaseMock.removeChannel).toHaveBeenCalledWith(channelMock);
  });

  test('defaults payload to an empty object', async () => {
    channelMock.httpSend.mockResolvedValueOnce({ success: true });

    await publishEvent('user:1', 'message_received');

    expect(channelMock.httpSend).toHaveBeenCalledWith('message_received', {});
  });

  test('does not throw when send rejects', async () => {
    channelMock.httpSend.mockRejectedValueOnce(new Error('network down'));

    await expect(publishEvent('class:5', 'presentation_changed', {})).resolves.toBeUndefined();

    expect(supabaseMock.removeChannel).toHaveBeenCalledWith(channelMock);
  });

  test('is a no-op when the supabase client is unavailable', async () => {
    jest.resetModules();
    jest.unstable_mockModule('#backend/config/supabase.js', () => ({
      __esModule: true,
      default: null,
    }));
    // Note: no channel/removeChannel mock needed here since the null-client
    // branch returns before either would be touched.
    const { publishEvent: publishEventNoClient } = await import('#backend/utils/realtime.js');

    await expect(
      publishEventNoClient('class:5', 'presentation_changed', {})
    ).resolves.toBeUndefined();
    expect(channelMock.httpSend).not.toHaveBeenCalled();
  });
});
