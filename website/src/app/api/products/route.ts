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

    // Build base filter query (without search terms) for Atlas $search $match stage
    const baseFilterQuery = { ...query };

    // Category filter (handles category name, sub-category, or OTC/Generic medicine_type)
    if (category) {
      const catRegex = new RegExp(escapeRegExp(category), 'i');
      query.$or = [
        { 'taxonomy.category_name': catRegex },
        { 'taxonomy.sub_category': catRegex },
        { medicine_type: catRegex }
      ];
      baseFilterQuery.$or = query.$or;
    }

    // Marketer/manufacturer filter
    if (marketerName) {
      const names = marketerName.split(',').map(n => n.trim()).filter(Boolean);
      query['taxonomy.marketer_name'] = { $in: names.map(n => new RegExp(escapeRegExp(n), 'i')) };
      baseFilterQuery['taxonomy.marketer_name'] = query['taxonomy.marketer_name'];
    }

    // Dosage form filter
    if (dosageForm) {
      const forms = dosageForm.split(',').map(f => f.trim()).filter(Boolean);
      query['packaging.product_form'] = { $in: forms.map(f => new RegExp(escapeRegExp(f), 'i')) };
      baseFilterQuery['packaging.product_form'] = query['packaging.product_form'];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['packaging.mrp'] = {};
      if (minPrice) query['packaging.mrp'].$gte = parseFloat(minPrice);
      if (maxPrice) query['packaging.mrp'].$lte = parseFloat(maxPrice);
      baseFilterQuery['packaging.mrp'] = query['packaging.mrp'];
    }

    // Generic filter (medicine_type === 'Generic')
    if (isGeneric !== null && isGeneric !== undefined) {
      if (isGeneric === 'true') {
        query.medicine_type = { $regex: 'generic', $options: 'i' };
        baseFilterQuery.medicine_type = query.medicine_type;
      }
    }

    // Molecule code filter (handles both MOL... codes and 24-char ObjectId references)
    if (moleculeCode) {
      if (moleculeCode.startsWith('MOL')) {
        query.molecule_code = moleculeCode;
      } else {
        try {
          const { ObjectId } = require('mongodb');
          let molDoc = null;
          try {
            molDoc = await db.collection('Molecule Master').findOne({ _id: new ObjectId(moleculeCode) });
          } catch {
            molDoc = await db.collection('Molecule Master').findOne({ _id: moleculeCode });
          }
          if (molDoc) {
            const resolvedCode = molDoc['Molecule Code'] || molDoc.molecule_code;
            const comp = molDoc.Composition;
            const firstSalts = comp ? comp.split('+')[0].split('(')[0].trim() : '';
            query.$or = [
              { molecule_code: resolvedCode },
              { 'medical_info.composition': { $regex: escapeRegExp(firstSalts || comp), $options: 'i' } }
            ];
          } else {
            query.molecule_code = moleculeCode;
          }
        } catch (e) {
          query.molecule_code = moleculeCode;
        }
      }
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
            { 'taxonomy.disease_tags': { $regex: cleanSearchStr, $options: 'i' } },
            { 'medical_info.primary_use': { $regex: cleanSearchStr, $options: 'i' } },
          ]
        });
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Standard list projection for ultra-fast light payloads (95% reduction)
    const listProjection = {
      product_id: 1, product_name: 1, molecule_code: 1, molecule_id: 1, medicine_type: 1,
      is_generic: 1, isGeneric: 1, salable_status: 1, selling_price: 1, sale_price: 1,
      'taxonomy.marketer_name': 1, 'taxonomy.category_name': 1, 'medical_info.composition': 1,
      'medical_info.primary_use': 1, 'medical_info.how_to_use': 1, 'packaging.packaging_detail': 1,
      'packaging.mrp': 1, 'packaging.product_form': 1, 'packaging.package_quantity': 1,
      images: 1, 'seo.url_slug': 1, 'safety_warnings.is_rx_required': 1
    };

    let products: any[] = [];
    if (cleanTerm) {
      // 1. Parallel High-Speed Indexed Search across Product Name Prefix, Full Contains & Active Salt Composition (<15ms)
      try {
        const [prefixName, containsName, compositionMatch] = await Promise.all([
          col.find(
            { ...baseFilterQuery, product_name: { $regex: `^${cleanEscaped}`, $options: 'i' } },
            { projection: listProjection }
          ).limit(limitValue).toArray(),
          col.find(
            { ...baseFilterQuery, product_name: { $regex: cleanEscaped, $options: 'i' } },
            { projection: listProjection }
          ).limit(limitValue).toArray(),
          col.find(
            { ...baseFilterQuery, 'medical_info.composition': { $regex: cleanEscaped, $options: 'i' } },
            { projection: listProjection }
          ).limit(limitValue).toArray()
        ]);

        const resultMap = new Map();
        prefixName.forEach(p => resultMap.set(p._id.toString(), p));
        containsName.forEach(p => resultMap.set(p._id.toString(), p));
        compositionMatch.forEach(p => resultMap.set(p._id.toString(), p));
        products = Array.from(resultMap.values()).slice(0, limitValue);
      } catch (e) {
        console.error('[Indexed Multi-Stage Search Error]', e);
      }

      // 2. Atlas $search pipeline fallback if B-Tree search returned fewer items
      if (products.length < limitValue) {
        try {
          const atlasSearchRes = await col.aggregate([
            {
              $search: {
                index: 'default',
                text: {
                  query: cleanTerm,
                  path: ['product_name', 'medical_info.composition'],
                  fuzzy: { maxEdits: 2, prefixLength: 0 }
                }
              }
            },
            { $match: baseFilterQuery },
            { $limit: limitValue },
            { $project: listProjection }
          ]).toArray();

          const resultMap = new Map();
          products.forEach(p => resultMap.set(p._id.toString(), p));
          atlasSearchRes.forEach(p => resultMap.set(p._id.toString(), p));
          products = Array.from(resultMap.values()).slice(0, limitValue);
        } catch (e) {
          // Atlas search optional fallback failure silently ignored
        }
      }
    } else {
      products = await col.find(baseFilterQuery, { projection: listProjection }).limit(limitValue).toArray();
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

    // Find all molecule codes that actually have a Generic product mapped in MongoDB
    const molCodes = products
      .map(p => p.molecule_code || p.molecule_id)
      .filter((code): code is string => Boolean(code));
      
    let genericMolSet = new Set<string>();
    if (molCodes.length > 0) {
      try {
        const genericDocs = await col.distinct('molecule_code', {
          molecule_code: { $in: molCodes },
          $or: [
            { medicine_type: { $regex: 'generic', $options: 'i' } },
            { is_generic: true }
          ]
        });
        genericMolSet = new Set(genericDocs.map(c => String(c)));
      } catch (e) {
        console.error('[Generic Mapping Lookup Error]', e);
      }
    }

    // Normalize output to maintain compatibility with frontend
    const normalizedProducts = products.map(p => {
      const code = p.molecule_code || p.molecule_id;
      const isGen = (p.medicine_type || '').toLowerCase().includes('generic') || p.is_generic === true || p.isGeneric === true;
      const hasGenericMapped = isGen || (code ? genericMolSet.has(code) : false);

      return {
        ...p,
        id: p._id?.toString(),
        _type: 'medicine',
        name: p.product_name,
        sku: p.product_id,
        medicine_type: p.medicine_type || (isGen ? 'Generic' : 'Branded'),
        is_generic: isGen,
        isGeneric: isGen,
        manufacturer: p.taxonomy?.marketer_name,
        category: p.taxonomy?.category_name,
        saltComposition: p.medical_info?.composition,
        composition: p.medical_info?.composition,
        selling_price: p.selling_price ?? p.sale_price ?? p.packaging?.mrp,
        price: p.selling_price ?? p.sale_price ?? p.packaging?.mrp,
        mrp: p.packaging?.mrp,
        imageUrl: p.images?.[0] || p.imageUrl || '',
        prescriptionRequired: p.safety_warnings?.is_rx_required,
        treatment: p.medical_info?.primary_use,
        howToUse: p.medical_info?.how_to_use,
        packSize: p.packaging?.packaging_detail,
        moleculeId: code,
        molecule_code: code,
        hasGenericMapped: hasGenericMapped,
      };
    });

    const finalResults = [...normalizedMolecules, ...normalizedProducts];

    return NextResponse.json(finalResults, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      },
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
