import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');
    
    const client = await clientPromise;
    const db = client.db('sahimed');
    const marketers = await db.collection('marketers').find({}).toArray();

    const headers = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : ['name'];

    const csvContent = [
      headers.join(','),
      ...marketers.map(m => {
        return headers.map(h => {
          let val = m[h] ?? '';
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
        'Content-Disposition': 'attachment; filename=sahimed_marketers_export.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const marketers = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const marketersCol = db.collection('marketers');

    const ops = marketers.map((m: any) => ({
      updateOne: {
        filter: { name: m.name },
        update: { $set: { name: m.name, updatedAt: new Date() } },
        upsert: true
      }
    }));

    await marketersCol.bulkWrite(ops);

    return NextResponse.json({ success: true, count: marketers.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
