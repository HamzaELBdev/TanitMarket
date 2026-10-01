// Every value these templates interpolate comes from outside: a listing title
// and location typed by a seller, a display name, a chat message, a rejection
// reason written by the AI. Inlined raw, any of them could break out of the
// surrounding tag or attribute and inject arbitrary markup into the e-mail —
// so nothing is interpolated without going through esc() (HTML text and
// attribute values) or urlPart() (a path/query segment inside an href).
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// An id dropped into a URL: percent-encode it (which also removes every
// character that could terminate the href attribute), then escape what's left.
function urlPart(value) {
  return esc(encodeURIComponent(String(value == null ? '' : value)));
}

// A price is normally a number, but it reaches us from Firestore, where a
// client wrote it — so it is escaped like any other untrusted value.
function price(value) {
  return value ? `${esc(value)} TND` : 'Sur demande';
}

function wrapper(preheader, innerHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
        <p style="color: #788078; font-size: 14px; margin-top: 4px;">${esc(preheader)}</p>
      </div>
      ${innerHtml}
    </div>
  `;
}

function newListingTemplate({ title, price: listingPrice, location, listingId }) {
  return wrapper('Félicitations, votre annonce est publiée !', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(22,51,0,0.1);">
      <h3 style="color: #163300; margin: 0 0 10px 0; font-size: 18px;">${esc(title)}</h3>
      <p style="color: #163300; font-size: 16px; font-weight: bold; margin: 0 0 6px 0;">Prix : ${price(listingPrice)}</p>
      <p style="color: #788078; font-size: 13px; margin: 0;">📍 Localisation : ${esc(location || 'Tunisie')}</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${urlPart(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir mon annonce ➔
      </a>
    </div>
  `);
}

function newChatTemplate({ senderName, productTitle, messagePreview, productId }) {
  return wrapper('Nouveau message dans votre messagerie', `
    <div style="background-color: #F7F8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #163300;">
      <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">Annonce : ${esc(productTitle || 'Article')}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">"${esc(messagePreview)}"</p>
      <p style="color: #788078; font-size: 12px; margin: 0;">— De : <strong>${esc(senderName || 'Utilisateur')}</strong></p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/chat?productId=${urlPart(productId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Répondre sur le Chat 💬
      </a>
    </div>
  `);
}

