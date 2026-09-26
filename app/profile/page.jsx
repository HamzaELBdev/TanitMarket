import { Suspense } from 'react';
import AccountPage from '@/components/account/AccountPage';

// Server entry for the account area. Everything below depends on the signed-in
// user (Firebase Auth runs client-side), so the interactive part is a client
// component; the Suspense boundary is required by useSearchParams in the
// static export.
export default function UserProfilePage() {
  return (
    <Suspense fallback={null}>
      <AccountPage />
    </Suspense>
  );
}
