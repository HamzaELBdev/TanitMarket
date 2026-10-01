/**
 * Meeting proposals inside a chat: "let's meet Thursday 15:00 at Café X".
 *
 * A proposal is an ordinary chat message carrying `appointment: { at, place }`.
 * Messages are append-only in firestore.rules, so an answer is another message
 * (`appointmentReply: { to, answer }`) and the state of a proposal is worked
 * out here from the messages that follow it — nothing is ever edited in place.
 *
 * Pure, and tolerant on purpose: a message is data any participant can write,
 * so every reader goes through `readAppointment` and ignores what is malformed
 * instead of rendering NaN dates or crashing the thread.
 */

export const PLACE_MIN = 3;
export const PLACE_MAX = 120;
export const MAX_DAYS_AHEAD = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
export const TIME_ZONE = 'Africa/Tunis';

export const ANSWERS = ['confirm', 'decline', 'cancel'];

/** @returns {{ok:true, data:{at:number, place:string}}|{ok:false, error:string}} */
export function buildAppointment({ at, place }, now = Date.now()) {
  const when = typeof at === 'number' ? at : Date.parse(at);
  if (!Number.isFinite(when)) return { ok: false, error: 'bad-date' };
  if (when <= now) return { ok: false, error: 'past' };
  if (when > now + MAX_DAYS_AHEAD * DAY_MS) return { ok: false, error: 'too-far' };
  const spot = String(place ?? '').trim().replace(/\s+/g, ' ');
  if (spot.length < PLACE_MIN) return { ok: false, error: 'place-short' };
  if (spot.length > PLACE_MAX) return { ok: false, error: 'place-long' };
  return { ok: true, data: { at: Math.round(when), place: spot } };
}

export function appointmentErrorKey(code) {
  return {
    'bad-date': 'apptBadDate',
    past: 'apptPast',
    'too-far': 'apptTooFar',
    'place-short': 'apptPlaceShort',
    'place-long': 'apptPlaceLong',
  }[code] || 'apptFailed';
}

/** The proposal in a message, or null when the message carries none (or a broken one). */
export function readAppointment(message) {
  const a = message?.appointment;
  if (!a || typeof a !== 'object') return null;
  const at = Number(a.at);
  const place = typeof a.place === 'string' ? a.place.trim() : '';
  if (!Number.isFinite(at) || at <= 0 || place.length < PLACE_MIN || place.length > PLACE_MAX) return null;
  return { at, place };
}

/** The answer in a message, or null. */
export function readReply(message) {
  const r = message?.appointmentReply;
  if (!r || typeof r !== 'object') return null;
  if (typeof r.to !== 'string' || !ANSWERS.includes(r.answer)) return null;
  return { to: r.to, answer: r.answer };
}

/**
 * proposed | confirmed | declined | cancelled | expired | past
 *
 * Only the other party can confirm or decline, only the proposer can cancel —
 * an answer from the wrong side is ignored, so nobody can confirm their own
 * proposal. The last valid answer wins, so a confirmed meeting can still be
 * declined or cancelled. A proposal nobody answered before its time is
 * `expired`; a confirmed one whose time has gone is `past`.
 */
export function appointmentStatus(proposal, messages, now = Date.now()) {
  const appt = readAppointment(proposal);
  if (!appt) return null;
  let status = 'proposed';
  for (const m of messages || []) {
    const reply = readReply(m);
    if (!reply || reply.to !== proposal.id) continue;
    const byProposer = m.senderId === proposal.senderId;
    if (reply.answer === 'cancel' && byProposer) status = 'cancelled';
    else if (reply.answer === 'confirm' && !byProposer) status = 'confirmed';
    else if (reply.answer === 'decline' && !byProposer) status = 'declined';
  }
  if (appt.at < now) {
    if (status === 'proposed') return 'expired';
    if (status === 'confirmed') return 'past';
  }
  return status;
}

/** What a viewer may do with a proposal in its current state. */
export function appointmentActions(status, { isProposer }) {
  if (status === 'proposed') return isProposer ? ['cancel'] : ['confirm', 'decline'];
  if (status === 'confirmed') return isProposer ? ['cancel'] : ['decline'];
  return [];
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

// Tunisia has no daylight saving, so a fixed offset is exact. Computed by hand
// rather than with Intl so the text is the same on every browser and in tests.
const TUNIS_OFFSET_MS = 60 * 60 * 1000;

const MONTHS_AR = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** "jeu. 3 oct. à 15:00" (or the Arabic form with lang 'ar'), in Tunisian time. */
export function formatAppointment(at, lang = 'fr') {
  const d = new Date(Number(at) + TUNIS_OFFSET_MS);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  if (lang === 'ar') return `${DAYS_AR[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_AR[d.getUTCMonth()]} ${hh}:${mm}`;
  return `${DAYS_FR[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]} à ${hh}:${mm}`;
}

/** The text stored on the message, so push, e-mail and the chat list read sensibly. */
export function appointmentSummary({ at, place }) {
  return `📅 Rendez-vous proposé : ${formatAppointment(at)} — ${place}`;
}

export function replySummary(answer, appt) {
  const when = `${formatAppointment(appt.at)} — ${appt.place}`;
  if (answer === 'confirm') return `✅ Rendez-vous confirmé : ${when}`;
  if (answer === 'decline') return `❌ Rendez-vous refusé : ${when}`;
  return `🚫 Rendez-vous annulé : ${when}`;
}

/** Value for <input type="datetime-local"> in Tunisian time, for an epoch ms. */
export function toLocalInputValue(ms) {
  const d = new Date(ms + TUNIS_OFFSET_MS);
  return d.toISOString().slice(0, 16);
}

/** Epoch ms from a datetime-local value read as Tunisian time; NaN when empty or malformed. */
export function fromLocalInputValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ''))) return NaN;
  return Date.parse(`${value}:00Z`) - TUNIS_OFFSET_MS;
}

const icsText = (s) => String(s).replace(/[\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** A one-event iCalendar file (1 hour), so the meeting can go in the phone's calendar. */
export function buildIcs({ at, place }, title = 'Rendez-vous TanitMarket') {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TanitMarket//Chat//FR',
    'BEGIN:VEVENT',
    `UID:${at}@tanitmarket.com`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(at)}`,
    `DTEND:${icsDate(at + 60 * 60 * 1000)}`,
    `SUMMARY:${icsText(title)}`,
    `LOCATION:${icsText(place)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
