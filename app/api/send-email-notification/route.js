import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const { type, recipientEmail, recipientName, details } = await req.json();

    if (!recipientEmail) {
      return NextResponse.json({ error: "L'adresse e-mail destinataire est requise." }, { status: 400 });
    }

    const cleanEmail = recipientEmail.trim().toLowerCase();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Clé RESEND_API_KEY non configurée." }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const customFrom = process.env.RESEND_FROM_EMAIL || 'Notify@notify.tanitmarket.com';
    const primaryFrom = customFrom.includes('<') ? customFrom : `TanitMarket <${customFrom}>`;

    let subject = '🇹🇳 Notification TanitMarket';
    let htmlContent = '';

    const name = recipientName || 'Utilisateur TanitMarket';

    if (type === 'new_listing') {
      const { title, price, location, listingId } = details || {};
      subject = `🇹🇳 Votre annonce "${title || 'Annonce'}" est en ligne sur TanitMarket !`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
            <p style="color: #788078; font-size: 14px; margin-top: 4px;">Félicitations, votre annonce est publiée !</p>
          </div>

          <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #163300/10;">
            <h3 style="color: #163300; margin: 0 0 10px 0; font-size: 18px;">${title}</h3>
            <p style="color: #163300; font-size: 16px; font-weight: bold; margin: 0 0 6px 0;">Prix : ${price ? price + ' TND' : 'Sur demande'}</p>
            <p style="color: #788078; font-size: 13px; margin: 0;">📍 Localisation : ${location || 'Tunisie'}</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://tanitmarket.com/product/${listingId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
              Voir mon annonce ➔
            </a>
          </div>

          <p style="color: #788078; font-size: 12px; text-align: center; margin-top: 24px;">
            Merci d'utiliser TanitMarket, la place de marché N°1 entre particuliers en Tunisie.
          </p>
        </div>
      `;
    } else if (type === 'new_chat') {
      const { senderName, productTitle, messagePreview, chatId } = details || {};
      subject = `💬 Nouveau message de ${senderName || 'un acheteur'} pour "${productTitle || 'votre annonce'}"`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
            <p style="color: #788078; font-size: 14px; margin-top: 4px;">Nouveau message dans votre messagerie</p>
          </div>

          <div style="background-color: #F7F8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #163300;">
            <p style="color: #163300; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">Annonce : ${productTitle || 'Article'}</p>
            <p style="color: #313B35; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">"${messagePreview || 'Bonjour, cet article est-il toujours disponible ?'}"</p>
            <p style="color: #788078; font-size: 12px; margin: 0;">— De : <strong>${senderName || 'Acheteur'}</strong></p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://tanitmarket.com/chat?id=${chatId || ''}" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
              Répondre sur le Chat 💬
            </a>
          </div>
        </div>
      `;
    } else if (type === 'negotiation_offer') {
      const { buyerName, productTitle, offeredPrice, originalPrice } = details || {};
      subject = `🏷️ Offre de négociation : ${offeredPrice} TND pour "${productTitle || 'votre article'}"`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
            <p style="color: #788078; font-size: 14px; margin-top: 4px;">Nouvelle offre de prix reçue</p>
          </div>

          <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="color: #788078; font-size: 13px; margin: 0 0 6px 0;">Article : <strong>${productTitle}</strong> (Prix original: ${originalPrice} TND)</p>
            <div style="font-size: 28px; font-weight: 900; color: #163300; margin: 10px 0;">
              Offre reçue : ${offeredPrice} TND
            </div>
            <p style="color: #163300; font-size: 12px; margin: 0;">Offre proposée par <strong>${buyerName || 'Acheteur'}</strong></p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://tanitmarket.com/chat" style="background-color: #163300; color: #9FE870; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block;">
              Accepter ou Contre-proposer ➔
            </a>
          </div>
        </div>
      `;
    }

    let resendResult;
    try {
      resendResult = await resend.emails.send({
        from: primaryFrom,
        to: [cleanEmail],
        subject,
        html: htmlContent
      });
    } catch (err) {
      console.warn("Primary domain send failed, trying default Resend onboarding domain:", err.message);
    }

    // Fallback to onboarding@resend.dev if custom domain fails
    if (!resendResult || resendResult.error) {
      resendResult = await resend.emails.send({
        from: 'TanitMarket <onboarding@resend.dev>',
        to: [cleanEmail],
        subject,
        html: htmlContent
      });
    }

    if (resendResult && resendResult.error) {
      console.error("Resend API Error:", resendResult.error);
      return NextResponse.json({ error: resendResult.error.message || "Erreur de livraison d'e-mail Resend." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Notification e-mail envoyée avec succès à ${cleanEmail}`
    });

  } catch (err) {
    console.error("Send Email Notification Error:", err);
    return NextResponse.json({ error: err.message || "Échec de l'envoi de la notification." }, { status: 500 });
  }
}