function negotiationOfferTemplate({ buyerName, productTitle, offeredPrice, originalPrice, productId }) {
  return wrapper('Nouvelle offre de prix reçue', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="color: #788078; font-size: 13px; margin: 0 0 6px 0;">Article : <strong>${esc(productTitle)}</strong>${originalPrice ? ` (Prix original: ${esc(originalPrice)} TND)` : ''}</p>
      <div style="font-size: 28px; font-weight: 900; color: #163300; margin: 10px 0;">
        Offre reçue : ${esc(offeredPrice)} TND
      </div>
      <p style="color: #163300; font-size: 12px; margin: 0;">Offre proposée par <strong>${esc(buyerName || 'un utilisateur')}</strong></p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/chat?productId=${urlPart(productId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Accepter ou Contre-proposer ➔
      </a>
    </div>
  `);
}

function listingApprovedTemplate({ title, listingId }) {
  return wrapper('Votre annonce est maintenant en ligne', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid rgba(22,51,0,0.1);">
      <p style="color: #163300; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">✅ Annonce approuvée</p>
      <p style="color: #313B35; font-size: 14px; margin: 0;">"${esc(title)}" a été validée par un administrateur et est désormais visible par tous les acheteurs sur TanitMarket.</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${urlPart(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir mon annonce ➔
      </a>
    </div>
  `);
}

function listingRejectedTemplate({ title, reason }) {
  return wrapper('Votre annonce nécessite une modification', `
    <div style="background-color: #FFF5DA; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid rgba(184,103,0,0.15);">
      <p style="color: #b86700; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">⚠️ Annonce refusée</p>
      <p style="color: #313B35; font-size: 14px; margin: 0 0 10px 0;">Votre annonce "${esc(title)}" n'a pas été approuvée par notre équipe de modération.</p>
      ${reason ? `<p style="color: #788078; font-size: 13px; margin: 0; font-style: italic;">Motif : ${esc(reason)}</p>` : ''}
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/profile" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Modifier mon annonce ➔
      </a>
    </div>
  `);
}

function priceDropTemplate({ title, oldPrice, newPrice, listingId }) {
  return wrapper('Bonne nouvelle sur un de vos favoris', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="color: #163300; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">💚 Le prix a baissé sur un article que vous suivez</p>
      <h3 style="color: #163300; margin: 0 0 10px 0; font-size: 18px;">${esc(title)}</h3>
      <p style="margin: 0;">
        <span style="color: #a72027; text-decoration: line-through; font-size: 14px; margin-right: 8px;">${esc(oldPrice)} TND</span>
        <span style="color: #163300; font-size: 24px; font-weight: 900;">${esc(newPrice)} TND</span>
      </p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${urlPart(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir l'annonce ➔
      </a>
    </div>
  `);
}

function savedSearchMatchTemplate({ query, title, price: listingPrice, listingId }) {
  return wrapper('Une annonce correspond à votre recherche', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="color: #163300; font-size: 14px; margin: 0 0 10px 0;">🔔 Votre recherche enregistrée : <strong>« ${esc(query)} »</strong></p>
      <h3 style="color: #163300; margin: 0 0 6px 0; font-size: 18px;">${esc(title)}</h3>
      <p style="color: #163300; font-size: 20px; font-weight: 900; margin: 0;">${price(listingPrice)}</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${urlPart(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir l'annonce ➔
      </a>
    </div>
  `);
}

function adminPendingListingTemplate({ title, sellerName, price: listingPrice, location, listingId }) {
  return wrapper('Nouvelle annonce à modérer', `
    <div style="background-color: #F7F8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #163300;">
      <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">${esc(title)}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Vendeur : <strong>${esc(sellerName || 'Utilisateur')}</strong></p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Prix : <strong>${price(listingPrice)}</strong></p>
      <p style="color: #788078; font-size: 12px; margin: 0;">📍 ${esc(location || 'Tunisie')}</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/dash" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Modérer dans le Dashboard ➔
      </a>
    </div>
  `);
}

function emailVerificationCodeTemplate({ code }) {
  return wrapper("Plateforme d'annonces en Tunisie", `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="color: #163300; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Voici votre code de vérification e-mail :</p>
      <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #163300; background-color: #9FE870; padding: 10px 20px; border-radius: 8px; display: inline-block;">
        ${esc(code)}
      </div>
      <p style="color: #788078; font-size: 12px; margin-top: 10px;">Ce code expire dans 15 minutes.</p>
    </div>
    <p style="color: #788078; font-size: 12px; text-align: center;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.</p>
  `);
}

/**
 * Admin-facing recap of a decision the AI moderation took on its own, for
 * both outcomes: an approval means a listing went live with nobody having
 * looked at it, a rejection means a seller was turned away automatically.
 * Either way the admin gets the reason and a direct link to double-check it.
 */
function adminAiDecisionTemplate({ approved, title, sellerName, price: listingPrice, location, listingId, reason, model }) {
  const accent = approved ? '#9FE870' : '#E2574C';
  const heading = approved
    ? '🤖 Annonce approuvée automatiquement'
    : '🤖 Annonce rejetée automatiquement';
  const lead = approved
    ? "L'IA de modération a approuvé cette annonce : elle est désormais en ligne, sans revue manuelle."
    : "L'IA de modération a refusé cette annonce. Le vendeur en a été informé.";

  return wrapper(approved ? 'Modération automatique : approuvée' : 'Modération automatique : refusée', `
    <div style="background-color: #F7F8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid ${accent};">
      <p style="color: #163300; font-weight: bold; font-size: 15px; margin: 0 0 10px 0;">${heading}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 12px 0;">${lead}</p>
      <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">${esc(title)}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Vendeur : <strong>${esc(sellerName || 'Utilisateur')}</strong></p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Prix : <strong>${price(listingPrice)}</strong></p>
      <p style="color: #788078; font-size: 12px; margin: 0;">📍 ${esc(location || 'Tunisie')}</p>
    </div>
    ${reason ? `
    <div style="background-color: #FFF6F5; border-radius: 12px; padding: 14px; margin-bottom: 20px; border: 1px solid rgba(226,87,76,0.25);">
      <p style="color: #788078; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Motif retenu par l'IA</p>
      <p style="color: #313B35; font-size: 13px; margin: 0;">${esc(reason)}</p>
    </div>` : ''}
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${urlPart(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Vérifier l'annonce ➔
      </a>
    </div>
    <p style="color: #788078; font-size: 11px; text-align: center; margin-top: 16px;">
      Décision prise automatiquement${model ? ` par ${esc(model)}` : ''}. Vous pouvez toujours la corriger depuis le Dashboard.
    </p>
  `);
}

/**
 * "Is this still for sale?" — sent once, 30 days after a listing went live.
 * One tap opens "Mes annonces", where the answer is a single button.
 */
function listingStillAvailableTemplate({ title, daysLeft }) {
  const days = Number.isFinite(Number(daysLeft)) ? Math.max(0, Math.round(Number(daysLeft))) : 7;
  return wrapper('Cette annonce est-elle toujours disponible ?', `
    <div style="background-color: #FFF5DA; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid rgba(184,103,0,0.15);">
      <p style="color: #b86700; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">⏳ Toujours disponible ?</p>
      <p style="color: #313B35; font-size: 14px; margin: 0 0 10px 0;">Votre annonce "${esc(title)}" est en ligne depuis un moment.</p>
      <p style="color: #788078; font-size: 13px; margin: 0;">Confirmez-le en un clic, sinon elle sera retirée dans ${days} jour${days > 1 ? 's' : ''} pour que les acheteurs ne contactent que des articles réellement disponibles.</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/profile?tab=listings" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Gérer mon annonce ➔
      </a>
    </div>
  `);
}

/** Sent when the grace period ran out and the listing was taken down. */
function listingExpiredTemplate({ title }) {
  return wrapper('Votre annonce a été retirée', `
    <div style="background-color: #F7F8F5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid #E6EAE3;">
      <p style="color: #163300; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">Annonce retirée</p>
      <p style="color: #313B35; font-size: 14px; margin: 0 0 10px 0;">"${esc(title)}" n'est plus visible : nous n'avons pas reçu de confirmation de disponibilité.</p>
      <p style="color: #788078; font-size: 13px; margin: 0;">Elle n'est pas supprimée. Si l'article est toujours à vendre, vous pouvez la remettre en ligne en un clic.</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/profile?tab=listings" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Remettre en ligne ➔
      </a>
    </div>
  `);
}

/** Admin-facing: a member reported a listing. */
function adminListingReportTemplate({ title, reasonLabel, details, reporterName, listingId }) {
  return wrapper('Une annonce a été signalée', `
    <div style="background-color: #FFF6F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #E2574C;">
      <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">${esc(title)}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Motif : <strong>${esc(reasonLabel)}</strong></p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Signalée par : <strong>${esc(reporterName || 'Un membre')}</strong></p>
      ${details ? `<p style="color: #788078; font-size: 13px; margin: 8px 0 0 0; font-style: italic;">"${esc(details)}"</p>` : ''}
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${urlPart(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir l'annonce ➔
      </a>
    </div>
  `);
}

module.exports = {
  emailVerificationCodeTemplate,
  newListingTemplate,
  newChatTemplate,
  negotiationOfferTemplate,
  listingApprovedTemplate,
  listingRejectedTemplate,
  priceDropTemplate,
  savedSearchMatchTemplate,
  adminPendingListingTemplate,
  adminAiDecisionTemplate,
  listingStillAvailableTemplate,
  listingExpiredTemplate,
  adminListingReportTemplate
};
