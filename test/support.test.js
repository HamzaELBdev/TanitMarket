// Run with: npm test   (Node's built-in runner, no deps)
const test = require('node:test');
const assert = require('node:assert/strict');

let mod;
test.before(async () => { mod = await import('../lib/support.js'); });

const user = { uid: 'u1', name: 'Sami', email: 's@x.tn' };

test('a valid ticket carries the topic and channel', () => {
  const r = mod.buildTicket({ topic: 'sponsoring', channel: 'form', message: 'Je veux sponsoriser', user });
  assert.equal(r.ok, true);
  assert.equal(r.data.topic, 'sponsoring');
  assert.equal(r.data.channel, 'form');
  assert.equal(r.data.status, 'open');
  assert.equal(r.message, 'Je veux sponsoriser');
});

test('a topic is mandatory and must be known', () => {
  assert.equal(mod.buildTicket({ topic: '', channel: 'chat', message: 'bonjour', user }).error, 'bad-topic');
  assert.equal(mod.buildTicket({ topic: 'nope', channel: 'chat', message: 'bonjour', user }).error, 'bad-topic');
});

test('needs a signed-in member, a real message and a known channel', () => {
  assert.equal(mod.buildTicket({ topic: 'help', channel: 'chat', message: 'bonjour', user: null }).error, 'not-signed-in');
  assert.equal(mod.buildTicket({ topic: 'help', channel: 'sms', message: 'bonjour', user }).error, 'bad-channel');
  assert.equal(mod.buildTicket({ topic: 'help', channel: 'chat', message: '  hi ', user }).error, 'message-short');
  assert.equal(mod.buildTicket({ topic: 'help', channel: 'chat', message: 'x'.repeat(2001), user }).error, 'message-long');
});

test('replies are trimmed and bounded', () => {
  assert.equal(mod.buildReply('  ok  ').text, 'ok');
  assert.equal(mod.buildReply('   ').ok, false);
  assert.equal(mod.buildReply('x'.repeat(2001)).error, 'message-long');
});
