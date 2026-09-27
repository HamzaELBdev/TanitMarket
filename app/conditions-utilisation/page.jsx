import LegalPage from '@/components/legal/LegalPage';

export const metadata = {
  title: "Conditions générales d'utilisation",
  description: "Règles d'utilisation de TanitMarket, la marketplace de petites annonces entre particuliers en Tunisie.",
  alternates: { canonical: '/conditions-utilisation' },
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
