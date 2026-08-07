import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// One-time index creation endpoint — call this once then it's safe to leave
// GET /api/admin/create-indexes
export async function GET(request: Request) {
  // Simple secret key check to prevent unauthorized calls
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET && secret !== 'sahimed-index-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    const safe = async (name: string, fn: () => Promise<any>) => {
      try {
        await fn();
        results[name] = '✅ created';
      } catch (e: any) {
        if (e.code === 85 || e.code === 86 || e.message?.includes('already exists') || e.message?.includes('already have')) {
          results[name] = 'ℹ️ already exists';
        } else {
          results[name] = `❌ ERROR: ${e.message}`;
        }
      }
    };

    // ── 1. TEXT index: product_name + composition + disease_tags ─────────────
    // language:'none' = no stemming, no stop-word removal, numbers preserved
    // This is critical for medical names like "5-HTP", "B12", "D3", "500mg"
    await safe('search_text_idx', () =>
      col.createIndex(
        {
          product_name: 'text',
          'medical_info.composition': 'text',
          'taxonomy.disease_tags': 'text',
        },
        {
          name: 'search_text_idx',
          weights: { product_name: 10, 'medical_info.composition': 5, 'taxonomy.disease_tags': 2 },
          default_language: 'none',  // preserve numbers + alphanumeric codes (B12, D3, 5-HTP)
          background: true,
        }
      )
    );

    // ── 2. ASC: product_name ─────────────────────────────────────────────────
    await safe('product_name_asc_idx', () =>
      col.createIndex({ product_name: 1 }, { name: 'product_name_asc_idx', background: true })
    );

    // ── 3. ASC: medical_info.composition ─────────────────────────────────────
    await safe('composition_asc_idx', () =>
      col.createIndex({ 'medical_info.composition': 1 }, { name: 'composition_asc_idx', background: true })
    );

    // ── 4. ASC: taxonomy.disease_tags ─────────────────────────────────────────
    await safe('disease_tags_asc_idx', () =>
      col.createIndex({ 'taxonomy.disease_tags': 1 }, { name: 'disease_tags_asc_idx', background: true })
    );

    // ── 5. COMPOUND: salable_status + product_name ───────────────────────────
    await safe('salable_product_name_idx', () =>
      col.createIndex(
        { salable_status: 1, product_name: 1 },
        { name: 'salable_product_name_idx', background: true }
      )
    );

    // ── 6. ASC: taxonomy.category_name ───────────────────────────────────────
    await safe('category_name_idx', () =>
      col.createIndex({ 'taxonomy.category_name': 1 }, { name: 'category_name_idx', background: true })
    );

    // List final state of all indexes
    const allIndexes = await col.indexes();
    const indexList = allIndexes.map(idx => ({
      name: idx.name,
      key: idx.key,
    }));

    return NextResponse.json({
      success: true,
      message: '🎉 SahiMed indexes created! Search will now be lightning fast.',
      results,
      allIndexes: indexList,
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      results,
    }, { status: 500 });
  }
}
