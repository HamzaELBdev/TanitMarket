// Escape values that come from a user or from the AI before they land in HTML.
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapper(preheader, innerHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
        <p style="color: #788078; font-size: 14px; margin-top: 4px;">${preheader}</p>
      </div>
      ${innerHtml}
    </div>
  `;
}

function newListingTemplate({ title, price, location, listingId }) {
  return wrapper('Félicitations, votre annonce est publiée !', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(22,51,0,0.1);">
      <h3 style="color: #163300; margin: 0 0 10px 0; font-size: 18px;">${title}</h3>
      <p style="color: #163300; font-size: 16px; font-weight: bold; margin: 0 0 6px 0;">Prix : ${price ? price + ' TND' : 'Sur demande'}</p>
      <p style="color: #788078; font-size: 13px; margin: 0;">📍 Localisation : ${location || 'Tunisie'}</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${listingId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir mon annonce ➔
      </a>
    </div>
  `);
}

function newChatTemplate({ senderName, productTitle, messagePreview, productId }) {
  return wrapper('Nouveau message dans votre messagerie', `
    <div style="background-color: #F7F8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #163300;">
      <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">Annonce : ${productTitle || 'Article'}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">"${messagePreview || ''}"</p>
      <p style="color: #788078; font-size: 12px; margin: 0;">— De : <strong>${senderName || 'Utilisateur'}</strong></p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/chat?productId=${productId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Répondre sur le Chat 💬
      </a>
    </div>
  `);
}

function negotiationOfferTemplate({ buyerName, productTitle, offeredPrice, originalPrice, productId }) {
  return wrapper('Nouvelle offre de prix reçue', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="color: #788078; font-size: 13px; margin: 0 0 6px 0;">Article : <strong>${productTitle}</strong>${originalPrice ? ` (Prix original: ${originalPrice} TND)` : ''}</p>
      <div style="font-size: 28px; font-weight: 900; color: #163300; margin: 10px 0;">
        Offre reçue : ${offeredPrice} TND
      </div>
      <p style="color: #163300; font-size: 12px; margin: 0;">Offre proposée par <strong>${buyerName || 'un utilisateur'}</strong></p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/chat?productId=${productId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Accepter ou Contre-proposer ➔
      </a>
    </div>
  `);
}

function listingApprovedTemplate({ title, listingId }) {
  return wrapper('Votre annonce est maintenant en ligne', `
    <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid rgba(22,51,0,0.1);">
      <p style="color: #163300; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">✅ Annonce approuvée</p>
      <p style="color: #313B35; font-size: 14px; margin: 0;">"${title}" a été validée par un administrateur et est désormais visible par tous les acheteurs sur TanitMarket.</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${listingId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir mon annonce ➔
      </a>
    </div>
  `);
}

function listingRejectedTemplate({ title, reason }) {
  return wrapper('Votre annonce nécessite une modification', `
    <div style="background-color: #FFF5DA; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid rgba(184,103,0,0.15);">
      <p style="color: #b86700; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">⚠️ Annonce refusée</p>
      <p style="color: #313B35; font-size: 14px; margin: 0 0 10px 0;">Votre annonce "${title}" n'a pas été approuvée par notre équipe de modération.</p>
      ${reason ? `<p style="color: #788078; font-size: 13px; margin: 0; font-style: italic;">Motif : ${reason}</p>` : ''}
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
      <h3 style="color: #163300; margin: 0 0 10px 0; font-size: 18px;">${title}</h3>
      <p style="margin: 0;">
        <span style="color: #a72027; text-decoration: line-through; font-size: 14px; margin-right: 8px;">${oldPrice} TND</span>
        <span style="color: #163300; font-size: 24px; font-weight: 900;">${newPrice} TND</span>
      </p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${listingId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Voir l'annonce ➔
      </a>
    </div>
  `);
}

function adminPendingListingTemplate({ title, sellerName, price, location, listingId }) {
  return wrapper('Nouvelle annonce à modérer', `
    <div style="background-color: #F7F8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #163300;">
      <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">${title}</p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Vendeur : <strong>${sellerName || 'Utilisateur'}</strong></p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Prix : <strong>${price ? price + ' TND' : 'Sur demande'}</strong></p>
      <p style="color: #788078; font-size: 12px; margin: 0;">📍 ${location || 'Tunisie'}</p>
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
        ${code}
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
function adminAiDecisionTemplate({ approved, title, sellerName, price, location, listingId, reason, model }) {
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
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Vendeur : <strong>${esc(sellerName) || 'Utilisateur'}</strong></p>
      <p style="color: #313B35; font-size: 13px; margin: 0 0 4px 0;">Prix : <strong>${price ? esc(price) + ' TND' : 'Sur demande'}</strong></p>
      <p style="color: #788078; font-size: 12px; margin: 0;">📍 ${esc(location) || 'Tunisie'}</p>
    </div>
    ${reason ? `
    <div style="background-color: #FFF6F5; border-radius: 12px; padding: 14px; margin-bottom: 20px; border: 1px solid rgba(226,87,76,0.25);">
      <p style="color: #788078; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Motif retenu par l'IA</p>
      <p style="color: #313B35; font-size: 13px; margin: 0;">${esc(reason)}</p>
    </div>` : ''}
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://tanitmarket.com/product/${esc(listingId)}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
        Vérifier l'annonce ➔
      </a>
    </div>
    <p style="color: #788078; font-size: 11px; text-align: center; margin-top: 16px;">
      Décision prise automatiquement${model ? ` par ${esc(model)}` : ''}. Vous pouvez toujours la corriger depuis le Dashboard.
    </p>
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
  adminPendingListingTemplate,
  adminAiDecisionTemplate
};
