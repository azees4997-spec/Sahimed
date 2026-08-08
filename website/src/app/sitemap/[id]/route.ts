import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('sahimed');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    if (id === 'pages.xml') {
      const staticPages = ['', '/medicines', '/about-us', '/privacy-policy', '/terms', '/contact-us'];
      staticPages.forEach(p => {
        xml += `  <url>\n`;
        xml += `    <loc>https://sahimed.com${p}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n`;
        xml += `  </url>\n`;
      });
    } else if (id === 'categories.xml') {
      const categories = ['analgesics', 'cardiac-care', 'anti-diabetic', 'gastrointestinal', 'vitamins-supplements', 'dermatology'];
      categories.forEach(c => {
        xml += `  <url>\n`;
        xml += `    <loc>https://sahimed.com/medicines/${c}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });
    } else {
      // e.g. products-1.xml -> pageNum = 1
      const pageNum = parseInt(id.replace('products-', '').replace('.xml', ''), 10) || 1;
      const limit = 5000;
      const skip = (pageNum - 1) * limit;

      const products = await db.collection('Product Master')
        .find({}, { projection: { 'seo.url_slug': 1, product_id: 1 } })
        .skip(skip)
        .limit(limit)
        .toArray();

      products.forEach(p => {
        const slug = p.seo?.url_slug || `/product/${p.product_id || p._id.toString()}`;
        const cleanSlug = slug.startsWith('/') ? slug : `/${slug}`;
        xml += `  <url>\n`;
        xml += `    <loc>https://sahimed.com${cleanSlug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: any) {
    return new NextResponse(`<error>${err.message}</error>`, { status: 500 });
  }
}
