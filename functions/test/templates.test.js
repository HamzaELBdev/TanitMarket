// Run with: npm test --prefix functions   (Node's built-in runner, no deps)
//
// These templates build e-mail HTML out of values the app does not control:
// titles and locations typed by a seller, display names, chat messages, prices
// read back from Firestore, rejection reasons written by the AI moderation.
// The point of these tests is that none of it can escape the markup the
// templates themselves emit — and that escaping it did not mangle ordinary
// French text along the way.

const test = require('node:test');
const assert = require('node:assert/strict');
const templates = require('../templates');

// Tries to break out of an element AND out of an attribute value at once.
const BREAKOUT = '<img src=x onerror=alert(1)>" onmouseover="evil()';
// An id that would terminate the href attribute if it were inlined raw.
const BREAKOUT_ID = 'abc" onclick="evil()';

// Tags and attributes the templates legitimately emit. Anything else in the
// output came from the injected payload.
const ALLOWED_TAGS = new Set(['div', 'h2', 'h3', 'p', 'a', 'span', 'strong']);
const ALLOWED_ATTRS = new Set(['style', 'href']);

// Every template, with the payload in every field that reaches the HTML.
const POISONED = {
  newListingTemplate: { title: BREAKOUT, price: BREAKOUT, location: BREAKOUT, listingId: BREAKOUT_ID },
  newChatTemplate: { senderName: BREAKOUT, productTitle: BREAKOUT, messagePreview: BREAKOUT, productId: BREAKOUT_ID },
  negotiationOfferTemplate: { buyerName: BREAKOUT, productTitle: BREAKOUT, offeredPrice: BREAKOUT, originalPrice: BREAKOUT, productId: BREAKOUT_ID },
  listingApprovedTemplate: { title: BREAKOUT, listingId: BREAKOUT_ID },
  listingRejectedTemplate: { title: BREAKOUT, reason: BREAKOUT },
  priceDropTemplate: { title: BREAKOUT, oldPrice: BREAKOUT, newPrice: BREAKOUT, listingId: BREAKOUT_ID },
  adminPendingListingTemplate: { title: BREAKOUT, sellerName: BREAKOUT, price: BREAKOUT, location: BREAKOUT, listingId: BREAKOUT_ID },
  emailVerificationCodeTemplate: { code: BREAKOUT },
  adminAiDecisionTemplate: { approved: false, title: BREAKOUT, sellerName: BREAKOUT, price: BREAKOUT, location: BREAKOUT, listingId: BREAKOUT_ID, reason: BREAKOUT, model: BREAKOUT }
};

/**
 * Collect every tag and attribute name in the output. Attribute VALUES are
 * blanked out first: an escaped payload sitting inside a value is inert text,
 * and reading names out of it would flag safe output (a percent-encoded
 * `?productId=` in an href is not an attribute).
 */
