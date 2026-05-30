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
import { unstable_cache } from 'next/cache';

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
  description: 'SahiMed - Trusted Medical Healthcare Pharmacy. Sahi Dawai, Sahi Daam Pe.',
  keywords: ['online pharmacy', 'medicine delivery', 'healthcare', 'affordable medicines', 'SahiMed', 'pharmacy India'],
  authors: [{ name: 'SahiMed Team' }],
  creator: 'SahiMed',
  publisher: 'SahiMed',
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sahimed.com',
    siteName: 'SahiMed',
    title: 'SahiMed - Sahi Dawai, Sahi Daam Pe',
    description: 'Get high-quality medicines delivered to your doorstep at the best prices. SahiMed is your trusted medical healthcare partner.',
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
    title: 'SahiMed - Trusted Medical Healthcare',
    description: 'Affordable medicines and medical healthcare delivery.',
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
  // [COST FIX] Cache pages server-side for 10 minutes.
  // Without this, every SSR request hit Firestore for the same pages data.
  const getCachedPages = unstable_cache(
    async () => {
      const dbAdmin = getDbAdmin();
      if (!dbAdmin) return [];
      const snapshot = await dbAdmin.collection('pages').orderBy('lastUpdated', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    ['layout-pages'],
    { revalidate: 18000, tags: ['pages'] } // 5-hour server-side cache
  );

  let initialPages: any[] = [];
  try {
    initialPages = await getCachedPages();
  } catch (error) {
    if (!(error instanceof Error && error.message.includes('Project Id'))) {
      console.error('Error fetching pages for layout footer:', error);
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
        
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-WQPC12CLH3`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WQPC12CLH3', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
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