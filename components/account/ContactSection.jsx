"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { auth, sendFirebaseSmsOtp, verifyFirebaseSmsOtp } from '@/lib/firebase';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import { showToast, showError } from '@/lib/swal';
import { FieldError, inputCls } from '@/components/account/ui';
import { DURATION, EASE_OUT } from '@/lib/design';

function maskEmail(email = '') {
  const [user, domain = ''] = email.split('@');
  const tld = domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : '';
  return `${(user || '').charAt(0)}••••@•••${tld}`;
}

function maskPhone(phone = '') {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const prefix = phone.trim().startsWith('+') ? `+${digits.slice(0, 3)} ` : '';
  return `${prefix}•• ••• ${digits.slice(-3)}`;
}

function VerifiedBadge({ ok }) {
  const { t } = useLanguage();
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-mint px-2.5 py-1 text-xs font-bold text-[#1d5c0a]">
      <CheckCircle2 className="w-3.5 h-3.5" /> {t('stVerified')}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[#fff3dc] px-2.5 py-1 text-xs font-bold text-[#8a4d00]">{t('stNotVerified')}</span>
  );
}

/**
 * E-mail + phone. Verified values are read-only (masked) — as before the
 * redesign, changing a verified contact is not offered here. For unverified
 * ones: Resend e-mail OTP, and Firebase SMS (see the phone section below).
 * Editing the value after a code was sent resets the flow so a code can
 * never verify a different value than the one it was sent to.
 */
export default function ContactSection({ acc }) {
  const { t } = useLanguage();
  const { user, profile, isAdmin } = acc;

  // ----- e-mail -----
  const [email, setEmail] = useState(profile?.verifiedEmail || user?.email || '');
  const [emailStep, setEmailStep] = useState('idle'); // idle | sent
  const [emailCode, setEmailCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailErr, setEmailErr] = useState('');

  const sendEmailCode = async () => {
    setEmailErr('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setEmailErr('Adresse e-mail invalide.'); return; }
    setEmailBusy(true);
    try {
      const res = await fetch('/api/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), uid: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");
      setEmailStep('sent');
      showToast(data.message || 'Code envoyé par e-mail.');
    } catch (err) {
      setEmailErr(err.message || "Impossible d'envoyer l'e-mail de vérification.");
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyEmailCode = async (e) => {
    e.preventDefault();
    setEmailErr('');
    if (emailCode.trim().length < 6) { setEmailErr('Veuillez saisir les 6 chiffres du code reçu.'); return; }
    setEmailBusy(true);
    try {
      const res = await fetch('/api/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: emailCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code incorrect');
      await acc.saveFields({ emailVerified: true, verifiedEmail: email.trim() });
      showToast('Adresse e-mail vérifiée.');
    } catch (err) {
      setEmailErr(err.message === 'save-failed' ? t('stSaveError') : (err.message || 'Code de vérification incorrect.'));
    } finally {
      setEmailBusy(false);
    }
  };

  // ----- phone -----
  // A number is marked verified ONLY after Firebase confirmed the SMS code
  // and linked the number to this Auth account. What gets saved is the
  // number Firebase Auth holds (E.164), and Firestore rules re-check it
  // against the ID token's phone_number claim — the client can't fake it.
  const [phone, setPhone] = useState(profile?.phoneNumber || '+216 ');
  const [smsStep, setSmsStep] = useState('idle'); // idle | sent
  const [smsCode, setSmsCode] = useState('');
  const [smsBusy, setSmsBusy] = useState(false);
  const [phoneErr, setPhoneErr] = useState('');

  const smsErrorMessage = (err) => {
    switch (err?.code) {
      case 'auth/invalid-phone-number': return 'Numéro non valide.';
      case 'auth/invalid-verification-code': return 'Code SMS incorrect. Vérifiez le code saisi.';
      case 'auth/code-expired':
      case 'auth/missing-verification-id':
      case 'auth/invalid-verification-id': return 'Ce code a expiré. Demandez un nouveau code.';
      case 'auth/too-many-requests':
      case 'auth/quota-exceeded': return 'Trop de tentatives. Réessayez dans quelques minutes.';
      case 'auth/captcha-check-failed': return 'La vérification anti-robot a échoué. Réessayez.';
      case 'auth/network-request-failed': return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
      case 'auth/requires-recent-login': return 'Pour des raisons de sécurité, reconnectez-vous puis réessayez.';
      default: return "Le code n'a pas pu être envoyé ou vérifié. Réessayez.";
    }
  };

  // Save the number currently linked to the Auth account as verified.
  // getIdToken(true) refreshes the token so the rules see the phone claim.
  const saveLinkedPhone = async (authUser) => {
    await authUser.getIdToken(true);
    if (!authUser.phoneNumber) throw new Error('no-linked-phone');
    await acc.saveFields({ phoneNumber: authUser.phoneNumber, isPhoneVerified: true });
    setPhone(authUser.phoneNumber);
    setSmsStep('idle');
    setSmsCode('');
    showToast('Numéro vérifié.');
  };

  const sendSms = async () => {
    setPhoneErr('');
    const { valid, formatted } = validatePhoneNumber(phone.trim(), { allowFrench: isAdmin });
    if (!phone.trim() || !valid) {
      setPhoneErr(isAdmin
        ? 'Seuls les numéros tunisiens (+216, 8 chiffres) ou français (+33, 10 chiffres) sont acceptés.'
        : 'Seuls les numéros tunisiens à 8 chiffres sont acceptés (ex : +216 98 123 456).');
      return;
    }
    setPhone(formatted);
    setSmsBusy(true);
    try {
      // Already proven for this account (e.g. a previous save failed after the
      // code was accepted): Firebase Auth vouches for it, no new SMS needed.
      if (auth.currentUser?.phoneNumber && auth.currentUser.phoneNumber === formatted) {
        await saveLinkedPhone(auth.currentUser);
        return;
      }
      await sendFirebaseSmsOtp(formatted, 'recaptcha-container');
      setSmsStep('sent');
      showToast(`Code envoyé au ${formatted}.`);
    } catch (err) {
      console.warn('Firebase Phone Auth Exception:', err);
      setSmsStep('idle');
      setPhoneErr(err?.message === 'save-failed' ? t('stSaveError') : smsErrorMessage(err));
    } finally {
      setSmsBusy(false);
    }
  };

  const verifySms = async (e) => {
    e.preventDefault();
    setPhoneErr('');
    if (smsCode.trim().length < 6) { setPhoneErr('Veuillez saisir les 6 chiffres du code SMS reçu.'); return; }
    setSmsBusy(true);
    try {
      const authUser = await verifyFirebaseSmsOtp(smsCode.trim());
      await saveLinkedPhone(authUser);
    } catch (err) {
      console.warn('SMS verification error:', err);
      if (err?.message === 'save-failed') {
        // The number IS linked in Auth; "Envoyer le code" retries the save without a new SMS.
        setSmsStep('idle');
        setPhoneErr(t('stSaveError'));
      } else if (err?.code === 'auth/account-exists-with-different-credential' || err?.code === 'auth/credential-already-in-use') {
        showError('Numéro déjà utilisé', 'Ce numéro est déjà associé à un autre compte TanitMarket.');
      } else if (!err?.code) {
        setSmsStep('idle');
        setPhoneErr(err?.message || smsErrorMessage(err));
      } else {
        setPhoneErr(smsErrorMessage(err));
      }
    } finally {
      setSmsBusy(false);
    }
  };

  const smallBtn = 'shrink-0 inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-xl bg-brand-forest hover:bg-brand-forest-hover text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait active:scale-[0.98]';

  const codeForm = (onSubmit, value, setValue, busy, idPrefix) => (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: DURATION.panel, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <label htmlFor={`${idPrefix}-code`} className="block text-xs font-bold text-[#163300] mt-3 mb-1.5">{t('stCodeLabel')}</label>
      <div className="flex gap-2">
        <input id={`${idPrefix}-code`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} className={`${inputCls} tracking-[0.4em] text-center font-bold`} />
        <button type="submit" disabled={busy} className={smallBtn}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{t('stValidate')}</button>
      </div>
    </motion.form>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5">
      {/* E-mail */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-2 text-sm font-bold text-[#0e0f0c]"><Mail className="w-4 h-4" /> {t('stEmail')}</span>
          <VerifiedBadge ok={acc.emailVerified} />
        </div>
        {acc.emailVerified ? (
          <p className="min-h-12 px-4 flex items-center rounded-xl bg-[#f6f8f4] border border-[#163300]/[0.07] text-sm font-medium text-[#2f3a28]" aria-label={t('stEmail')}>
            {maskEmail(profile?.verifiedEmail || user?.email || '')}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                aria-label={t('stEmail')}
                aria-invalid={!!emailErr}
                aria-describedby="email-err"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailStep('idle'); setEmailCode(''); }}
                className={inputCls}
              />
              <button type="button" onClick={sendEmailCode} disabled={emailBusy} className={smallBtn} aria-label={emailStep === 'sent' ? t('stResendCode') : t('stSendCode')}>
                {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
                <span>{emailStep === 'sent' ? t('stResendCode') : t('stSendCode')}</span>
              </button>
            </div>
            <AnimatePresence>{emailStep === 'sent' && codeForm(verifyEmailCode, emailCode, setEmailCode, emailBusy, 'email')}</AnimatePresence>
            <FieldError id="email-err">{emailErr}</FieldError>
          </>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-2 text-sm font-bold text-[#0e0f0c]"><Phone className="w-4 h-4" /> {t('stPhone')}</span>
          <VerifiedBadge ok={acc.phoneVerified} />
        </div>
        <div id="recaptcha-container" />
        {acc.phoneVerified ? (
          <p dir="ltr" className="min-h-12 px-4 flex items-center rounded-xl bg-[#f6f8f4] border border-[#163300]/[0.07] text-sm font-medium text-[#2f3a28] rtl:justify-end" aria-label={t('stPhone')}>
            {maskPhone(profile?.phoneNumber || '')}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <input
                type="tel"
                dir="ltr"
                aria-label={t('stPhone')}
                aria-invalid={!!phoneErr}
                aria-describedby="phone-err"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSmsStep('idle'); setSmsCode(''); }}
                placeholder="+216 98 123 456"
                className={inputCls}
              />
              <button type="button" onClick={sendSms} disabled={smsBusy} className={smallBtn} aria-label={smsStep === 'sent' ? t('stResendCode') : t('stSendCode')}>
                {smsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
                <span>{smsStep === 'sent' ? t('stResendCode') : t('stSendCode')}</span>
              </button>
            </div>
            <AnimatePresence>{smsStep === 'sent' && codeForm(verifySms, smsCode, setSmsCode, smsBusy, 'sms')}</AnimatePresence>
            <FieldError id="phone-err">{phoneErr}</FieldError>
          </>
        )}
      </div>
    </div>
  );
}
