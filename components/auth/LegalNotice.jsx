import Link from 'next/link';
import { LEGAL_URLS } from '@/lib/authConfig';

export default function LegalNotice({ t, signup }) {
  const link = 'underline underline-offset-2 decoration-[#9aa394] hover:text-brand-forest hover:decoration-brand-forest';
  return (
    <p className="text-[13px] text-center text-[#6d7169] leading-relaxed max-w-[420px] mx-auto">
      {signup ? t('authTermsPrefixSignup') : t('authTermsPrefix')}{' '}
      <Link href={LEGAL_URLS.terms} className={link}>{t('authTermsLink')}</Link>{' '}
      {t('authTermsAnd')}{' '}
      <Link href={LEGAL_URLS.privacy} className={link}>{t('authPrivacyLink')}</Link>{' '}
      {t('authTermsSuffix')}
    </p>
  );
}
