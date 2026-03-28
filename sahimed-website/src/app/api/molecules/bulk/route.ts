
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const molecules = await db.collection('molecules').find({}).toArray();
    
    // Convert to simple CSV
    const headers = ['id', 'molecule', 'masterId', 'form'];
    const rows = molecules.map(m => [
      m._id || m.id || '',
      m.molecule || '',
      m.masterId || '',
      m.form || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=molecules_registry.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const molecules = await req.json();
    if (!Array.isArray(molecules)) throw new Error('Invalid data format. Expected an array.');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('molecules');

    const ops = molecules.map(m => ({
      updateOne: {
        filter: { _id: m.id || m._id },
        update: { 
          $set: {
            ...m,
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
