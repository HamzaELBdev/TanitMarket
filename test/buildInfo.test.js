// Run with: npm test   (Node's built-in runner, no deps)
//
// The build stamp is shown to an admin to answer "is what I am looking at the
// version I just shipped?". A wrong or nonsensical answer is worse than none,
// so the two things that can go wrong are pinned here: an absent or malformed
// stamp, and a stamp that is ahead of the viewer's clock.

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBuildTime, formatBuildDate, formatBuildAge } = require('../lib/buildInfo.js');

test('a missing or malformed stamp yields null, never "Invalid Date"', () => {
  for (const value of [undefined, null, '', '   ', 'pas-une-date', 'NaN', {}, []]) {
    assert.equal(parseBuildTime(value), null, `parse accepted ${JSON.stringify(value)}`);
    assert.equal(formatBuildDate(value), null, `format accepted ${JSON.stringify(value)}`);
    assert.equal(formatBuildAge(value), null, `age accepted ${JSON.stringify(value)}`);
  }
});

test('a valid stamp formats with a French month and a padded time', () => {
  // Built in the local timezone on purpose, so the assertion holds wherever
  // the test runs instead of only on a UTC machine.
  const d = new Date(2026, 9, 1, 9, 5); // 1 octobre 2026, 09:05 local
  assert.equal(formatBuildDate(d.toISOString()), '1 oct. 2026 à 09:05');
});

test('every month has a label — none render as undefined', () => {
  for (let month = 0; month < 12; month += 1) {
    const out = formatBuildDate(new Date(2026, month, 15, 12, 0).toISOString());
    assert.ok(out && !out.includes('undefined'), `month ${month} -> ${out}`);
  }
});

test('the age reads in the units a human would use', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  const ago = (ms) => formatBuildAge(new Date(now - ms).toISOString(), now);
  assert.equal(ago(5 * 1000), "à l'instant");
  assert.equal(ago(59 * 1000), "à l'instant");
  assert.equal(ago(3 * 60 * 1000), 'il y a 3 min');
  assert.equal(ago(90 * 60 * 1000), 'il y a 2 h');
  assert.equal(ago(5 * 3600 * 1000), 'il y a 5 h');
  assert.equal(ago(3 * 86400 * 1000), 'il y a 3 j');
  assert.equal(ago(70 * 86400 * 1000), 'il y a 2 mois');
});

test('a stamp ahead of the clock is hidden rather than shown as negative', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  // Reachable without anything being broken: the build host's clock can be
  // minutes ahead of the admin's phone.
  assert.equal(formatBuildAge('2026-10-01T12:05:00Z', now), null);
  // The absolute date is still worth showing in that case.
  assert.ok(formatBuildDate('2026-10-01T12:05:00Z'));
});

test('the age never contains a negative number or NaN', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  for (const offset of [-3600e3, -1, 0, 1, 1e3, 86400e3, 1e10]) {
    const out = formatBuildAge(new Date(now - offset).toISOString(), now);
    if (out === null) continue;
    assert.doesNotMatch(out, /-\d|NaN/, `bad age for offset ${offset}: ${out}`);
  }
});
