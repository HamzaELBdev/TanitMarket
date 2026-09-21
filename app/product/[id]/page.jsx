import { cache } from 'react';
import ProductDetailClient from './ProductDetailClient';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { fetchAdminListingsFromDb } from '@/lib/firestoreService';
import { normalizeStatus } from '@/lib/services/listingsService';
import { absoluteUrl, truncate, SITE_NAME } from '@/lib/seo';
import { getPriceInfo } from '@/lib/priceInfo';

// Shared across generateStaticParams/generateMetadata for this build pass.
const getAllListings = cache(async () => {
  try {
    const dbListings = await fetchAdminListingsFromDb();
    return [...MOCK_FEATURED_PRODUCTS, ...(dbListings || [])];
  } catch (err) {
    return MOCK_FEATURED_PRODUCTS;
  }
});

export async function generateStaticParams() {
  const allItems = await getAllListings();
  const uniqueIds = Array.from(new Set(allItems.map(p => String(p.id)).filter(Boolean)));
  return uniqueIds.map(id => ({ id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const allItems = await getAllListings();
  const product = allItems.find((p) => String(p.id) === String(id));

  if (!product) {
    return {
      title: 'Annonce introuvable',
      robots: { index: false, follow: true },
    };
  }

  const priceInfo = getPriceInfo(product);
  const priceLabel = priceInfo.isFree ? 'Gratuit' : (priceInfo.hasAmount ? `${priceInfo.amount} TND` : 'Prix à négocier');
  const title = `${product.title} - ${priceLabel}`;
  const description = truncate(
    product.description || `${product.title} à vendre sur ${SITE_NAME}. ${product.location || 'Tunisie'}.`,
    160
  );
  const image = product.images?.[0] || product.image;
  const url = absoluteUrl(`/product/${id}`);
  const isApproved = normalizeStatus(product.status, 'approved') === 'approved';

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isApproved ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: SITE_NAME,
      images: image ? [{ url: image, alt: product.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    // Never send a raw price amount for a negotiable listing with no set
    // price — that would tell scrapers/Facebook the item is worth 0.
    other: priceInfo.hasAmount || priceInfo.isFree ? {
      'product:price:amount': String(priceInfo.amount),
      'product:price:currency': 'TND',
    } : undefined,
  };
}

function buildProductJsonLd(product, id) {
  const priceInfo = getPriceInfo(product);
  const image = product.images?.length ? product.images : [product.image].filter(Boolean);
  // A negotiable listing with no set amount has no real price to publish —
  // omit the Offer's price rather than fabricate "0", which would read as
  // literally free to Google's rich-snippet parser.
  const hasKnownPrice = priceInfo.isFree || priceInfo.hasAmount;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || product.title,
    image,
    category: product.category || undefined,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${id}`),
      ...(hasKnownPrice ? { priceCurrency: 'TND', price: String(priceInfo.amount) } : {}),
      availability: 'https://schema.org/InStock',
      itemCondition: product.condition === 'Neuf'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
      areaServed: product.location || 'Tunisie',
      seller: product.seller?.name ? {
        '@type': 'Person',
        name: product.seller.name,
      } : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const allItems = await getAllListings();
  const product = allItems.find((p) => String(p.id) === String(id));

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(product, id)) }}
        />
      )}
      <ProductDetailClient />
    </>
  );
}
