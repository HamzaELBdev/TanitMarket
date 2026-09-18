import { cache } from 'react';
import SellerProfileClient from './SellerProfileClient';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { fetchAdminListingsFromDb, fetchUsersFromDb, getUserProfileFromDb } from '@/lib/firestoreService';
import { absoluteUrl, truncate, SITE_NAME } from '@/lib/seo';

// Static export can only pre-render ids known at build time. A fixed
// '_shell' id is always included so firebase.json can rewrite every
// /seller/** request to a guaranteed-existing shell — the client component
// then reads the real id from the URL and fetches it itself (same trick
// used by /product/[id]).
export async function generateStaticParams() {
  try {
    const [listings, users] = await Promise.all([fetchAdminListingsFromDb(), fetchUsersFromDb()]);
    const allItems = [...MOCK_FEATURED_PRODUCTS, ...(listings || [])];
    const sellerIds = allItems.map((p) => p.sellerId || p.seller?.id).filter(Boolean);
    const userIds = (users || []).map((u) => u.id).filter(Boolean);
    const uniqueIds = Array.from(new Set(['_shell', ...sellerIds, ...userIds]));
    return uniqueIds.map((id) => ({ id: String(id) }));
  } catch (err) {
    return [{ id: '_shell' }];
  }
}

// Mirrors SellerProfileClient's resolution: a real Firestore user profile
// first, falling back to the seller info embedded in one of their listings
// (covers mock/legacy sellers that never had their own `users` doc).
const resolveSeller = cache(async (id) => {
  if (!id || id === '_shell') return null;

  const [userDoc, dbListings] = await Promise.all([
    getUserProfileFromDb(id),
    fetchAdminListingsFromDb(),
  ]);
  const allListings = [...MOCK_FEATURED_PRODUCTS, ...(dbListings || [])];
  const fallbackSellerInfo = allListings.find(
    (p) => p.sellerId === id || p.seller?.id === id
  )?.seller || null;

  if (!userDoc && !fallbackSellerInfo) return null;

  return {
    name: userDoc?.name || fallbackSellerInfo?.name || 'Vendeur TanitMarket',
    avatar: userDoc?.avatarUrl || fallbackSellerInfo?.avatar || '',
    location: userDoc?.location || fallbackSellerInfo?.location || '',
    bio: userDoc?.bio || '',
  };
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const seller = await resolveSeller(id);

  if (!seller) {
    return {
      title: 'Vendeur introuvable',
      robots: { index: false, follow: true },
    };
  }

  const title = `${seller.name} - Vendeur ${SITE_NAME}`;
  const description = truncate(
    seller.bio || `Profil vendeur de ${seller.name} sur ${SITE_NAME}${seller.location ? `, ${seller.location}` : ''}.`,
    160
  );
  const url = absoluteUrl(`/seller/${id}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      title,
      description,
      siteName: SITE_NAME,
      images: seller.avatar ? [{ url: seller.avatar, alt: seller.name }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: seller.avatar ? [seller.avatar] : undefined,
    },
  };
}

export default function SellerProfilePage() {
  return <SellerProfileClient />;
}
