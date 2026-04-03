import type {Metadata, Viewport} from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import MobileCartBar from '@/components/MobileCartBar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { Outfit, Poppins } from 'next/font/google';
import LocationSync from '@/components/LocationSync';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SahiMed - Sahi Dawai, Sahi Daam Pe',
    template: '%s | SahiMed'
  },
  description: 'SahiMed - Clinical Healthcare Pharmacy. High-quality medicine delivery at the right price. Sahi Dawai, Sahi Daam Pe.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SahiMed',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#7C3AED',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable}`}>
      <body className="font-outfit antialiased bg-[#F8FAFC]">
        <FirebaseClientProvider>
          <CartProvider>
            <LocationSync />
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
                <Footer />
              </main>
              <BottomNav />
              <MobileCartBar />
            </div>
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}