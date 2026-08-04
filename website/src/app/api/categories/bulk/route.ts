import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const CATEGORY_FIELDS = ['category_id', 'category', 'sub_category', 'product_count', 'source_catalog'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const categories = await db.collection('Category Master').find({}).toArray();

    const headers = fieldsParam 
      ? fieldsParam.split(',').map(f => f.trim()).filter(f => CATEGORY_FIELDS.includes(f)) 
      : CATEGORY_FIELDS;

    const csvContent = [
      headers.join(','),
      ...categories.map(c => {
        return headers.map(h => {
          let val = c[h] ?? '';
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
        'Content-Disposition': 'attachment; filename=sahimed_category_master_export.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const categories = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Category Master');

    const ops = categories.map((c: any) => ({
      updateOne: {
        filter: { category_id: c.category_id },
        update: { 
          $set: { 
            category_id: c.category_id,
            category: c.category,
            sub_category: c.sub_category,
            product_count: c.product_count || '0',
            source_catalog: c.source_catalog || 'OTC',
            updatedAt: new Date() 
          } 
        },
        upsert: true
      }
    }));

    await col.bulkWrite(ops);

    return NextResponse.json({ success: true, count: categories.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
