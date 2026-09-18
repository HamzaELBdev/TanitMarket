import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { fetchAdminListingsFromDb } from '@/lib/firestoreService';
import { normalizeStatus } from '@/lib/services/listingsService';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default async function sitemap() {
  let listings = [];
  try {
    const dbListings = await fetchAdminListingsFromDb();
    listings = [...MOCK_FEATURED_PRODUCTS, ...(dbListings || [])];
  } catch (err) {
    listings = MOCK_FEATURED_PRODUCTS;
  }

  const approved = listings.filter((p) => normalizeStatus(p.status, 'approved') === 'approved');
  const uniqueProductIds = Array.from(new Set(approved.map((p) => String(p.id)).filter(Boolean)));
  const uniqueSellerIds = Array.from(new Set(
    approved.map((p) => p.sellerId || p.seller?.id).filter(Boolean)
  ));

  const staticEntries = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
  ];

  const productEntries = uniqueProductIds.map((id) => ({
    url: `${SITE_URL}/product/${id}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const sellerEntries = uniqueSellerIds.map((id) => ({
    url: `${SITE_URL}/seller/${id}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...sellerEntries];
}
