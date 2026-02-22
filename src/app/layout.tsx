import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'VendorConnect - Commission-Based Marketplace',
  description: 'A platform for vendors to sell products and sellers to earn commissions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-gray-50">
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-200px)]">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
