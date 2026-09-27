import LegalPage from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment TanitMarket collecte, utilise et protège vos données personnelles, et comment exercer vos droits.',
  alternates: { canonical: '/confidentialite' },
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
