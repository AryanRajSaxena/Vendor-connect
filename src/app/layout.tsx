import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import CartToast from '@/components/shared/CartToast';
import StructuredData from '@/components/seo/StructuredData';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Agent Croww - Commission-Based Digital Marketplace | India',
    template: '%s | Agent Croww',
  },
  description: 'India\'s leading commission-based marketplace for digital products. Vendors list courses, e-books, templates commission-free. Sellers earn on every sale. Join today!',
  keywords: [
    'digital marketplace India',
    'online courses India',
    'commission-based selling',
    'affiliate marketing India',
    'digital products',
    'e-books India',
    'online templates',
    'vendor marketplace',
    'seller platform',
    'passive income India',
    'work from home India',
    'digital downloads',
  ],
  authors: [{ name: 'Rookus' }],
  creator: 'Rookus',
  publisher: 'Agent Croww',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://agentcroww.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Agent Croww - Commission-Based Digital Marketplace',
    description: 'India\'s leading commission-based marketplace for digital products. Vendors list for free, sellers earn commissions, customers get quality products.',
    url: 'https://agentcroww.com',
    siteName: 'Agent Croww',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Agent Croww - Digital Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Croww - Commission-Based Digital Marketplace',
    description: 'Vendors list for free, sellers earn commissions, customers get quality digital products.',
    images: ['/images/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/icon.jpeg',
    apple: '/images/icon.jpeg',
  },
  verification: {
    google: 'PbB119pm3JEQk6l_-1rywW9zlydZTQ6aBSEkBxXOju8',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <StructuredData />
      </head>
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
