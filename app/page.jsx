import HomeClient from '@/components/home/HomeClient';

// Server entry: the interactive home (URL-synced filters, live listings,
// favourites) lives in HomeClient. It needs no Suspense boundary of its own —
// the only hook that opts out of prerendering, useSearchParams, is isolated
// inside HomeClient behind its own boundary, so the hero, the categories and
// the banners are prerendered into the static HTML for crawlers.
export default function LandingPage() {
  return <HomeClient />;
}
