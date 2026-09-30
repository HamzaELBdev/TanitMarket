const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
// Modular import: the namespaced admin.firestore.FieldValue is undefined in
// the Functions emulator (and is the legacy form), this works everywhere.
const { FieldValue } = require('firebase-admin/firestore');
const vision = require('@google-cloud/vision');
const {
  newListingTemplate,
  newChatTemplate,
  negotiationOfferTemplate,
  listingApprovedTemplate,
  listingRejectedTemplate,
  priceDropTemplate,
  adminPendingListingTemplate,
  emailVerificationCodeTemplate
} = require('./templates');

admin.initializeApp();
const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
// Meta (Facebook Page + linked Instagram Business account) — see
// shareListingToSocialMedia() below. META_IG_USER_ID is optional: leave it
// unset to only post to Facebook.
const META_PAGE_ACCESS_TOKEN = defineSecret('META_PAGE_ACCESS_TOKEN');
const META_PAGE_ID = defineSecret('META_PAGE_ID');
const META_IG_USER_ID = defineSecret('META_IG_USER_ID');
const FROM_EMAIL = 'TanitMarket <Notify@notify.tanitmarket.com>';
const FALLBACK_FROM_EMAIL = 'TanitMarket <onboarding@resend.dev>';

// Kept in sync with PRIMARY_ADMIN_EMAIL in lib/services/authService.js — used
// only if no Firestore user doc has isAdmin: true yet (e.g. brand new project).
const ADMIN_FALLBACK_EMAIL = 'hamza.elborjeni@gmail.com';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Resend's default rate limit is 2 requests/second. A single trigger can fan
// out to many recipients at once (every admin, every user who favorited a
// listing), so all sends go through one serialized queue with a small gap
// between them — firing them in parallel got most of them 429'd and, because
// failures used to be silent, silently dropped.
const EMAIL_MIN_GAP_MS = 600;
const EMAIL_MAX_ATTEMPTS_PER_SENDER = 3;
let emailQueue = Promise.resolve();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postToResend({ apiKey, from, to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  const body = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body: body.slice(0, 500) };
}

/**
 * Actually deliver one e-mail. Tries the verified custom domain first and only
 * falls back to Resend's shared sandbox sender when the failure looks like a
 * sender/domain problem (401/403/404/422) — a 429 or a 5xx is retried on the
 * same sender with backoff instead, since switching domains does not help
 * there. Every outcome is logged: a send that fails must leave a trace.
 */
