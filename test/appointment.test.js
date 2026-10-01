// Run with: npm test   (Node's built-in runner, no deps)
//
// A meeting proposal is what two strangers rely on to find each other. The
// failures that matter: confirming your own proposal, a date shown in the wrong
// timezone, and a malformed message breaking the whole thread.

const test = require('node:test');
const assert = require('node:assert/strict');

let m;
test.before(async () => { m = await import('../lib/appointment.js'); });

const NOW = Date.parse('2026-10-01T10:00:00Z');
const H = 3600e3;
const at = (hours) => NOW + hours * H;

const proposal = (extra = {}) => ({ id: 'p1', senderId: 'alice', appointment: { at: at(24), place: 'Café Sidi Bou' }, ...extra });
const reply = (answer, senderId, to = 'p1') => ({ id: `r-${answer}-${senderId}`, senderId, isSystem: true, appointmentReply: { to, answer } });

// ── building ──

test('a valid proposal is shaped, with the place cleaned up', () => {
  const r = m.buildAppointment({ at: at(24), place: '  Café   Sidi Bou  ' }, NOW);
  assert.deepEqual(r, { ok: true, data: { at: at(24), place: 'Café Sidi Bou' } });
});

test('the time must be a real moment in the near future', () => {
  assert.equal(m.buildAppointment({ at: NaN, place: 'Café' }, NOW).error, 'bad-date');
  assert.equal(m.buildAppointment({ at: 'demain', place: 'Café' }, NOW).error, 'bad-date');
  assert.equal(m.buildAppointment({ at: NOW - H, place: 'Café' }, NOW).error, 'past');
  assert.equal(m.buildAppointment({ at: NOW, place: 'Café' }, NOW).error, 'past');
  assert.equal(m.buildAppointment({ at: NOW + 91 * 24 * H, place: 'Café' }, NOW).error, 'too-far');
  assert.equal(m.buildAppointment({ at: NOW + 90 * 24 * H, place: 'Café' }, NOW).ok, true);
});

test('the place must be something a person could find', () => {
  assert.equal(m.buildAppointment({ at: at(2), place: '  ' }, NOW).error, 'place-short');
  assert.equal(m.buildAppointment({ at: at(2), place: 'ab' }, NOW).error, 'place-short');
  assert.equal(m.buildAppointment({ at: at(2), place: 'x'.repeat(121) }, NOW).error, 'place-long');
});

test('every error code has a translation key', () => {
  for (const c of ['bad-date', 'past', 'too-far', 'place-short', 'place-long', 'other']) assert.match(m.appointmentErrorKey(c), /^appt/);
});

// ── reading what other people wrote ──

test('a malformed proposal or reply is ignored, never rendered', () => {
  for (const bad of [null, undefined, {}, { appointment: null }, { appointment: 'x' }, { appointment: { at: 'soon', place: 'Café' } }, { appointment: { at: at(1), place: 'ab' } }, { appointment: { at: at(1), place: 42 } }, { appointment: { at: 0, place: 'Café' } }]) {
    assert.equal(m.readAppointment(bad), null, JSON.stringify(bad));
    assert.equal(m.appointmentStatus({ ...bad, id: 'p1', senderId: 'a' }, [], NOW), null);
  }
  for (const bad of [null, {}, { appointmentReply: { to: 1, answer: 'confirm' } }, { appointmentReply: { to: 'p1', answer: 'hack' } }]) {
    assert.equal(m.readReply(bad), null, JSON.stringify(bad));
  }
});

// ── state ──

test('an unanswered future proposal is just proposed', () => {
  assert.equal(m.appointmentStatus(proposal(), [proposal()], NOW), 'proposed');
});

test('the other person confirms or declines', () => {
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('confirm', 'bob')], NOW), 'confirmed');
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('decline', 'bob')], NOW), 'declined');
});

test('nobody can confirm or decline their own proposal', () => {
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('confirm', 'alice')], NOW), 'proposed');
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('decline', 'alice')], NOW), 'proposed');
});

