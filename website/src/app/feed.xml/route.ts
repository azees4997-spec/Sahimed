import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: any) {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/g, '');
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sahimed.com';

    // 1. Fetch latest 20 active products
    const products = await db.collection('products')
      .find({ isActive: { $ne: false } })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(20)
      .toArray();

    // 2. Fetch latest 10 blog articles
    const articles = await db.collection('seo_content')
      .find({})
      .sort({ updatedAt: -1, _id: -1 })
      .limit(10)
      .toArray();

    const feedItems: Array<{
      title: string;
      link: string;
      description: string;
      pubDate: Date;
      guid: string;
    }> = [];

    // Process products
    for (const p of products) {
      const id = p._id?.toString();
      if (!id || !p.name) continue;
      
      const price = p.liveData?.sahimed_price || p.price || 0;
      const manufacturer = p.manufacturer || p.marketer_name || 'Sahimed';

      feedItems.push({
        title: `Buy ${p.name} - ₹${price}`,
        link: `${baseUrl}/product/${id}`,
        description: p.description || `Purchase ${p.name} by ${manufacturer} online at Sahimed. Best savings guaranteed.`,
        pubDate: p.updatedAt || p.createdAt || new Date(),
        guid: `${baseUrl}/product/${id}`,
      });
    }

    // Process articles
    for (const a of articles) {
      if (!a.title || !a.slug) continue;

      feedItems.push({
        title: a.title,
        link: `${baseUrl}/blog/${a.slug}`,
        description: a.metaDescription || a.summary || `Read our latest health article: ${a.title} on Sahimed.`,
        pubDate: a.updatedAt || a.createdAt || new Date(),
        guid: `${baseUrl}/blog/${a.slug}`,
      });
    }

    // Sort combined items by publication date desc
    feedItems.sort((x, y) => y.pubDate.getTime() - x.pubDate.getTime());

    const itemsXml = feedItems.map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sahimed - Authentic Medicines &amp; Healthcare Savings</title>
    <link>${baseUrl}</link>
    <description>Authentic medicines, healthcare products, and wellness essentials delivered to your doorstep. Best prices guaranteed at Sahimed.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    console.error('[RSS Feed Generation Error]', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
