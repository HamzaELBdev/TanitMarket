import SupportClient from '@/components/support/SupportClient';

export const metadata = {
  title: 'Support',
  description: "Contactez l'équipe TanitMarket : chat direct ou formulaire de contact.",
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return <SupportClient />;
}
