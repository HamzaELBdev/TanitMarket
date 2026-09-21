const fs = require('fs');
const path = require('path');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const {
  newListingTemplate,
  newChatTemplate,
  negotiationOfferTemplate,
  listingApprovedTemplate,
  listingRejectedTemplate,
  priceDropTemplate,
  adminPendingListingTemplate
} = require('./templates');

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const FROM_EMAIL = 'TanitMarket <Notify@notify.tanitmarket.com>';
const FALLBACK_FROM_EMAIL = 'TanitMarket <onboarding@resend.dev>';

// Kept in sync with PRIMARY_ADMIN_EMAIL in lib/services/authService.js — used
// only if no Firestore user doc has isAdmin: true yet (e.g. brand new project).
const ADMIN_FALLBACK_EMAIL = 'hamza.elborjeni@gmail.com';

async function sendEmail({ apiKey, to, subject, html }) {
  if (!to || !apiKey) return;
  const payloadFor = (from) => ({ from, to: [to], subject, html });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFor(FROM_EMAIL))
    });
    if (res.ok) return;

    // Custom domain likely not verified in Resend yet — retry on the shared sandbox domain.
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFor(FALLBACK_FROM_EMAIL))
    });
  } catch (err) {
    logger.warn('Resend email send failed', err);
  }
}

async function sendPush({ tokens, title, body, link }) {
  if (!tokens || tokens.length === 0) return;
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { link: link || '/' },
      webpush: { fcmOptions: { link: link || '/' } }
    });

    const staleTokens = response.responses
      .map((r, i) => (!r.success && /registration-token-not-registered/.test(r.error?.code || '') ? tokens[i] : null))
      .filter(Boolean);
    if (staleTokens.length) {
      // Best-effort cleanup; do not fail the whole trigger on this.
      logger.info('Stale FCM tokens to prune', staleTokens);
    }
  } catch (err) {
    logger.warn('FCM push send failed', err);
  }
}

async function writeInAppNotification({ userId, title, body, link, type }) {
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await db.collection('notifications').doc(notifId).set({
      id: notifId,
      userId,
      title,
      body,
      link,
      type,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    logger.warn('Write in-app notification failed', err);
  }
}

/**
 * Look up everyone flagged as admin (isAdmin: true) to email/push them about
 * moderation-worthy events. Falls back to the hardcoded primary admin email
 * if no user doc has the flag yet, so the mailbox is never silently empty.
 */
async function getAdminRecipients() {
  try {
    const snap = await db.collection('users').where('isAdmin', '==', true).get();
    if (snap.empty) return { emails: [ADMIN_FALLBACK_EMAIL], tokens: [] };

    const emails = [];
    const tokens = [];
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data?.email) emails.push(data.email);
      if (Array.isArray(data?.fcmTokens)) tokens.push(...data.fcmTokens);
    });
    return { emails: emails.length ? emails : [ADMIN_FALLBACK_EMAIL], tokens };
  } catch (err) {
    logger.warn('Lookup admin recipients failed', err);
    return { emails: [ADMIN_FALLBACK_EMAIL], tokens: [] };
  }
}

/**
 * Find every user who favorited a given listing. Favorites are stored as a
 * denormalized array of product objects on the user doc (not a queryable
 * field), so this does a full collection scan filtered in memory — fine at
 * this app's scale, but worth moving to a dedicated `favorites` collection
 * (e.g. favorites/{userId}_{listingId}) if the user base grows significantly.
 */
async function getFavoritersOf(listingId, excludeUserId) {
  try {
    const snap = await db.collection('users').get();
    return snap.docs
      .filter((d) => d.id !== excludeUserId)
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => Array.isArray(u.favorites) && u.favorites.some((f) => String(f?.id) === String(listingId)));
  } catch (err) {
    logger.warn('Lookup favoriters failed', err);
    return [];
  }
}

/**
 * Fires when a new listing is published. Alerts every admin that a new
 * submission is waiting in the moderation queue. The seller is only told
 * their listing is "live" once it's actually approved — see onListingUpdated
 * below, which is the sole source of that notification. Confirming it here
 * too (unconditionally, at creation) was misleading: every listing starts
 * 'pending', so sellers were told "your listing is online" before any admin
 * had reviewed it.
 */
