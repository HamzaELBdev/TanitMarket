/**
 * Trade ("troc") proposals inside a chat: "I'll give you my bike for your
 * console, and add 50 TND".
 *
 * Same shape as appointment cards (lib/appointment.js): a proposal is a chat
 * message carrying `trade`, an answer is a later message carrying
 * `tradeReply`, and the state is derived from the messages — messages are
 * append-only, so nothing is edited. Pure and tolerant for the same reason:
 * any participant can write these fields, so readers ignore what is malformed.
 */

export const CASH_MAX = 1_000_000;
export const ANSWERS = ['accept', 'decline', 'withdraw'];

const safeImage = (url) => (typeof url === 'string' && /^https:\/\//.test(url) && url.length <= 600 ? url : null);

/**
 * @param offered the proposer's own listing they put forward
 * @returns {{ok:true,data}|{ok:false,error}}
 */
export function buildTrade({ offered, cash, uid, targetListingId }) {
  if (!uid) return { ok: false, error: 'not-signed-in' };
  if (!offered?.id) return { ok: false, error: 'no-item' };
  const owner = offered.sellerId || offered.seller?.id;
  if (owner !== uid) return { ok: false, error: 'not-yours' };
  if (offered.status !== 'approved') return { ok: false, error: 'not-live' };
  if (targetListingId && String(offered.id) === String(targetListingId)) return { ok: false, error: 'same-item' };

  let top = 0;
  if (cash !== null && cash !== undefined && String(cash).trim() !== '') {
    top = Number(cash);
    if (!Number.isFinite(top) || top < 0 || top > CASH_MAX) return { ok: false, error: 'bad-cash' };
    top = Math.round(top);
  }
  return {
    ok: true,
    data: {
      offeredListingId: String(offered.id),
      offeredTitle: String(offered.title || '').trim().slice(0, 120),
      offeredImage: safeImage(offered.images?.[0] || offered.image),
      cash: top,
    },
  };
}

export function tradeErrorKey(code) {
  return {
    'not-signed-in': 'tradeLogin',
    'no-item': 'tradeNoItem',
    'not-yours': 'tradeNotYours',
    'not-live': 'tradeNotLive',
    'same-item': 'tradeSameItem',
    'bad-cash': 'tradeBadCash',
  }[code] || 'tradeFailed';
}

/** The proposal in a message, or null. */
export function readTrade(message) {
  const t = message?.trade;
  if (!t || typeof t !== 'object') return null;
  const title = typeof t.offeredTitle === 'string' ? t.offeredTitle.trim() : '';
  const id = typeof t.offeredListingId === 'string' ? t.offeredListingId : '';
  const cash = Number(t.cash ?? 0);
  if (!id || !title || !Number.isFinite(cash) || cash < 0 || cash > CASH_MAX) return null;
  return { offeredListingId: id, offeredTitle: title, offeredImage: safeImage(t.offeredImage), cash };
}

export function readTradeReply(message) {
  const r = message?.tradeReply;
  if (!r || typeof r !== 'object') return null;
  if (typeof r.to !== 'string' || !ANSWERS.includes(r.answer)) return null;
  return { to: r.to, answer: r.answer };
}

/**
 * proposed | accepted | declined | withdrawn
 *
 * The other party accepts or declines, the proposer withdraws; an answer from
 * the wrong side is ignored, so nobody accepts their own proposal. The last
 * valid answer wins.
 */
export function tradeStatus(proposal, messages) {
  if (!readTrade(proposal)) return null;
  let status = 'proposed';
  for (const m of messages || []) {
    const reply = readTradeReply(m);
    if (!reply || reply.to !== proposal.id) continue;
    const byProposer = m.senderId === proposal.senderId;
    if (reply.answer === 'withdraw' && byProposer) status = 'withdrawn';
    else if (reply.answer === 'accept' && !byProposer) status = 'accepted';
    else if (reply.answer === 'decline' && !byProposer) status = 'declined';
  }
  return status;
}

export function tradeActions(status, { isProposer }) {
  if (status === 'proposed') return isProposer ? ['withdraw'] : ['accept', 'decline'];
  if (status === 'accepted') return isProposer ? ['withdraw'] : ['decline'];
  return [];
}

/** The text stored on the message, so push, e-mail and the chat list read sensibly. */
export function tradeSummary({ offeredTitle, cash }) {
  return `🔄 Proposition de troc : « ${offeredTitle} »${cash > 0 ? ` + ${cash} TND` : ''}`;
}

export function tradeReplySummary(answer, { offeredTitle }) {
  if (answer === 'accept') return `✅ Troc accepté : « ${offeredTitle} »`;
  if (answer === 'decline') return `❌ Troc refusé : « ${offeredTitle} »`;
  return `🚫 Troc retiré : « ${offeredTitle} »`;
}
