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

module.exports = {
  newListingTemplate,
  newChatTemplate,
  negotiationOfferTemplate,
  listingApprovedTemplate,
  listingRejectedTemplate,
  priceDropTemplate,
  adminPendingListingTemplate
};
