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

import Script from 'next/script';

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
  metadataBase: new URL('https://sahimed.com'),
  title: {
    default: 'SahiMed - Sahi Dawai, Sahi Daam Pe',
    template: '%s | SahiMed'
  },
  description: 'SahiMed - Clinical Healthcare Pharmacy. High-quality medicine delivery at the right price. Sahi Dawai, Sahi Daam Pe.',
  keywords: ['online pharmacy', 'medicine delivery', 'healthcare', 'affordable medicines', 'SahiMed', 'clinical pharmacy India'],
  authors: [{ name: 'SahiMed Team' }],
  creator: 'SahiMed',
  publisher: 'SahiMed',
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sahimed.com',
    siteName: 'SahiMed',
    title: 'SahiMed - Sahi Dawai, Sahi Daam Pe',
    description: 'Get high-quality medicines delivered to your doorstep at the best prices. SahiMed is your trusted clinical healthcare partner.',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'SahiMed Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SahiMed - Sahi Dawai, Sahi Daam Pe',
    description: 'Affordable medicines and clinical healthcare delivery.',
    images: ['/icon.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SahiMed',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Increased for accessibility (SXO)
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#7C3AED',
};

import { getDbAdmin } from '@/lib/firebase-admin';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch pages for footer on the server to prevent syncing delay
  let initialPages: any[] = [];
  try {
    const dbAdmin = getDbAdmin();
    // Only attempt fetch if we have a valid admin instance
    if (dbAdmin) {
      const snapshot = await dbAdmin.collection('pages').orderBy('lastUpdated', 'desc').get();
      initialPages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
      }));
    } else {
      console.log("[RootLayout] Firebase Admin not available. Footer will use client-side fallback.");
    }
  } catch (error) {
    // Only log if it's NOT the project ID error we already expect during build
    if (!(error instanceof Error && error.message.includes('Project Id'))) {
      console.error("Error fetching pages for layout footer:", error);
    }
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SahiMed',
    url: 'https://sahimed.com',
    logo: 'https://sahimed.com/icon.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 7349499898',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: 'en',
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SahiMed',
    url: 'https://sahimed.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://sahimed.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const pharmacyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    name: 'SahiMed',
    image: 'https://sahimed.com/icon.png',
    '@id': 'https://sahimed.com',
    url: 'https://sahimed.com',
    telephone: '+91 7349499898',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      opens: '00:00',
      closes: '23:59',
    },
  };

  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable}`}>
      <head>
        {/* Critical Resource Hints */}
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Script
          id="pharmacy-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pharmacyJsonLd) }}
        />
      </head>
      <body className="font-outfit antialiased bg-[#F8FAFC]">
        <FirebaseClientProvider>
          <CartProvider>
            <LocationSync />
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
                <Footer initialPages={initialPages} />
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