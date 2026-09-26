import { Suspense } from 'react';
import HomeClient from '@/components/home/HomeClient';

// Server entry: the interactive home (URL-synced filters, live listings,
// favourites) lives in HomeClient; useSearchParams needs the Suspense
// boundary for the static export.
export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
