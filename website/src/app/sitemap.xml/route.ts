import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getFirestore, collection as fireCollection, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { INDIAN_CITIES } from '@/lib/city-data';
import { INDIAN_STATES } from '@/lib/state-data';

export const dynamic = 'force-dynamic';

// Initialize Firebase for sitemap generation
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);

function escapeXml(unsafe: any) {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const baseUrl = 'https://sahimed.com';
    const client = await clientPromise;
    const db = client.db('sahimed');
    const urls: string[] = [];

    // 1. Static Routes
    const staticRoutes = [
      { url: baseUrl, changefreq: 'daily', priority: '1.0' },
      { url: `${baseUrl}/categories`, changefreq: 'weekly', priority: '0.9' },
      { url: `${baseUrl}/search`, changefreq: 'daily', priority: '0.9' },
      { url: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.9' },
      { url: `${baseUrl}/prescription`, changefreq: 'monthly', priority: '0.8' },
      { url: `${baseUrl}/login`, changefreq: 'monthly', priority: '0.5' },
    ];

    for (const route of staticRoutes) {
      urls.push(`
  <url>
    <loc>${escapeXml(route.url)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
    }

    // 2. Dynamic Pages (Firestore)
    try {
      const pagesSnap = await getDocs(fireCollection(firestore, 'pages'));
      for (const doc of pagesSnap.docs) {
        const data = doc.data();
        const lastMod = data.updatedAt?.toDate() || data.lastUpdated || new Date();
        urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}/p/${doc.id}`)}</loc>
    <lastmod>${new Date(lastMod).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
      }
    } catch (error) {
      console.error('Error fetching pages for sitemap:', error);
    }

    // 3. Products (MongoDB) - fetching up to 50k products
    try {
      const products = await db.collection('products')
        .find({ isActive: { $ne: false } }, { projection: { _id: 1, name: 1, imageUrl: 1, imageUrls: 1, image: 1, updatedAt: 1 } })
        .limit(50000)
        .toArray();

      for (const product of products) {
        const id = product._id?.toString();
        if (!id) continue;

        const lastMod = product.updatedAt || new Date();
        
        // Resolve product image url
        const rawImages = [
          ...(product.imageUrls || []),
          product.imageUrl,
          product.image
        ].filter(Boolean);

        const absoluteImages = rawImages.map(img => {
          if (typeof img !== 'string') return null;
          if (img.startsWith('http')) return img;
          return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
        }).filter(Boolean) as string[];

        const uniqueImages = Array.from(new Set(absoluteImages));
        const mainImage = uniqueImages[0];

        let imageXml = '';
        if (mainImage) {
          imageXml = `
    <image:image>
      <image:loc>${escapeXml(mainImage)}</image:loc>
      <image:title>${escapeXml(product.name || 'Medicine')}</image:title>
    </image:image>`;
        }

        urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}/product/${id}`)}</loc>
    <lastmod>${new Date(lastMod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imageXml}
  </url>`);
      }
    } catch (error) {
      console.error('Error fetching products for sitemap:', error);
    }

    // 4. Blogs (MongoDB)
    try {
      const articles = await db.collection('seo_content')
        .find({}, { projection: { slug: 1, title: 1, featuredImage: 1, imageUrl: 1, updatedAt: 1 } })
        .toArray();

      for (const article of articles) {
        if (!article.slug) continue;
        const lastMod = article.updatedAt || new Date();
        
        // Resolve blog image
        const blogImg = article.featuredImage || article.imageUrl;
        let blogImgXml = '';
        if (blogImg) {
          const absoluteImg = blogImg.startsWith('http') ? blogImg : `${baseUrl}${blogImg.startsWith('/') ? '' : '/'}${blogImg}`;
          blogImgXml = `
    <image:image>
      <image:loc>${escapeXml(absoluteImg)}</image:loc>
      <image:title>${escapeXml(article.title || 'Health Blog')}</image:title>
    </image:image>`;
        }

        urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}/blog/${article.slug}`)}</loc>
    <lastmod>${new Date(lastMod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${blogImgXml}
  </url>`);
      }
    } catch (error) {
      console.error('Error fetching articles for sitemap:', error);
    }

    // 5. City-specific local SEO delivery pages
    for (const city of INDIAN_CITIES) {
      urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}/delivery/${city.id}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    // 5b. State-specific local SEO delivery pages
    for (const state of INDIAN_STATES) {
      urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}/delivery/state/${state.id}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    // 6. Categories (MongoDB)
    try {
      const categories = await db.collection('categories')
        .find({}, { projection: { name: 1, imageUrl: 1, updatedAt: 1 } })
        .toArray();

      for (const category of categories) {
        const lastMod = category.updatedAt || new Date();
        
        let catImgXml = '';
        if (category.imageUrl) {
          const absoluteImg = category.imageUrl.startsWith('http') ? category.imageUrl : `${baseUrl}${category.imageUrl.startsWith('/') ? '' : '/'}${category.imageUrl}`;
          catImgXml = `
    <image:image>
      <image:loc>${escapeXml(absoluteImg)}</image:loc>
      <image:title>${escapeXml(category.name)}</image:title>
    </image:image>`;
        }

        urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}/search?c=${encodeURIComponent(category.name)}`)}</loc>
    <lastmod>${new Date(lastMod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${catImgXml}
  </url>`);
      }
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error);
    }

    // Build complete XML Sitemap
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.join('')}
</urlset>`;

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    console.error('[Sitemap Generation Error]', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
