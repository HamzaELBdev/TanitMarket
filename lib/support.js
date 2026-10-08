/**
 * Support requests: what a valid one is, decided before anything is written.
 * Pure, so it is testable; firestore.rules enforces the same limits, this is
 * the same check run early so a member gets a clear message instead of a
 * permission-denied.
 *
 * A request is a `supportTickets` document. `channel` says how it was opened:
 * 'chat' (live conversation with the admins) or 'form' (a contact message the
 * admins answer in the same thread).
 */

export const SUPPORT_TOPICS = ['help', 'technical', 'account', 'sponsoring', 'listing', 'report', 'other'];
export const SUPPORT_CHANNELS = ['chat', 'form'];
export const SUPPORT_MESSAGE_MAX = 2000;
export const SUPPORT_MESSAGE_MIN = 5;

/** Validate and shape a new ticket. Returns { ok: true, data } or { ok: false, error }. */
export function buildTicket({ topic, channel, message, user }) {
  if (!user?.uid) return { ok: false, error: 'not-signed-in' };
  if (!SUPPORT_TOPICS.includes(topic)) return { ok: false, error: 'bad-topic' };
  if (!SUPPORT_CHANNELS.includes(channel)) return { ok: false, error: 'bad-channel' };
  const text = String(message ?? '').trim();
  if (text.length < SUPPORT_MESSAGE_MIN) return { ok: false, error: 'message-short' };
  if (text.length > SUPPORT_MESSAGE_MAX) return { ok: false, error: 'message-long' };
  return {
    ok: true,
    data: {
      userId: user.uid,
      userName: String(user.name || '').slice(0, 100),
      userEmail: String(user.email || '').slice(0, 200),
      topic,
      channel,
      status: 'open',
      lastMessage: text.slice(0, 200),
      lastSenderRole: 'user',
      unreadAdmin: true,
      unreadUser: false,
    },
    message: text,
  };
}

/** Validate a reply inside an existing ticket. */
export function buildReply(message) {
  const text = String(message ?? '').trim();
  if (!text) return { ok: false, error: 'message-short' };
  if (text.length > SUPPORT_MESSAGE_MAX) return { ok: false, error: 'message-long' };
  return { ok: true, text };
}

const ERROR_KEYS = {
  'not-signed-in': 'supportLoginNeeded',
  'bad-topic': 'supportErrTopic',
  'message-short': 'supportErrShort',
  'message-long': 'supportErrLong',
};

export function supportErrorKey(code) {
  return ERROR_KEYS[code] || 'supportErrFailed';
}
