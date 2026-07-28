import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const categories = await db.collection('categories').find({}).toArray();

    const headers = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : ['name', 'imageUrl', 'order'];

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
        'Content-Disposition': 'attachment; filename=sahimed_categories_export.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