async function deliverEmail({ apiKey, to, subject, html }) {
  if (!apiKey) {
    logger.error('Resend: RESEND_API_KEY missing, e-mail not sent', { to, subject });
    return false;
  }
  if (!to || !EMAIL_RE.test(String(to).trim())) {
    logger.warn('Resend: invalid recipient, e-mail not sent', { to, subject });
    return false;
  }

  const recipient = String(to).trim();
  for (const from of [FROM_EMAIL, FALLBACK_FROM_EMAIL]) {
    for (let attempt = 1; attempt <= EMAIL_MAX_ATTEMPTS_PER_SENDER; attempt += 1) {
      let result;
      try {
        result = await postToResend({ apiKey, from, to: recipient, subject, html });
      } catch (err) {
        logger.warn('Resend: request failed', { from, to: recipient, attempt, error: String(err) });
        if (attempt < EMAIL_MAX_ATTEMPTS_PER_SENDER) {
          await sleep(500 * 2 ** (attempt - 1));
          continue;
        }
        break;
      }

      if (result.ok) {
        logger.info('Resend: e-mail sent', { from, to: recipient, subject });
        return true;
      }

      const retryableOnSameSender = result.status === 429 || result.status >= 500;
      logger.warn('Resend: e-mail refused', {
        from,
        to: recipient,
        subject,
        status: result.status,
        body: result.body,
        attempt
      });
      if (retryableOnSameSender && attempt < EMAIL_MAX_ATTEMPTS_PER_SENDER) {
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      // Not retryable on this sender — fall through to the fallback sender.
      break;
    }
  }

  logger.error('Resend: e-mail could not be delivered', { to: recipient, subject });
  return false;
}

/**
 * Queue an e-mail. Resolves to true only when Resend accepted it, so callers
 * that need to know (e.g. the verification code) can react.
 */
function sendEmail({ apiKey, to, subject, html }) {
  const queued = emailQueue.then(async () => {
    const sent = await deliverEmail({ apiKey, to, subject, html });
    await sleep(EMAIL_MIN_GAP_MS);
    return sent;
  });
  // Keep the chain alive even if a link rejects unexpectedly.
  emailQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

/**
 * Remove a registration token FCM has told us is dead from whichever user
 * doc(s) hold it. Without this a stale token lingers forever, and once every
 * token on a doc is stale that user silently stops getting push entirely —
 * with nothing in the logs to say why.
 */
async function pruneStaleTokens(staleTokens) {
  await Promise.all(staleTokens.map(async (token) => {
    try {
      const snap = await db.collection('users').where('fcmTokens', 'array-contains', token).get();
      await Promise.all(snap.docs.map((d) =>
        d.ref.update({ fcmTokens: FieldValue.arrayRemove(token) })
      ));
      logger.info('FCM: pruned stale token', { users: snap.size });
    } catch (err) {
      logger.warn('FCM: pruning stale token failed', { error: String(err) });
    }
  }));
}

/**
 * Deliver a push to every registration token given. `context` is only used
 * for logging — a push that reaches nobody must say so, including the case
 * where the recipient simply has no token registered (permission never
 * granted, or granted on a device whose token has since been pruned).
 */
async function sendPush({ tokens, title, body, link, context = 'push' }) {
  const unique = [...new Set((tokens || []).filter(Boolean))];
  if (unique.length === 0) {
    logger.warn('FCM: no registration token for this recipient, push not sent', { context, title });
    return;
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: unique,
      notification: { title, body },
      data: { link: link || '/' },
      webpush: { fcmOptions: { link: link || '/' } }
    });

    logger.info('FCM: push sent', {
      context,
      title,
      tokens: unique.length,
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    const staleTokens = [];
    response.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code || '';
      logger.warn('FCM: push refused for one token', { context, code, message: r.error?.message });
      if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) {
        staleTokens.push(unique[i]);
      }
    });
    // Best-effort cleanup; never fail the whole trigger on this.
    if (staleTokens.length) await pruneStaleTokens(staleTokens);
  } catch (err) {
    logger.error('FCM: push send failed', { context, title, error: String(err) });
  }
}

const UNSAFE_LIKELIHOOD = new Set(['LIKELY', 'VERY_LIKELY']);

/**
 * Scans a listing's photos with Cloud Vision SafeSearch (adult/violence/
 * racy detection) — purpose-built for exactly this, and already available
 * on this GCP project via the function's own service account, no separate
 * API key needed. Capped to the first 5 images to bound latency/cost.
 * Returns { ok: true, flagged, reason? } once every reachable image has
 * been checked, or { ok: false } if the check itself couldn't run (so the
 * caller treats that as "unresolved", never as "clean").
 */
async function checkImagesSafeSearch(imageUrls) {
  const urls = (imageUrls || []).filter(Boolean).slice(0, 5);
  if (!urls.length) return { ok: true, flagged: false };

  try {
    const results = await Promise.all(urls.map((url) => visionClient.safeSearchDetection(url)));
    for (const [result] of results) {
      const safe = result?.safeSearchAnnotation;
      if (!safe) continue;
      if (UNSAFE_LIKELIHOOD.has(safe.adult)) {
        return { ok: true, flagged: true, reason: 'Photo à caractère pornographique/adulte détectée.' };
      }
      if (UNSAFE_LIKELIHOOD.has(safe.violence)) {
        return { ok: true, flagged: true, reason: 'Photo à caractère violent détectée.' };
      }
      if (safe.racy === 'VERY_LIKELY') {
        return { ok: true, flagged: true, reason: 'Photo à caractère suggestif détectée.' };
      }
    }
    return { ok: true, flagged: false };
  } catch (err) {
    logger.warn('Cloud Vision SafeSearch failed', err);
    return { ok: false };
  }
}

