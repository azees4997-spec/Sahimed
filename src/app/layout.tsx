import type {Metadata, Viewport} from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import MobileCartBar from '@/components/MobileCartBar';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'SahiMed | sahi dawa sahi daam pe',
  description: 'SahiMed Pharmacy - High-end healthcare solutions and medicine delivery at the right price.',
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
  themeColor: '#0056b3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#F8F8F8]">
        <FirebaseClientProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <div className="flex-1 pb-16 sm:pb-0">
                {children}
              </div>
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
