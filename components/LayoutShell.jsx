"use client";
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import InstallPwaPrompt from '@/components/InstallPwaPrompt';
import NotificationPermissionPrompt from '@/components/NotificationPermissionPrompt';

// reducedMotion="user": under prefers-reduced-motion, framer-motion skips
// transform/layout animations app-wide and keeps only opacity fades.
export default function LayoutShell({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <Shell>{children}</Shell>
    </MotionConfig>
  );
}

function Shell({ children }) {
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
        <MobileBottomNav />
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
      <MobileBottomNav />
      <InstallPwaPrompt />
      <NotificationPermissionPrompt />
    </>
  );
}