exports.onListingCreated = onDocumentCreated(
  { document: 'ads/{listingId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const listing = event.data?.data();
    if (!listing) return;

    const sellerId = listing.sellerId || listing.seller?.id;
    if (!sellerId) return;

    const listingId = event.params.listingId;
    const title = listing.title || 'Votre annonce';

    const sellerSnap = await db.collection('users').doc(sellerId).get();
    const seller = sellerSnap.exists ? sellerSnap.data() : null;
    const email = seller?.email || listing.seller?.email;
    const tokens = seller?.fcmTokens || [];
    const sellerName = seller?.name || listing.seller?.name || 'Un vendeur';

    // Only alert admins for real submissions awaiting moderation — not for
    // demo/seed listings or anything created already 'approved'.
    const needsModeration = listing.status === 'pending';
    const { emails: adminEmails, tokens: adminTokens } = needsModeration
      ? await getAdminRecipients()
      : { emails: [], tokens: [] };

    await Promise.all([
      // Seller: only confirmed as "live" immediately when created already
      // approved (e.g. an admin's own quick-post) — a normal 'pending'
      // submission stays silent here and is confirmed later by
      // onListingUpdated, once an admin actually approves it.
      ...(!needsModeration ? [
        writeInAppNotification({
          userId: sellerId,
          title: 'Annonce publiée ✅',
          body: `Votre annonce "${title}" est désormais en ligne.`,
          link: `/product/${listingId}`,
          type: 'new_listing'
        }),
        sendPush({
          tokens,
          title: 'TanitMarket 🇹🇳',
          body: `Votre annonce "${title}" est désormais en ligne.`,
          link: `/product/${listingId}`
        }),
        email
          ? sendEmail({
              apiKey: RESEND_API_KEY.value(),
              to: email,
              subject: `🇹🇳 Votre annonce "${title}" est en ligne sur TanitMarket !`,
              html: newListingTemplate({ title, price: listing.price, location: listing.location, listingId })
            })
          : Promise.resolve()
      ] : []),

      // Admin: single shared in-app notification (dash subscribes with userId 'admin'),
      // plus a push + email to every user actually flagged as admin.
      ...(needsModeration ? [
        writeInAppNotification({
          userId: 'admin',
          title: 'Nouvelle annonce à approuver 🔔',
          body: `"${title}" par ${sellerName} est en attente de validation.`,
          link: '/dash',
          type: 'ad_pending'
        }),
        sendPush({
          tokens: adminTokens,
          title: '🔔 Nouvelle annonce à modérer',
          body: `"${title}" par ${sellerName}`,
          link: '/dash'
        }),
        ...adminEmails.map((adminEmail) => sendEmail({
          apiKey: RESEND_API_KEY.value(),
          to: adminEmail,
          subject: `🔔 Nouvelle annonce en attente : "${title}"`,
          html: adminPendingListingTemplate({ title, sellerName, price: listing.price, location: listing.location, listingId })
        }))
      ] : [])
    ]);
  }
);

/**
 * Fires on every new chat message, including negotiation offers (isOffer flag).
 * Notifies whichever participant did NOT send the message.
 */
exports.onMessageCreated = onDocumentCreated(
  { document: 'conversations/{conversationId}/messages/{messageId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const conversationId = event.params.conversationId;
    const convSnap = await db.collection('conversations').doc(conversationId).get();
    if (!convSnap.exists) return;
    const conv = convSnap.data();

    const recipientId = (conv.participants || []).find((p) => p !== message.senderId);
    if (!recipientId) return;

    const recipientSnap = await db.collection('users').doc(recipientId).get();
    const recipient = recipientSnap.exists ? recipientSnap.data() : null;
    const email = recipient?.email;
    const tokens = recipient?.fcmTokens || [];

    const senderName = message.senderName || 'Un utilisateur';
    const productTitle = conv.productTitle || 'votre annonce';
    const chatLink = `/chat?productId=${conv.productId}`;

    if (message.isOffer) {
      await Promise.all([
        writeInAppNotification({
          userId: recipientId,
          title: 'Nouvelle offre reçue 🏷️',
          body: `${senderName} propose ${message.offerAmount} TND pour "${productTitle}".`,
          link: chatLink,
          type: 'negotiation_offer'
        }),
        sendPush({
          tokens,
          title: `🏷️ Offre : ${message.offerAmount} TND`,
          body: `${senderName} négocie sur "${productTitle}"`,
          link: chatLink
        }),
        email
          ? sendEmail({
              apiKey: RESEND_API_KEY.value(),
              to: email,
              subject: `🏷️ Offre de négociation : ${message.offerAmount} TND pour "${productTitle}"`,
              html: negotiationOfferTemplate({
                buyerName: senderName,
                productTitle,
                offeredPrice: message.offerAmount,
                originalPrice: conv.productPrice,
                productId: conv.productId
              })
            })
          : Promise.resolve()
      ]);
    } else {
      await Promise.all([
        writeInAppNotification({
          userId: recipientId,
          title: `Nouveau message de ${senderName}`,
          body: (message.text || '').slice(0, 120),
          link: chatLink,
          type: 'new_chat'
        }),
        sendPush({
          tokens,
          title: `💬 ${senderName}`,
          body: (message.text || '').slice(0, 120),
          link: chatLink
        }),
        email
          ? sendEmail({
              apiKey: RESEND_API_KEY.value(),
              to: email,
              subject: `💬 Nouveau message de ${senderName} pour "${productTitle}"`,
              html: newChatTemplate({
                senderName,
                productTitle,
                messagePreview: message.text,
                productId: conv.productId
              })
            })
          : Promise.resolve()
      ]);
    }
  }
);