/**
 * Full-auto AI moderation via DeepSeek (text-only — their hosted API has no
 * vision endpoint, so only title/description/price/category are checked;
 * photos are covered separately by checkImagesSafeSearch above).
 * Returns null (never throws) on any failure — missing/invalid key, network
 * error, malformed model output — so the caller can fall back to the normal
 * "notify admin, await manual review" path instead of losing the listing in
 * limbo.
 */
async function moderateListingWithDeepSeek(listing) {
  const apiKey = DEEPSEEK_API_KEY.value();
  if (!apiKey) return null;

  const systemPrompt = `Tu es le modérateur automatique de TanitMarket, une marketplace P2P tunisienne (petites annonces entre particuliers). Le titre et la description peuvent être écrits en français, en arabe standard, en dialecte tunisien (arabe tunisien / Tounsi), ou en "Arabizi" (arabe tunisien transcrit en alphabet latin, avec des chiffres remplaçant certaines lettres, ex: 5=خ, 3=ع, 7=ح, 9=ق) — analyse le texte dans TOUTES ces formes, pas seulement le français standard.
Analyse l'annonce fournie et décide si elle doit être APPROUVÉE ou REJETÉE.
Rejette si le titre ou la description contient clairement, dans n'importe laquelle des langues/graphies ci-dessus :
- des insultes, grossièretés, injures ou langage obscène/vulgaire (y compris les insultes tunisiennes courantes, qu'elles soient en arabe, en Arabizi ou en français) ;
- des armes/munitions, drogues ou substances illégales ;
- des contrefaçons explicites ;
- du contenu à caractère sexuel/pornographique ;
- des services illégaux ;
- une arnaque manifeste (ex : demande de paiement anticipé hors plateforme sans objet réel) ;
- du discours haineux ;
- du spam ou un texte vide/sans rapport avec une vraie annonce.
Dans le doute sur une annonce par ailleurs légitime et au langage correct, APPROUVE — ce n'est pas à toi de juger la qualité de rédaction ou un prix simplement bas.
Réponds UNIQUEMENT en JSON strict, sans texte autour : {"decision": "approve" | "reject", "reason": "courte explication en français, 1 phrase"}`;

  const userPrompt = `Titre: ${listing.title || '(vide)'}
Description: ${listing.description || '(vide)'}
Prix: ${listing.price ?? 'non spécifié'} TND${listing.isFree ? ' (annonce marquée comme gratuite)' : ''}
Catégorie: ${listing.category || 'non spécifiée'}
Localisation: ${listing.location || 'non spécifiée'}`;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!res.ok) {
      logger.warn('DeepSeek moderation HTTP error', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const decision = parsed?.decision === 'reject' ? 'reject' : (parsed?.decision === 'approve' ? 'approve' : null);
    if (!decision) return null;

    const reason = typeof parsed.reason === 'string' && parsed.reason.trim()
      ? parsed.reason.trim().slice(0, 300)
      : (decision === 'reject' ? 'Contenu jugé non conforme par la modération automatique.' : '');

    return { decision, reason };
  } catch (err) {
    logger.warn('DeepSeek moderation failed', err);
    return null;
  }
}

const META_GRAPH_VERSION = 'v21.0';

function buildSocialCaption(listing, listingId) {
  // Mirrors lib/priceInfo.js's classification (négociable / fixe / gratuit
  // can't be told apart from price === 0 alone) — duplicated here since
  // Cloud Functions can't import from lib/.
  const priceType = listing.priceType || (listing.isFree ? 'free' : listing.negotiable ? 'negotiable' : 'fixed');
  const isFree = listing.isFree === true || priceType === 'free';
  const rawPrice = parseFloat(listing.price) || 0;
  const hasAmount = !isFree && rawPrice > 0;
  const priceLabel = isFree ? 'Gratuit 🎁' : (hasAmount ? `${rawPrice} TND` : 'Prix à négocier');
  const location = listing.location || 'Tunisie';
  const url = `https://tanitmarket.com/product/${listingId}`;
  const description = (listing.description || '').trim().slice(0, 200);

  return `🆕 ${listing.title || 'Nouvelle annonce'}\n💰 ${priceLabel}\n📍 ${location}\n\n${description}\n\n👉 ${url}\n\n#TanitMarket #Tunisie #PetitesAnnonces`;
}

