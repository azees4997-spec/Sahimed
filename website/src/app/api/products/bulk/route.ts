import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');
    
    const client = await clientPromise;
    const db = client.db('sahimed');
    const products = await db.collection('products').find({}).toArray();

    const DEFAULT_HEADERS = [
      'name', 'sku', 'manufacturer', 'category', 'isGeneric', 'isBestSeller', 'prescriptionRequired', 'packSize', 'imageUrl', 'imageUrl2', 'imageUrl3', 'description', 'treatment', 
      'safetyAdvice', 'howToUse', 'saltComposition', 'moleculeCode', 'price', 'mrp', 'availableQuantity'
    ];

    const headers = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : DEFAULT_HEADERS;

    const csvContent = [
      headers.join(','),
      ...products.map(p => {
        return headers.map(h => {
          let val = '';
          if (h === 'moleculeCode') {
            val = p.moleculeId || '';
          } else if (h === 'imageUrl2') {
            val = p.imageUrls?.[1] || '';
          } else if (h === 'imageUrl3') {
            val = p.imageUrls?.[2] || '';
          } else {
            val = p[h] ?? '';
          }
          
          if (typeof val === 'string') {
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) val = `"${val}"`;
          }
          return val;
        }).join(',');
      })
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=sahimed_products_export.csv'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const products = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const productsCol = db.collection('products');
    const moleculesCol = db.collection('molecules');

    const allMolecules = await moleculesCol.find({}).toArray();

    const preparedProducts = products.map((p: any) => {
      let moleculeId = p.moleculeId || p.moleculeCode;

      // If missing moleculeId, try to find a match in the moleculeMaster
      if (!moleculeId && p.saltComposition) {
        const match = allMolecules.find(m => 
          p.saltComposition.toLowerCase().includes((m.molecule || m.name || "").toLowerCase()) ||
          (m.molecule || m.name || "").toLowerCase().includes(p.saltComposition.toLowerCase())
        );
        if (match) {
          moleculeId = match.masterId || match._id || match.id;
        }
      }

      const { id, _id, liveData, moleculeCode, imageUrl2, imageUrl3, ...rest } = p;
      
      // Reconstruct imageUrls array
      const imageUrls = [p.imageUrl, imageUrl2, imageUrl3].filter(Boolean);

      return {
        ...rest,
        imageUrls,
        _id: id || _id || p.sku, // Use SKU as _id if missing, or let MongoDB auto-gen if we change the write ops
        moleculeId,
        updatedAt: new Date()
      };
    });

    // Bulk Write using SKU as filter if _id is missing or if we want to ensure upsert by SKU
    const ops = preparedProducts.map((p: any) => ({
      updateOne: {
        filter: { $or: [{ _id: p._id }, { sku: p.sku }] },
        update: { 
          $set: p,
          $unset: { liveData: "", id: "", imageUrl2: "", imageUrl3: "" }
        },
        upsert: true
      }
    }));

    await productsCol.bulkWrite(ops);

    return NextResponse.json({ success: true, count: products.length });
  } catch (err: any) {
    console.error("[Bulk Import Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
