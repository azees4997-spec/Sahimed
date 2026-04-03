import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const products = await db.collection('products').find({}).toArray();

    const headers = [
      'id', 'name', 'sku', 'manufacturer', 'category', 'isGeneric', 'prescriptionRequired', 'packSize', 'imageUrl', 'description', 'treatment', 
      'safetyAdvice', 'howToUse', 'saltComposition', 'pregnancyInteraction', 'lactationInteraction', 'drivingInteraction', 'kidneyInteraction', 'liverInteraction',
      'clinicalTabLabel', 'safetyTabLabel', 'matrixTabLabel'
    ];

    const csvContent = [
      headers.join(','),
      ...products.map(p => {
        return headers.map(h => {
          let val = p[h] || p.liveData?.[h] || '';
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

    // INTELLIGENT MAPPING: Fetch molecules for auto-linking based on saltComposition
    const allMolecules = await moleculesCol.find({}).toArray();

    const preparedProducts = products.map((p: any) => {
      let moleculeId = p.moleculeId;

      // If missing moleculeId, try to find a match in the moleculeMaster
      if (!moleculeId && p.saltComposition) {
        const match = allMolecules.find(m => 
          p.saltComposition.toLowerCase().includes((m.molecule || m.name || "").toLowerCase()) ||
          (m.molecule || m.name || "").toLowerCase().includes(p.saltComposition.toLowerCase())
        );
        if (match) {
          moleculeId = match._id || match.id;
        }
      }

      return {
        ...p,
        _id: p.id || p._id,
        moleculeId,
        updatedAt: new Date()
      };
    });

    // Bulk Write
    const ops = preparedProducts.map((p: any) => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: p },
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
