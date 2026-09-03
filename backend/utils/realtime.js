import console from 'console';
import supabase from '#backend/config/supabase.js';

// Publishes a content-free broadcast event to a Supabase Realtime channel
// (e.g. "user:5" or "class:12"). Fire-and-forget: the caller's write has
// already succeeded via the normal DB path, so a failure here is logged and
// swallowed rather than surfaced as a request error.
export const publishEvent = async (channelName, eventType, payload = {}) => {
  if (!supabase) return;

  const channel = supabase.channel(channelName);
  try {
    await channel.httpSend(eventType, payload);
  } catch (error) {
    console.error(
      `Failed to publish realtime event "${eventType}" on "${channelName}":`,
      error.message
    );
  } finally {
    supabase.removeChannel(channel);
  }
};
