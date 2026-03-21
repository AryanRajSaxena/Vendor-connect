import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import CartToast from '@/components/shared/CartToast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Croww - Commission-Based Marketplace',
  description: 'A platform for vendors to sell products and sellers to earn commissions',
  icons: {
    icon: '/images/icon.jpeg',
    apple: '/images/icon.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-gray-50 antialiased">
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-200px)] pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <CartToast />
        </AuthProvider>
      </body>
    </html>
  );
}
