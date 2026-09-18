import { NextResponse } from 'next/server';
import { Resend } from 'resend';

globalThis.emailOtpStore = globalThis.emailOtpStore || new Map();

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      try {
        const text = await req.text();
        body = JSON.parse(text || '{}');
      } catch (parseErr) {}
    }

    const { email, uid } = body || {};

    if (!email) {
      return NextResponse.json({ error: "L'adresse e-mail est requise." }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const cleanEmail = String(email).trim().toLowerCase();

    // Store in global memory map
    globalThis.emailOtpStore.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        code,
        message: `✅ Code de vérification généré : ${code} (Consultez .env.local pour configurer RESEND_API_KEY).`
      });
    }

    const resend = new Resend(apiKey);
    const customFrom = process.env.RESEND_FROM_EMAIL || 'Notify@notify.tanitmarket.com';
    const primaryFrom = customFrom.includes('<') ? customFrom : `TanitMarket <${customFrom}>`;

    let resendResult;
    try {
      resendResult = await resend.emails.send({
        from: primaryFrom,
        to: [cleanEmail],
        subject: `🇹🇳 Votre code de vérification TanitMarket : ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
              <p style="color: #788078; font-size: 14px; margin-top: 4px;">Plateforme d'annonces en Tunisie</p>
            </div>
            <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
              <p style="color: #163300; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Voici votre code de vérification e-mail :</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #163300; background-color: #9FE870; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                ${code}
              </div>
              <p style="color: #788078; font-size: 12px; margin-top: 10px;">Ce code expire dans 15 minutes.</p>
            </div>
            <p style="color: #788078; font-size: 12px; text-align: center;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.</p>
          </div>
        `
      });
    } catch (sendErr) {
      console.warn("Primary domain send failed, trying default Resend onboarding domain:", sendErr.message);
    }

    if (!resendResult || resendResult.error) {
      resendResult = await resend.emails.send({
        from: 'TanitMarket <onboarding@resend.dev>',
        to: [cleanEmail],
        subject: `🇹🇳 Votre code de vérification TanitMarket : ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #E6EAE3; border-radius: 16px; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #163300; margin: 0; font-size: 24px;">TanitMarket 🇹🇳</h2>
              <p style="color: #788078; font-size: 14px; margin-top: 4px;">Plateforme d'annonces en Tunisie</p>
            </div>
            <div style="background-color: #EDF8E7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
              <p style="color: #163300; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Voici votre code de vérification e-mail :</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #163300; background-color: #9FE870; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                ${code}
              </div>
              <p style="color: #788078; font-size: 12px; margin-top: 10px;">Ce code expire dans 15 minutes.</p>
            </div>
            <p style="color: #788078; font-size: 12px; text-align: center;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.</p>
          </div>
        `
      });
    }

    if (resendResult && resendResult.error) {
      return NextResponse.json({
        success: true,
        code,
        message: `✅ Code de vérification : ${code} (Resend Note: ${resendResult.error.message})`
      });
    }

    return NextResponse.json({
      success: true,
      message: `✅ Un code de vérification à 6 chiffres a été envoyé à ${cleanEmail}.`
    });

  } catch (err) {
    console.error("Send Email OTP Exception:", err);
    return NextResponse.json({ error: err.message || "Échec de l'envoi de l'e-mail." }, { status: 500 });
  }
}
