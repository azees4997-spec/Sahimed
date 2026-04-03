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
  title: 'SahiMed | Clinical Healthcare Pharmacy',
  description: 'SahiMed Pharmacy - High-end healthcare solutions and medicine delivery at the right price. Sahi Dawai, Sahi Daam Pe.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SahiMed',
  },
  formatDetection: {
    telephone: false,
  },
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
          <LocationSync />
          <CartProvider>
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