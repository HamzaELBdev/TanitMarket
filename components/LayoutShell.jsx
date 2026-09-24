"use client";
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import InstallPwaPrompt from '@/components/InstallPwaPrompt';
import NotificationPermissionPrompt from '@/components/NotificationPermissionPrompt';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isChat = pathname === '/chat';
  const isAuth = pathname === '/auth';
  const isCreateListing = pathname === '/create-listing';
  // The admin dashboard ships its own chrome (sidebar on desktop, compact
  // top bar on mobile) — keep only the mobile bottom nav from the site shell.
  const isDash = pathname === '/dash';

  if (isChat) {
    return (
      <main className="h-dvh overflow-hidden">
        {children}
      </main>
    );
  }

  if (isDash) {
    return (
      <>
        <main className="min-h-dvh">
          {children}
        </main>
        <MobileNav />
      </>
    );
  }

  if (isAuth || isCreateListing) {
    return (
      <main className="min-h-dvh">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <MobileNav />
      <InstallPwaPrompt />
      <NotificationPermissionPrompt />
    </>
  );
}
