import crypto from 'crypto';
import process from 'process';

// Deriving channel names from an HMAC (keyed on JWT_SECRET, which is already
// required for auth to function at all, so it's guaranteed present wherever
// this runs) instead of raw ids prevents anyone holding just the public
// Supabase anon key from enumerating channels (e.g. iterating user:1,
// user:2, ...) and passively observing activity metadata for accounts or
// classes they have no relationship to. This is not a substitute for real
// per-subscriber authorization — it only removes the ability to guess
// someone else's channel name. A legitimate client learns its own channel
// name from an authenticated response (login, class fetch), never derives
// it locally.
const deriveChannel = (scope, id) => {
  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET);
  hmac.update(`${scope}:${id}`);
  return `${scope}:${hmac.digest('hex').slice(0, 32)}`;
};

export const getUserChannel = (userId) => deriveChannel('user', userId);
export const getClassChannel = (classId) => deriveChannel('class', classId);
