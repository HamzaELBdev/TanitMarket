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

  if (isChat) {
    return (
      <main className="h-dvh overflow-hidden">
        {children}
      </main>
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
