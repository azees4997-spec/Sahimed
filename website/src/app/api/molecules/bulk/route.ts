import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const MOLECULE_FIELDS = ['Molecule Code', 'Composition', 'Product Form'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const molecules = await db.collection('Molecule Master').find({}).toArray();

    const headers = fieldsParam 
      ? fieldsParam.split(',').map(f => f.trim()).filter(f => MOLECULE_FIELDS.includes(f)) 
      : MOLECULE_FIELDS;

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
        'Content-Disposition': 'attachment; filename=sahimed_molecule_master_export.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const molecules = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Molecule Master');

    const ops = molecules.map((m: any) => ({
      updateOne: {
        filter: { 'Molecule Code': m['Molecule Code'] },
        update: { 
          $set: { 
            'Molecule Code': m['Molecule Code'],
            Composition: m.Composition,
            'Product Form': m['Product Form'] || '',
            updatedAt: new Date() 
          } 
        },
        upsert: true
      }
    }));

    await col.bulkWrite(ops);

    return NextResponse.json({ success: true, count: molecules.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