function markupOf(html) {
  const tags = [];
  const attrs = [];
  for (const tag of html.matchAll(/<\s*\/?\s*([a-zA-Z0-9]+)((?:[^>"]|"[^"]*")*)>/g)) {
    tags.push(tag[1].toLowerCase());
    for (const attr of tag[2].replace(/"[^"]*"/g, '""').matchAll(/([a-zA-Z-]+)\s*=/g)) {
      attrs.push(attr[1].toLowerCase());
    }
  }
  return { tags, attrs };
}

test('every template is covered by these tests', () => {
  const exported = Object.keys(templates).sort();
  assert.deepEqual(Object.keys(POISONED).sort(), exported,
    'a template was added or removed — add it to POISONED so it gets tested too');
});

test('no template lets a payload inject markup', async (t) => {
  for (const [name, args] of Object.entries(POISONED)) {
    await t.test(name, () => {
      const html = templates[name](args);
      const { tags, attrs } = markupOf(html);

      for (const tag of tags) {
        assert.ok(ALLOWED_TAGS.has(tag), `injected tag <${tag}> in ${name}`);
      }
      for (const attr of attrs) {
        assert.ok(ALLOWED_ATTRS.has(attr), `injected attribute ${attr} in ${name}`);
      }
      // The payload's own tag must survive only as escaped text.
      assert.ok(!html.includes('<img'), `unescaped <img> in ${name}`);
      assert.ok(html.includes('&lt;img'), `payload not escaped at all in ${name}`);
      // An event handler with a live quote means the value broke out.
      assert.doesNotMatch(html, /on[a-z]+="/, `live event handler in ${name}`);
      // Every link stays on the real site, with nothing appended to the host.
      for (const link of html.matchAll(/href="([^"]*)"/g)) {
        assert.match(link[1], /^https:\/\/tanitmarket\.com(\/|$)/, `off-site href in ${name}`);
      }
    });
  }
});

test('an id cannot escape the href attribute', () => {
  const html = templates.newListingTemplate({ title: 'X', listingId: BREAKOUT_ID });
  // Match the whole anchor tag, not just the href value: reading the value
  // with /href="([^"]*)"/ stops at the payload's own quote, which hides the
  // very breakout this test is here to catch.
  const anchor = html.match(/<a\s[^>]*>/)[0];
  // The anchor must carry exactly href + style and nothing else. The href's
  // own characters are left loose on purpose (percent-encoding keeps `(`, `)`
  // and `!` as-is, and those are harmless); what matters is that no quote or
  // whitespace survives inside it to start a third attribute.
  assert.match(
    anchor,
    /^<a href="https:\/\/tanitmarket\.com\/product\/[^"\s<>]*" style="[^"]*">$/,
    `id escaped its attribute: ${anchor}`
  );
});

test('ordinary French text renders intact and is escaped exactly once', () => {
  const html = templates.newListingTemplate({
    title: 'Vélo & Trottinette "neuf"',
    price: 250,
    location: 'Béja',
    listingId: 'a1'
  });
  assert.match(html, /Vélo &amp; Trottinette &quot;neuf&quot;/, 'accents or escaping are wrong');
  assert.ok(!html.includes('&amp;amp;'), 'value was escaped twice');
  assert.match(html, /Prix : 250 TND/);
  assert.match(html, /📍 Localisation : Béja/);
  assert.match(html, /href="https:\/\/tanitmarket\.com\/product\/a1"/);
});

test('missing values fall back instead of printing undefined', () => {
  const listing = templates.newListingTemplate({ title: 'Don' });
  assert.match(listing, /Prix : Sur demande/);
  assert.match(listing, /📍 Localisation : Tunisie/);

  const chat = templates.newChatTemplate({});
  assert.match(chat, /Annonce : Article/);
  assert.match(chat, /<strong>Utilisateur<\/strong>/);

  const offer = templates.negotiationOfferTemplate({ productTitle: 'X', offeredPrice: 10 });
  assert.match(offer, /<strong>un utilisateur<\/strong>/);
  assert.ok(!offer.includes('Prix original'), 'the original-price block should be omitted when absent');

  for (const html of [listing, chat, offer]) {
    assert.ok(!html.includes('undefined'), 'a missing value leaked as "undefined"');
    assert.ok(!html.includes('null'), 'a missing value leaked as "null"');
  }
});

test('the AI decision e-mail differs by outcome', () => {
  const approved = templates.adminAiDecisionTemplate({
    approved: true, title: 'Vélo', sellerName: 'Ali', price: 250,
    location: 'Tunis', listingId: 'a6', reason: '', model: 'deepseek-chat'
  });
  assert.match(approved, /approuvée automatiquement/);
  assert.match(approved, /par deepseek-chat/);
  assert.ok(!approved.includes('Motif retenu'), 'no reason block without a reason');

  const rejected = templates.adminAiDecisionTemplate({
    approved: false, title: 'Vélo', listingId: 'a7', reason: 'Contenu adulte détecté'
  });
  assert.match(rejected, /rejetée automatiquement/);
  assert.match(rejected, /Motif retenu par l'IA/); // a template label, not an escaped value
  assert.match(rejected, /Contenu adulte détecté/);
});

test('the verification code is the only thing in its own e-mail', () => {
  const html = templates.emailVerificationCodeTemplate({ code: '123456' });
  assert.match(html, /123456/);
  assert.match(html, /expire dans 15 minutes/);
});
