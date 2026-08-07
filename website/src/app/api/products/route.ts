import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { PRODUCTS } from '@/lib/data';
import { correctMedicalQuery, buildFuzzyRegex, sanitizeSearchQuery } from '@/lib/typo-corrector';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================
// COLLECTION: "Product Master"
// SCHEMA (nested):
//   product_id, product_name, molecule_code, medicine_type, salable_status
//   taxonomy.{ marketer_id, marketer_name, category_id, category_name, sub_category, disease_tags }
//   packaging.{ package_type, product_form, package_quantity, packaging_detail, mrp }
//   medical_info.{ composition, primary_use, introduction, benefits, how_to_use, side_effects, ... }
//   safety_warnings.{ is_rx_required, is_controlled_substance, interactions }
//   images[] (array of URLs)
//   seo.{ url_slug, seo_title, seo_description, search_keywords }
// ============================================================

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Fast warm-up ping — called on page load to keep function warm
  if (searchParams.get('ping') === '1') {
    try {
      const client = await clientPromise;
      await client.db('sahimed').command({ ping: 1 });
    } catch {}
    return NextResponse.json({ ok: true });
  }

  let limitValue = parseInt(searchParams.get('limit') || '50');
  if (isNaN(limitValue) || limitValue < 1) limitValue = 50;
  if (limitValue > 5000) limitValue = 5000;

  const category = searchParams.get('category') || searchParams.get('c');
  const qStr = searchParams.get('q');
  const moleculeCode = searchParams.get('moleculeId') || searchParams.get('molecule_code');
  const isGeneric = searchParams.get('isGeneric');
  const marketerName = searchParams.get('marketerName');
  const dosageForm = searchParams.get('dosageForm');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const showDisabled = searchParams.get('showDisabled') === 'true';

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    const query: any = {};

    // Only show salable products to non-admins
    if (!showDisabled) {
      query.salable_status = { $regex: 'Salable', $options: 'i' };
    } else {
      try {
        await verifyAdmin(request);
        // Admin: show all products (no salable_status filter)
      } catch {
        query.salable_status = { $regex: 'Salable', $options: 'i' };
      }
    }

    // Category filter (handles category name, sub-category, or OTC/Generic medicine_type)
    if (category) {
      const catRegex = new RegExp(escapeRegExp(category), 'i');
      query.$or = [
        { 'taxonomy.category_name': catRegex },
        { 'taxonomy.sub_category': catRegex },
        { medicine_type: catRegex }
      ];
    }

    // Marketer/manufacturer filter
    if (marketerName) {
      const names = marketerName.split(',').map(n => n.trim()).filter(Boolean);
      query['taxonomy.marketer_name'] = { $in: names.map(n => new RegExp(escapeRegExp(n), 'i')) };
    }

    // Dosage form filter
    if (dosageForm) {
      const forms = dosageForm.split(',').map(f => f.trim()).filter(Boolean);
      query['packaging.product_form'] = { $in: forms.map(f => new RegExp(escapeRegExp(f), 'i')) };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['packaging.mrp'] = {};
      if (minPrice) query['packaging.mrp'].$gte = parseFloat(minPrice);
      if (maxPrice) query['packaging.mrp'].$lte = parseFloat(maxPrice);
    }

    // Generic filter (medicine_type === 'Generic')
    if (isGeneric !== null && isGeneric !== undefined) {
      if (isGeneric === 'true') {
        query.medicine_type = { $regex: 'generic', $options: 'i' };
      }
    }

    // Molecule code filter
    if (moleculeCode) {
      query.molecule_code = moleculeCode;
    }

    let terms: string[] = [];
    let andConditions: any[] = [];
    let correctedQueryText = '';
    let wasAutoCorrected = false;
    let effectiveQuery = qStr || ''; // declared here so it's in scope for scoring below

    // Full-text search across product_name and composition with Typo-Correction & Punctuation Stripping (- ( ) / +)
    if (qStr) {
      const sanitized = sanitizeSearchQuery(qStr);
      const correction = correctMedicalQuery(sanitized);
      if (correction.wasCorrected) {
        wasAutoCorrected = true;
        correctedQueryText = correction.correctedQuery;
      }

      effectiveQuery = correction.wasCorrected ? correction.correctedQuery : (sanitized || qStr);
      terms = effectiveQuery.split(/\s+/).filter(t => t.length > 0);

      if (terms.length > 0) {
        const makeMatchAll = (fieldName: string) => ({
          $and: terms.map(t => ({ [fieldName]: { $regex: escapeRegExp(t), $options: 'i' } }))
        });

        const cleanSearchStr = escapeRegExp(effectiveQuery);

        andConditions.push({
          $or: [
            makeMatchAll('product_name'),
            makeMatchAll('medical_info.composition'),
            { product_id: { $regex: cleanSearchStr, $options: 'i' } },
            { molecule_code: { $regex: cleanSearchStr, $options: 'i' } },
            { 'taxonomy.marketer_name': { $regex: cleanSearchStr, $options: 'i' } },
          ]
        });
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const cleanTerm = (effectiveQuery || qStr || '').trim();
    const cleanEscaped = escapeRegExp(cleanTerm);

    let products: any[] = [];
    if (cleanTerm) {
      // 1. Primary: Fast indexed $text search (~30-80ms)
      try {
        products = await col
          .find({ ...query, $text: { $search: cleanTerm } })
          .sort({ score: { $meta: "textScore" } })
          .limit(limitValue)
          .toArray();
      } catch (e) {
        products = [];
      }

      // 2. Fallback / Fill up: Indexed regex prefix & composition search
      if (products.length < limitValue) {
        try {
          const prefixProducts = await col
            .find({
              ...query,
              product_name: { $regex: `^${cleanEscaped}`, $options: 'i' }
            })
            .limit(limitValue)
            .toArray();

          const compositionProducts = await col
            .find({
              ...query,
              'medical_info.composition': { $regex: cleanEscaped, $options: 'i' }
            })
            .limit(limitValue)
            .toArray();

          const existingMap = new Map();
          products.forEach(p => existingMap.set(p._id.toString(), p));
          prefixProducts.forEach(p => existingMap.set(p._id.toString(), p));
          compositionProducts.forEach(p => existingMap.set(p._id.toString(), p));
          products = Array.from(existingMap.values()).slice(0, limitValue);
        } catch (e) {
          console.error('[Indexed Search Fallback Error]', e);
        }
      }
    } else {
      products = await col.find(query).limit(limitValue).toArray();
    }

    // Typo-tolerant character-distance fuzzy fallback if 0 results found
    if (products.length === 0 && qStr && terms.length > 0) {
      const fuzzyQuery = {
        ...query,
        $and: undefined,
        $or: terms.flatMap(t => [
          { product_name: { $regex: buildFuzzyRegex(t), $options: 'i' } },
          { 'medical_info.composition': { $regex: buildFuzzyRegex(t), $options: 'i' } },
        ])
      };
      delete fuzzyQuery.$and;
      products = await col
        .find(fuzzyQuery)
        .sort({ product_name: 1 })
        .limit(limitValue)
        .toArray();

      if (products.length > 0 && !wasAutoCorrected) {
        wasAutoCorrected = true;
        correctedQueryText = products[0].product_name;
      }
    }

    // Log search analytics asynchronously
    if (qStr && qStr.length >= 2) {
      try {
        db.collection('searchAnalytics').insertOne({
          keyword: qStr,
          userId: searchParams.get('userId') || null,
          mobile: searchParams.get('mobile') || 'Anonymous',
          platform: request.headers.get('user-agent')?.includes('Dart') ? 'mobile' : 'web',
          resultsCount: products.length,
          timestamp: new Date(),
          autoCaptured: true
        }).catch(err => console.error('[Analytics Background Error]', err));
      } catch (e) {}
    }

    let molecules: any[] = [];
    if (cleanTerm && cleanTerm.length >= 2) {
      try {
        molecules = await db.collection('Molecule Master')
          .find({ Composition: { $regex: cleanEscaped, $options: 'i' } })
          .limit(5)
          .toArray();
      } catch (e) {
        console.error('[Molecule Master Search Error]', e);
      }
    }

    const normalizedMolecules = molecules.map(m => ({
      _id: m._id?.toString() || m['Molecule Code'],
      id: m._id?.toString() || m['Molecule Code'],
      _type: 'molecule',
      molecule: m.Composition,
      name: m.Composition,
      composition: m.Composition,
      moleculeCode: m['Molecule Code'],
      productForm: m['Product Form']
    }));

    // Normalize output to maintain compatibility with frontend
    const normalizedProducts = products.map(p => ({
      ...p,
      id: p._id?.toString(),
      _type: 'medicine',
      name: p.product_name,
      sku: p.product_id,
      manufacturer: p.taxonomy?.marketer_name,
      category: p.taxonomy?.category_name,
      saltComposition: p.medical_info?.composition,
      composition: p.medical_info?.composition,
      price: p.packaging?.mrp,
      mrp: p.packaging?.mrp,
      imageUrl: p.images?.[0] || '',
      prescriptionRequired: p.safety_warnings?.is_rx_required,
      treatment: p.medical_info?.primary_use,
      howToUse: p.medical_info?.how_to_use,
      packSize: p.packaging?.packaging_detail,
      moleculeId: p.molecule_code,
    }));

    const finalResults = [...normalizedMolecules, ...normalizedProducts];

    return NextResponse.json(finalResults, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });

  } catch (err: any) {
    console.error('[Products API Error]', err);
    // Fallback to static data
    let fallbackProducts = PRODUCTS.map((p, idx) => ({
      ...p, _id: p.id || `fallback-prod-${idx}`, name: p.name, isFallback: true
    }));
    if (category) fallbackProducts = fallbackProducts.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    if (qStr) {
      const t = qStr.toLowerCase().split(/\s+/).filter(Boolean);
      fallbackProducts = fallbackProducts.filter(p => t.every(term => p.name.toLowerCase().includes(term)));
    }
    return NextResponse.json(fallbackProducts.slice(0, limitValue));
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');

    const { id, _id, ...rest } = body;
    const productData = {
      ...rest,
      _id: (id || _id) as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('Product Master').insertOne(productData);
    return NextResponse.json({ success: true, insertedId: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
