/**
 * SahiMed — MongoDB Index Creation Script (Updated for Product Master schema)
 *
 * Run with:
 *   SET PATH=C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64;%PATH% && npx tsx scripts/create-indexes.ts
 *
 * Indexes created:
 *   1. TEXT index  — product_name (weight 10) + composition (weight 5) + disease_tags (weight 2)
 *   2. ASC index   — product_name             (for anchored ^regex prefix queries)
 *   3. ASC index   — medical_info.composition (for composition regex search)
 *   4. ASC index   — taxonomy.disease_tags    (for disease tag search)
 *   5. COMPOUND    — salable_status + product_name (every query filters salable first)
 *   6. ASC index   — taxonomy.category_name   (for category filter)
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function safe(label: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`   ✅ ${label}`);
  } catch (e: any) {
    if (e.code === 85 || e.code === 86 || e.message?.includes('already exists') || e.message?.includes('already have')) {
      console.log(`   ℹ️  ${label} — already exists, skipped`);
    } else {
      console.error(`   ❌ ${label} — ERROR: ${e.message}`);
    }
  }
}

async function createIndexes() {
  console.log('\n🚀 SahiMed — MongoDB Index Setup');
  console.log('='.repeat(55));

  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 20000,
    serverSelectionTimeoutMS: 20000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    // ── 1. Full-Text Search Index (product_name + composition + disease_tags) ──
    console.log('📋 TEXT index — product_name + composition + disease_tags:');
    await safe('TEXT index: search_text_idx', () =>
      col.createIndex(
        {
          product_name: 'text',
          'medical_info.composition': 'text',
          'taxonomy.disease_tags': 'text',
        },
        {
          name: 'search_text_idx',
          weights: {
            product_name: 10,
            'medical_info.composition': 5,
            'taxonomy.disease_tags': 2,
          },
          background: true,
        }
      ).then(() => {})
    );

    // ── 2. ASC index on product_name (for ^anchored regex prefix queries) ──────
    console.log('\n📋 ASC index — product_name:');
    await safe('ASC index: product_name_asc_idx', () =>
      col.createIndex(
        { product_name: 1 },
        { name: 'product_name_asc_idx', background: true }
      ).then(() => {})
    );

    // ── 3. ASC index on medical_info.composition ──────────────────────────────
    console.log('\n📋 ASC index — medical_info.composition:');
    await safe('ASC index: composition_asc_idx', () =>
      col.createIndex(
        { 'medical_info.composition': 1 },
        { name: 'composition_asc_idx', background: true }
      ).then(() => {})
    );

    // ── 4. ASC index on taxonomy.disease_tags ─────────────────────────────────
    console.log('\n📋 ASC index — taxonomy.disease_tags:');
    await safe('ASC index: disease_tags_asc_idx', () =>
      col.createIndex(
        { 'taxonomy.disease_tags': 1 },
        { name: 'disease_tags_asc_idx', background: true }
      ).then(() => {})
    );

    // ── 5. COMPOUND index: salable_status + product_name ─────────────────────
    // Every query filters salable_status first — compound cuts the scan set fast
    console.log('\n📋 COMPOUND index — salable_status + product_name:');
    await safe('COMPOUND index: salable_product_name_idx', () =>
      col.createIndex(
        { salable_status: 1, product_name: 1 },
        { name: 'salable_product_name_idx', background: true }
      ).then(() => {})
    );

    // ── 6. ASC index on taxonomy.category_name ────────────────────────────────
    console.log('\n📋 ASC index — taxonomy.category_name:');
    await safe('ASC index: category_name_idx', () =>
      col.createIndex(
        { 'taxonomy.category_name': 1 },
        { name: 'category_name_idx', background: true }
      ).then(() => {})
    );

    // ── List all indexes for confirmation ──────────────────────────────────────
    console.log('\n📊 All indexes on "Product Master":');
    const indexes = await col.indexes();
    indexes.forEach((idx, i) => {
      const fields = Object.entries(idx.key).map(([k, v]) => `${k}: ${v}`).join(', ');
      console.log(`   ${i + 1}. [${idx.name}]  { ${fields} }`);
    });

    console.log('\n🎉 Done! SahiMed search should now respond in <100ms.');
    console.log('='.repeat(55));

  } catch (err: any) {
    console.error('\n❌ Fatal connection error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 MongoDB connection closed.\n');
    process.exit(0);
  }
}

createIndexes();