/**
 * Auto-shares a newly-approved listing to the TanitMarket Facebook Page
 * (photo post) and, if configured, the linked Instagram Business account
 * (2-step content publishing API — both use the same Page access token,
 * Meta manages IG posting through the linked Page). No-ops quietly if the
 * secrets aren't set yet, or if the listing has no photo (both platforms
 * require an image URL). Never throws — a social-posting failure must never
 * break the approval flow itself.
 */
async function shareListingToSocialMedia(listing, listingId) {
  const pageToken = META_PAGE_ACCESS_TOKEN.value();
  const pageId = META_PAGE_ID.value();
  const igUserId = META_IG_USER_ID.value();
  if (!pageToken || !pageId) return;

  const imageUrl = listing.images?.[0] || listing.image;
  if (!imageUrl) {
    logger.warn('Skipping social share (no photo)', listingId);
    return;
  }

  const caption = buildSocialCaption(listing, listingId);

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, caption, access_token: pageToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      logger.warn('Facebook share failed', res.status, data);
    } else {
      logger.info('Facebook share succeeded', { listingId, postId: data.post_id || data.id });
    }
  } catch (err) {
    logger.warn('Facebook share error', err);
  }

  if (!igUserId) return;

  try {
    const createRes = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken })
    });
    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok || !createData.id) {
      logger.warn('Instagram media creation failed', createRes.status, createData);
      return;
    }

    // Instagram fetches/processes the image asynchronously — publishing
    // right away often fails with "Media ID is not available" (error_subcode
    // 2207027) because the container isn't ready yet. Poll its status_code
    // until it's FINISHED (or ERROR / a ~20s budget runs out) before publishing.
    const containerId = createData.id;
    let ready = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusRes = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${containerId}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`
      );
      const statusData = await statusRes.json().catch(() => ({}));
      if (statusData.status_code === 'FINISHED') {
        ready = true;
        break;
      }
      if (statusData.status_code === 'ERROR') {
        logger.warn('Instagram container processing failed', { listingId, statusData });
        return;
      }
    }
    if (!ready) {
      logger.warn('Instagram container not ready after polling — skipping publish', { listingId, containerId });
      return;
    }

    const publishRes = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: pageToken })
    });
    const publishData = await publishRes.json().catch(() => ({}));
    if (!publishRes.ok) {
      logger.warn('Instagram publish failed', publishRes.status, publishData);
    } else {
      logger.info('Instagram share succeeded', { listingId, postId: publishData.id });
    }
  } catch (err) {
    logger.warn('Instagram share error', err);
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
 * Look up every admin, to e-mail and push them about moderation-worthy
 * events. "Admin" has to be recognized exactly as the client recognizes it
 * (checkIfUserIsAdminInDb in lib/services/authService.js): isAdmin === true,
 * role 'Admin', or the primary admin address. Only checking isAdmin === true
 * meant the primary admin — whose doc saveUserProfileToDb() creates with
 * isAdmin: false — was never matched, so the e-mail still went out via the
 * hardcoded fallback address but `tokens` came back empty and the push was
 * silently dropped.
 */
async function getAdminRecipients() {
  const emails = new Set();
  const tokens = new Set();

  const collect = (data) => {
    if (data?.email) emails.add(String(data.email).trim().toLowerCase());
    if (Array.isArray(data?.fcmTokens)) data.fcmTokens.filter(Boolean).forEach((t) => tokens.add(t));
  };

  const isAdminDoc = (data) => data?.isAdmin === true
    || String(data?.role || '').toLowerCase() === 'admin'
    || String(data?.email || '').trim().toLowerCase() === ADMIN_FALLBACK_EMAIL;

  try {
    // One scan rather than three indexed queries: this collection is small at
    // this app's scale, and it matches all three admin shapes at once.
    const snap = await db.collection('users').get();
    snap.docs.forEach((d) => {
      const data = d.data();
      if (isAdminDoc(data)) collect(data);
    });
  } catch (err) {
    logger.warn('Lookup admin recipients failed', { error: String(err) });
  }

  // Never leave the admin mailbox silently empty.
  if (emails.size === 0) emails.add(ADMIN_FALLBACK_EMAIL);

  const recipients = { emails: [...emails], tokens: [...tokens] };
  logger.info('Admin recipients resolved', {
    emailCount: recipients.emails.length,
    tokenCount: recipients.tokens.length
  });
  return recipients;
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
  { document: 'ads/{listingId}', secrets: [RESEND_API_KEY, DEEPSEEK_API_KEY] },
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

    // A real submission awaiting moderation first goes through the AI —
    // full-auto approve/reject, combining a text check (DeepSeek: title/
    // description/price) and a photo check (Cloud Vision SafeSearch: adult/
    // violent/racy content — DeepSeek's API has no vision endpoint). Either
    // check flagging the listing is enough to reject it; approving requires
    // BOTH to come back clean. If either check fails technically (no key,
    // network/parsing error), that's treated as "unresolved", not "clean" —
    // falls back to the original "notify admin, await manual review" path,
    // so a listing never gets silently stuck OR silently waved through
    // because of an AI/Vision outage.
    const isPending = listing.status === 'pending';
    const [textResult, imageCheck] = isPending
      ? await Promise.all([
          moderateListingWithDeepSeek(listing),
          checkImagesSafeSearch(listing.images?.length ? listing.images : [listing.image])
        ])
      : [null, null];

    let aiResult = null;
    if (isPending) {
      if (imageCheck?.ok && imageCheck.flagged) {
        aiResult = { decision: 'reject', reason: imageCheck.reason, source: 'vision' };
      } else if (textResult?.decision === 'reject') {
        aiResult = { decision: 'reject', reason: textResult.reason, source: 'deepseek' };
      } else if (textResult?.decision === 'approve' && imageCheck?.ok && !imageCheck.flagged) {
        aiResult = { decision: 'approve', reason: '', source: 'deepseek+vision' };
      }
    }

    if (isPending && aiResult) {
      const newStatus = aiResult.decision === 'approve' ? 'approved' : 'rejected';
      await db.collection('ads').doc(listingId).update({
        status: newStatus,
        ...(newStatus === 'rejected' ? { rejectionReason: aiResult.reason } : {}),
        aiModeration: {
          decision: aiResult.decision,
          reason: aiResult.reason,
          model: aiResult.source === 'vision' ? 'cloud-vision-safesearch' : 'deepseek-chat + cloud-vision-safesearch',
          checkedAt: FieldValue.serverTimestamp()
        }
      });

      const isAutoApproved = newStatus === 'approved';
      // The admin is alerted for BOTH auto-decisions, not just rejections:
      // an auto-approval is still a new listing going live without anyone
      // having looked at it, which is exactly what the admin wants to know
      // about. In-app + push; the e-mail is deliberately left out here to
      // keep the mailbox usable at one auto-decision per listing.
      const { tokens: adminTokens } = await getAdminRecipients();

      await Promise.all([
        // Seller: in-app notification (mirrors the client's
        // createModerationNotification for a manual admin decision) — push
        // and email for this same transition are sent separately by
        // onListingUpdated, triggered by the status write above.
        writeInAppNotification({
          userId: sellerId,
          title: isAutoApproved ? 'Annonce approuvée ✅' : 'Annonce refusée ⚠️',
          body: isAutoApproved
            ? `Votre annonce "${title}" a été approuvée et est désormais visible sur TanitMarket.`
            : `Votre annonce "${title}" a été refusée${aiResult.reason ? ` : ${aiResult.reason}` : '.'}`,
          link: `/product/${listingId}`,
          type: isAutoApproved ? 'ad_approved' : 'ad_rejected'
        }),
        writeInAppNotification({
          userId: 'admin',
          title: isAutoApproved ? '🤖 Annonce approuvée automatiquement' : '🤖 Annonce rejetée automatiquement',
          body: isAutoApproved
            ? `"${title}" par ${sellerName} a été approuvée par l'IA et est en ligne.`
            : `"${title}" par ${sellerName} a été refusée par l'IA : ${aiResult.reason}`,
          link: `/product/${listingId}`,
          type: isAutoApproved ? 'ai_approved' : 'ai_rejected'
        }),
        sendPush({
          tokens: adminTokens,
          title: isAutoApproved ? '🤖 Nouvelle annonce en ligne' : '🤖 Annonce rejetée par l\'IA',
          body: isAutoApproved
            ? `"${title}" par ${sellerName} — approuvée automatiquement`
            : `"${title}" par ${sellerName} — ${aiResult.reason}`,
          context: isAutoApproved ? 'admin-ai-approved' : 'admin-ai-rejected',
          link: `/product/${listingId}`
        })
      ]);
      return;
    }

    // Only alert admins for real submissions awaiting moderation — not for
    // demo/seed listings, anything created already 'approved', or a listing
    // the AI step above already resolved.
    const needsModeration = isPending;
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
          context: 'seller-listing-live',
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
          context: 'admin-new-pending-listing',
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
          context: 'chat-offer',
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
          context: 'chat-message',
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
 * Fires on every update to a listing. Handles three distinct cases:
 *
 *  - A moderation decision (status -> approved/rejected): emails + pushes
 *    the seller. The in-app bell notification for this is already written
 *    client-side in app/dash/page.jsx (createModerationNotification) the
 *    moment the admin clicks Approve/Reject, so it is NOT duplicated here.
 *
 *  - A fresh approval also triggers shareListingToSocialMedia() (Facebook
 *    Page + linked Instagram), covering both a manual admin approval and an
 *    AI auto-approval, since both go through this same status write.
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
  { document: 'ads/{listingId}', secrets: [RESEND_API_KEY, META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID] },
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
          context: 'seller-moderation-decision',
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

    // Case 2: auto-share to Facebook/Instagram on every fresh approval
    // (manual or AI-decided — both go through this same status write).
    if (statusChanged && after.status === 'approved') {
      await shareListingToSocialMedia(after, listingId);
    }

    // Case 3: price-drop watch, only while the listing is actually live.
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
            context: 'favorite-price-drop',
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
  // A listing with no photo still needs a preview thumbnail — fall back to
  // the branded storefront-sign photo instead of omitting og:image, which
  // some clients (esp. WhatsApp/Messenger) render as a blank/broken card.
  const image = product.images?.[0] || product.image || `${origin}/images/tanitmarket-signage.jpg`;

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


