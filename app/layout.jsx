import './globals.css';
import LayoutShell from '@/components/LayoutShell';
import PwaRegister from '@/components/PwaRegister';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from '@/lib/seo';

export const viewport = {
  themeColor: '#0e0f0c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ['petites annonces Tunisie', 'marketplace Tunisie', 'acheter vendre Tunisie', 'annonces gratuites', 'TanitMarket'],
  manifest: '/manifest.json',
  icons: {
    icon: '/logoBg.ico',
    shortcut: '/logoBg.ico',
    apple: '/logoBg.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_TN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 2000, height: 2000, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_OG_IMAGE,
  description: DEFAULT_DESCRIPTION,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logoBg.ico" sizes="any" />
        <meta name="theme-color" content="#0e0f0c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Manrope:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-[#FFFFFF] antialiased flex flex-col min-h-screen text-[#0e0f0c] font-body" suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <WishlistProvider>
              <PwaRegister />
              <LayoutShell>
                {children}
              </LayoutShell>
            </WishlistProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