/**
 * Fires on every update to a listing. Handles two distinct cases:
 *
 *  - A moderation decision (status -> approved/rejected): emails + pushes
 *    the seller. The in-app bell notification for this is already written
 *    client-side in app/dash/page.jsx (createModerationNotification) the
 *    moment the admin clicks Approve/Reject, so it is NOT duplicated here.
 *
 *  - A price drop, detected by comparing against `lastApprovedPrice` (a
 *    baseline this function maintains) rather than the raw before/after
 *    price. This matters because updateListingInDb() always resets a listing
 *    to 'pending' when its owner edits it (including the price) — so a real
 *    price cut is only visible again once an admin re-approves it, at which
 *    point before.status is 'pending', not 'approved'. Comparing against a
 *    persisted baseline survives that pending detour. Everyone who
 *    favorited the listing is notified (in-app + push + email).
 */
exports.onListingUpdated = onDocumentUpdated(
  { document: 'ads/{listingId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const listingId = event.params.listingId;
    const title = after.title || before.title || 'Votre annonce';
    const sellerId = after.sellerId || after.seller?.id;

    // Case 1: moderation decision.
    const statusChanged = before.status !== after.status;
    if (statusChanged && (after.status === 'approved' || after.status === 'rejected') && sellerId) {
      const sellerSnap = await db.collection('users').doc(sellerId).get();
      const seller = sellerSnap.exists ? sellerSnap.data() : null;
      const email = seller?.email || after.seller?.email;
      const tokens = seller?.fcmTokens || [];
      const isApproved = after.status === 'approved';

      await Promise.all([
        sendPush({
          tokens,
          title: isApproved ? '✅ Annonce approuvée' : '⚠️ Annonce refusée',
          body: isApproved
            ? `"${title}" est désormais en ligne sur TanitMarket.`
            : `"${title}" a été refusée${after.rejectionReason ? ` : ${after.rejectionReason}` : '.'}`,
          link: `/product/${listingId}`
        }),
        email
          ? sendEmail({
              apiKey: RESEND_API_KEY.value(),
              to: email,
              subject: isApproved
                ? `✅ Votre annonce "${title}" a été approuvée !`
                : `⚠️ Votre annonce "${title}" a été refusée`,
              html: isApproved
                ? listingApprovedTemplate({ title, listingId })
                : listingRejectedTemplate({ title, reason: after.rejectionReason })
            })
          : Promise.resolve()
      ]);
    }

    // Case 2: price-drop watch, only while the listing is actually live.
    if (after.status === 'approved') {
      const newPrice = Number(after.price);
      const lastApprovedPrice = Number(after.lastApprovedPrice);
      const hasBaseline = Number.isFinite(lastApprovedPrice);
      const isPriceDrop = hasBaseline && Number.isFinite(newPrice) && newPrice < lastApprovedPrice;

      if (isPriceDrop) {
        const favoriters = await getFavoritersOf(listingId, sellerId);
        await Promise.all(favoriters.flatMap((user) => [
          writeInAppNotification({
            userId: user.id,
            title: '💚 Baisse de prix sur un favori',
            body: `"${title}" est passé de ${lastApprovedPrice} TND à ${newPrice} TND.`,
            link: `/product/${listingId}`,
            type: 'price_drop'
          }),
          sendPush({
            tokens: user.fcmTokens || [],
            title: '💚 Baisse de prix sur un favori',
            body: `"${title}" : ${lastApprovedPrice} → ${newPrice} TND`,
            link: `/product/${listingId}`
          }),
          user.email
            ? sendEmail({
                apiKey: RESEND_API_KEY.value(),
                to: user.email,
                subject: `💚 Le prix de "${title}" a baissé !`,
                html: priceDropTemplate({ title, oldPrice: lastApprovedPrice, newPrice, listingId })
              })
            : Promise.resolve()
        ]));
      }

      // Refresh the baseline for next time. Writing only when it actually
      // changed keeps this from re-triggering itself indefinitely.
      if (Number.isFinite(newPrice) && lastApprovedPrice !== newPrice) {
        await db.collection('ads').doc(listingId).set({ lastApprovedPrice: newPrice }, { merge: true });
      }
    }
  }
);