// ─────────────────────────────────────────────────────────────────────────
// Admin: delete a member account
// ─────────────────────────────────────────────────────────────────────────
// Removing a Firebase Auth account needs the Admin SDK, so the dashboard
// calls this instead of touching Firestore directly. It deletes, in order:
// the member's listings (ads.sellerId == uid), their profile document, then
// their Auth account (sign-in becomes impossible). The caller must be an
// admin — same definition as isAdmin() in firestore.rules.
async function isAdminCaller(auth) {
  if (!auth) return false;
  const email = String(auth.token?.email || '').toLowerCase();
  if (email === ADMIN_FALLBACK_EMAIL) return true;
  const snap = await db.collection('users').doc(auth.uid).get();
  const data = snap.exists ? snap.data() : {};
  return data.isAdmin === true || String(data.role || '').toLowerCase() === 'admin';
}

exports.adminDeleteUser = onCall(async (request) => {
  if (!(await isAdminCaller(request.auth))) {
    throw new HttpsError('permission-denied', 'Action réservée aux administrateurs.');
  }

  const uid = String(request.data?.uid || '').trim();
  if (!uid) {
    throw new HttpsError('invalid-argument', 'Identifiant du membre manquant.');
  }
  if (uid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'Vous ne pouvez pas supprimer votre propre compte.');
  }

  let authUser = null;
  try {
    authUser = await admin.auth().getUser(uid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
  if (authUser && String(authUser.email || '').toLowerCase() === ADMIN_FALLBACK_EMAIL) {
    throw new HttpsError('failed-precondition', "Le compte administrateur principal ne peut pas être supprimé.");
  }

  // Listings, in batches (Firestore caps a batch at 500 writes).
  const adsSnap = await db.collection('ads').where('sellerId', '==', uid).get();
  for (let i = 0; i < adsSnap.docs.length; i += 450) {
    const batch = db.batch();
    adsSnap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await db.collection('users').doc(uid).delete();

  if (authUser) {
    await admin.auth().deleteUser(uid);
  }

  logger.info('adminDeleteUser', { by: request.auth.uid, uid, deletedListings: adsSnap.size, authDeleted: Boolean(authUser) });
  return { deletedListings: adsSnap.size, authDeleted: Boolean(authUser) };
});

// ---------------------------------------------------------------------------
// E-mail verification (replaces the old /api/send-email-otp + verify routes).
// The code is generated, stored (hashed) and checked here only, and only this
// server code writes users/{uid}.emailVerified / verifiedEmail — firestore.rules
// refuse those fields from clients. emailVerifications/{uid} has no client rule
// at all (default deny), so the hash is never readable from the browser.
// ---------------------------------------------------------------------------
const EMAIL_CODE_TTL_MS = 15 * 60 * 1000;
const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_MAX_SENDS_PER_HOUR = 5;
const EMAIL_MAX_ATTEMPTS = 5;

function hashEmailCode(uid, code) {
  return crypto.createHash('sha256').update(`${uid}:${code}`).digest('hex');
}

exports.sendEmailVerificationCode = onCall({ secrets: [RESEND_API_KEY] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connectez-vous pour vérifier votre e-mail.');
  const uid = request.auth.uid;
  const email = String(request.data?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.');
  }

  const ref = db.collection('emailVerifications').doc(uid);
  const now = Date.now();
  const code = String(crypto.randomInt(100000, 1000000));

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? snap.data() : {};
    if (prev.lastSentAt && now - prev.lastSentAt < EMAIL_RESEND_COOLDOWN_MS) {
      throw new HttpsError('resource-exhausted', 'Patientez une minute avant de demander un nouveau code.');
    }
    const windowStart = prev.windowStart && now - prev.windowStart < 60 * 60 * 1000 ? prev.windowStart : now;
    const sendsInWindow = windowStart === prev.windowStart ? (prev.sendsInWindow || 0) : 0;
    if (sendsInWindow >= EMAIL_MAX_SENDS_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Trop de codes demandés. Réessayez dans une heure.');
    }
    tx.set(ref, {
      email,
      codeHash: hashEmailCode(uid, code),
      expiresAt: now + EMAIL_CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      windowStart,
      sendsInWindow: sendsInWindow + 1
    });
  });

  const sent = await sendEmail({
    apiKey: RESEND_API_KEY.value(),
    to: email,
    subject: 'Votre code de vérification TanitMarket',
    html: emailVerificationCodeTemplate({ code })
  });
  if (!sent) {
    // Don't leave a usable code behind if the e-mail never went out.
    await ref.update({ codeHash: null });
    throw new HttpsError('unavailable', "L'e-mail n'a pas pu être envoyé. Réessayez plus tard.");
  }
  return { sent: true };
});

