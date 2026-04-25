import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const molecules = await db.collection('molecules').find({}).toArray();

    const headers = ['molecule', 'masterId', 'form'];

    const csvContent = [
      headers.join(','),
      ...molecules.map(m => {
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
        'Content-Disposition': 'attachment; filename=sahimed_molecules_export.csv'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const molecules = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const moleculesCol = db.collection('molecules');

    const ops = molecules.map((m: any) => {
      const { id, _id, ...rest } = m;
      const filterId = id || _id || `${m.molecule}-${m.form}`.toLowerCase().replace(/\s+/g, '-');
      
      return {
        updateOne: {
          filter: { $or: [{ _id: filterId }, { masterId: m.masterId }] },
          update: { 
            $set: { ...rest, updatedAt: new Date() }
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) {
      await moleculesCol.bulkWrite(ops);
    }

    return NextResponse.json({ success: true, count: molecules.length });
  } catch (err: any) {
    console.error("[Molecule Bulk Import Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