test('only the proposer can cancel', () => {
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('cancel', 'alice')], NOW), 'cancelled');
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('cancel', 'bob')], NOW), 'proposed');
});

test('the last valid answer wins: a confirmed meeting can still fall through', () => {
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('confirm', 'bob'), reply('cancel', 'alice')], NOW), 'cancelled');
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('confirm', 'bob'), reply('decline', 'bob')], NOW), 'declined');
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('decline', 'bob'), reply('confirm', 'bob')], NOW), 'confirmed');
});

test('an answer to a different proposal does not count', () => {
  assert.equal(m.appointmentStatus(proposal(), [proposal(), reply('confirm', 'bob', 'other')], NOW), 'proposed');
});

test('time passing: an unanswered proposal expires, a confirmed one becomes past', () => {
  const old = proposal({ appointment: { at: at(-2), place: 'Café' } });
  assert.equal(m.appointmentStatus(old, [old], NOW), 'expired');
  assert.equal(m.appointmentStatus(old, [old, reply('confirm', 'bob')], NOW), 'past');
  assert.equal(m.appointmentStatus(old, [old, reply('decline', 'bob')], NOW), 'declined');
});

test('what a viewer can do follows the state and their side', () => {
  assert.deepEqual(m.appointmentActions('proposed', { isProposer: false }), ['confirm', 'decline']);
  assert.deepEqual(m.appointmentActions('proposed', { isProposer: true }), ['cancel']);
  assert.deepEqual(m.appointmentActions('confirmed', { isProposer: true }), ['cancel']);
  assert.deepEqual(m.appointmentActions('confirmed', { isProposer: false }), ['decline']);
  for (const s of ['declined', 'cancelled', 'expired', 'past']) assert.deepEqual(m.appointmentActions(s, { isProposer: true }), [], s);
});

// ── showing it ──

test('the date is shown in Tunisian time, whatever the viewer\'s timezone', () => {
  // 2026-10-01 is a Thursday; 12:00 UTC is 13:00 in Tunis.
  assert.equal(m.formatAppointment(Date.parse('2026-10-01T12:00:00Z')), 'jeu. 1 oct. à 13:00');
  assert.equal(m.formatAppointment(Date.parse('2026-12-31T23:30:00Z')), 'ven. 1 janv. à 00:30', 'rolls over into the next day and year');
  assert.equal(m.formatAppointment('abc'), '');
  assert.equal(m.formatAppointment(Date.parse('2026-10-01T12:00:00Z'), 'ar'), 'الخميس 1 أكتوبر 13:00');
});

test('the form value round-trips through Tunisian time', () => {
  const ms = Date.parse('2026-10-01T12:00:00Z');
  assert.equal(m.toLocalInputValue(ms), '2026-10-01T13:00');
  assert.equal(m.fromLocalInputValue('2026-10-01T13:00'), ms);
  for (const bad of ['', null, undefined, '2026-10-01', 'demain']) assert.ok(Number.isNaN(m.fromLocalInputValue(bad)), String(bad));
});

test('the stored text reads sensibly in a push notification', () => {
  const appt = { at: Date.parse('2026-10-01T12:00:00Z'), place: 'Café Sidi Bou' };
  assert.equal(m.appointmentSummary(appt), '📅 Rendez-vous proposé : jeu. 1 oct. à 13:00 — Café Sidi Bou');
  assert.match(m.replySummary('confirm', appt), /confirmé/);
  assert.match(m.replySummary('decline', appt), /refusé/);
  assert.match(m.replySummary('cancel', appt), /annulé/);
});

test('the calendar file is valid and escapes what could break it', () => {
  const ics = m.buildIcs({ at: Date.parse('2026-10-01T12:00:00Z'), place: 'Café; Rue 1, Tunis\nEntrée' });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261001T120000Z/);
  assert.match(ics, /DTEND:20261001T130000Z/);
  assert.match(ics, /LOCATION:Café\\; Rue 1\\, Tunis\\nEntrée\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});