exports.verifyEmailCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connectez-vous pour vérifier votre e-mail.');
  const uid = request.auth.uid;
  const code = String(request.data?.code || '').trim();
  if (!/^\d{6}$/.test(code)) throw new HttpsError('invalid-argument', 'Le code doit contenir 6 chiffres.');

  const ref = db.collection('emailVerifications').doc(uid);
  const email = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : null;
    if (!data || !data.codeHash) throw new HttpsError('failed-precondition', 'Aucun code en cours. Demandez un nouveau code.');
    if (Date.now() > data.expiresAt) throw new HttpsError('deadline-exceeded', 'Ce code a expiré. Demandez un nouveau code.');
    if ((data.attempts || 0) >= EMAIL_MAX_ATTEMPTS) {
      throw new HttpsError('resource-exhausted', 'Trop de tentatives. Demandez un nouveau code.');
    }
    const expected = Buffer.from(data.codeHash, 'hex');
    const actual = Buffer.from(hashEmailCode(uid, code), 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      tx.update(ref, { attempts: (data.attempts || 0) + 1 });
      return null;
    }
    tx.delete(ref);
    tx.set(db.collection('users').doc(uid), { emailVerified: true, verifiedEmail: data.email }, { merge: true });
    return data.email;
  });

  if (!email) throw new HttpsError('permission-denied', 'Code de vérification incorrect.');
  logger.info('verifyEmailCode: e-mail verified', { uid });
  return { emailVerified: true, email };
});
