import { cache } from 'react';
import ProductDetailClient from './ProductDetailClient';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { fetchAdminListingsFromDb } from '@/lib/firestoreService';
import { normalizeStatus } from '@/lib/services/listingsService';
import { absoluteUrl, truncate, SITE_NAME } from '@/lib/seo';

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

  const price = product.isFree ? 0 : product.price;
  const priceLabel = product.isFree ? 'Gratuit' : `${price} TND`;
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
    other: {
      'product:price:amount': String(price ?? ''),
      'product:price:currency': 'TND',
    },
  };
}

function buildProductJsonLd(product, id) {
  const price = product.isFree ? 0 : product.price;
  const image = product.images?.length ? product.images : [product.image].filter(Boolean);

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
      priceCurrency: 'TND',
      price: String(price ?? 0),
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