const CRAWLER_UA_REGEX = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot|Pinterest|SkypeUriPreview|vkShare|W3C_Validator|Applebot/i;

// Bundled at build time by scripts/postbuild-shell.js (a snapshot of a real
// prebuilt product page) and read once per instance — not re-fetched over
// the network on every request, and never a same-origin self-fetch (that was
// found to hang indefinitely: Cloud Run egress looping back through Firebase
// Hosting's own edge).
let cachedShellHtml = null;
function getShellHtml() {
  if (cachedShellHtml === null) {
    try {
      cachedShellHtml = fs.readFileSync(path.join(__dirname, 'product-shell.html'), 'utf8');
    } catch (err) {
      logger.warn('Product shell file missing from deployment bundle', err);
      cachedShellHtml = '';
    }
  }
  return cachedShellHtml;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * Single entry point for every `/product/**` request (see the Firebase
 * Hosting rewrite in firebase.json). The static export only pre-builds a
 * product page for listings that existed in Firestore at the last deploy,
 * so any newer listing — i.e. virtually all real ones — has no matching
 * static file. Before this function existed, Hosting's catch-all rewrite
 * served a single hardcoded shell (`/product/prod-1.html`), so its baked-in
 * Open Graph tags (title/image/description) were shown for EVERY listing
 * shared on Facebook/WhatsApp/etc. regardless of which product the link was
 * actually for. Here, requests from social-media crawlers get real,
 * per-listing OG tags fetched live from Firestore; ordinary visitors get the
 * exact same SPA shell as before so the app's own client-side routing
 * (ProductDetailClient reading window.location) takes over normally.
 */
exports.productSocialPreview = onRequest(async (req, res) => {
  const userAgent = req.get('user-agent') || '';
  const isCrawler = CRAWLER_UA_REGEX.test(userAgent);
  const origin = `${req.protocol}://${req.get('host')}`;

  // This response differs by User-Agent (bots get OG-only HTML, everyone
  // else gets the SPA shell) on the *same* URL — without Vary, a CDN/edge
  // cache would serve one audience's response to the other.
  res.set('Vary', 'User-Agent');

  if (!isCrawler) {
    res.set('Cache-Control', 'no-store');
    res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(getShellHtml());
    return;
  }

  const pathParts = req.path.split('/').filter(Boolean); // ['product', ':id']
  const productId = decodeURIComponent(pathParts[1] || '');
  const pageUrl = `${origin}${req.originalUrl}`;

  let product = null;
  try {
    const snap = await db.collection('ads').doc(productId).get();
    if (snap.exists) product = snap.data();
  } catch (err) {
    logger.warn('OG product fetch failed', err);
  }

  if (!product) {
    res.status(404).set('Cache-Control', 'no-store').set('Content-Type', 'text/html; charset=utf-8').send(
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8" /><title>Annonce introuvable</title></head><body></body></html>'
    );
    return;
  }

  // Mirrors lib/priceInfo.js — the three seller price choices (négociable /
  // fixe / gratuit) can't be told apart from `price === 0` alone: a
  // negotiable listing with no amount set is also price 0, and showing
  // "Gratuit" or "0 TND" for it in a shared-link preview is wrong.
  const priceType = product.priceType || (product.isFree ? 'free' : product.negotiable ? 'negotiable' : 'fixed');
  const isFree = product.isFree === true || priceType === 'free';
  const rawPrice = parseFloat(product.price) || 0;
  const hasAmount = !isFree && rawPrice > 0;
  const priceLabel = isFree ? 'Gratuit' : (hasAmount ? `${rawPrice} TND` : 'Prix à négocier');
  const title = `${product.title || 'Annonce'} - ${priceLabel}`;
  const description = (
    product.description || `${product.title || 'Cette annonce'} à vendre sur TanitMarket. ${product.location || 'Tunisie'}.`
  ).slice(0, 160);
  const image = product.images?.[0] || product.image || '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:site_name" content="TanitMarket" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
</head>
<body>
<p>${escapeHtml(title)}</p>
</body>
</html>`;

  res.set('Cache-Control', 'no-store');
  res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
});
