
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const products = await db.collection('products').find({}).toArray();
    
    // Convert to simple CSV for template/export
    const headers = ['id', 'name', 'sku', 'manufacturer', 'category', 'isGeneric', 'prescriptionRequired', 'packSize', 'imageUrl', 'imageUrl2', 'imageUrl3', 'description', 'treatment'];
    const rows = products.map(p => [
      p._id || p.id || '',
      p.name || '',
      p.sku || '',
      p.manufacturer || '',
      p.category || '',
      p.isGeneric ? 'true' : 'false',
      p.prescriptionRequired ? 'true' : 'false',
      p.packSize || '',
      p.imageUrl || '',
      p.imageUrls?.[1] || '',
      p.imageUrls?.[2] || '',
      (p.description || '').replace(/"/g, '""'),
      p.treatment || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=products_catalog.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const products = await req.json();
    if (!Array.isArray(products)) throw new Error('Invalid data format. Expected an array.');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('products');

    const ops = products.map(p => ({
      updateOne: {
        filter: { _id: p.id || p._id },
        update: { 
          $set: {
            ...p,
            updatedAt: new Date(),
            migratedAt: new Date()
          } 
        },
        upsert: true
      }
    }));

    const result = await col.bulkWrite(ops);
    return NextResponse.json({ success: true, matched: result.matchedCount, upserted: result.upsertedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
