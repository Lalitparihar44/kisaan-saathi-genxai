'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/nav/sidebar';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password'|| pathname === '/kvk' || pathname === '/kvk/custom-report' ;

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />

      <main className="app-content min-w-0 h-screen overflow-x-hidden bg-gray-50">
        {children}
      </main>
    </>
  );
}
