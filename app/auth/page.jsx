import AuthScreen from '@/components/auth/AuthScreen';

// Server entry: only the interactive screen (forms, tabs, animations) is a
// client component. Views: /auth (login), /auth?mode=signup, /auth?mode=forgot.
export const metadata = {
  title: 'Connexion / Inscription',
  description: 'Connectez-vous ou créez votre compte TanitMarket gratuitement.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth' },
};

export default function AuthPage() {
  return <AuthScreen />;
}
