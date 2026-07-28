import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// Available export fields mapped from Product Master schema
const ALL_EXPORT_FIELDS = [
  'product_id',
  'product_name',
  'molecule_code',
  'medicine_type',
  'salable_status',
  'country_of_origin',
  'taxonomy.marketer_id',
  'taxonomy.marketer_name',
  'taxonomy.category_id',
  'taxonomy.category_name',
  'taxonomy.sub_category',
  'packaging.product_form',
  'packaging.package_type',
  'packaging.package_quantity',
  'packaging.packaging_detail',
  'packaging.mrp',
  'medical_info.composition',
  'medical_info.primary_use',
  'safety_warnings.is_rx_required',
  'safety_warnings.is_controlled_substance',
  'images',
  'seo.url_slug',
];

// Deeply get a nested value using dot notation
function getNestedValue(obj: any, path: string): any {
  if (path === 'images') {
    return Array.isArray(obj.images) ? obj.images[0] || '' : '';
  }
  return path.split('.').reduce((curr, key) => curr?.[key], obj) ?? '';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const products = await db.collection('Product Master').find({}).toArray();

    const headers = fieldsParam
      ? fieldsParam.split(',').map(f => f.trim())
      : ALL_EXPORT_FIELDS;

    const csvRows = products.map(p => {
      return headers.map(h => {
        let val = getNestedValue(p, h);
        if (Array.isArray(val)) val = val.join('; ');
        if (typeof val === 'boolean') val = val.toString();
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
        }
        return val ?? '';
      }).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=sahimed_product_master_export.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const products = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    const ops = products.map((p: any) => ({
      updateOne: {
        filter: { 
          $or: [
            { product_id: p.product_id },
            { 'seo.url_slug': p['seo.url_slug'] }
          ].filter(f => Object.values(f)[0])
        },
        update: { $set: { ...p, updatedAt: new Date() } },
        upsert: true
      }
    }));

    await col.bulkWrite(ops);
    return NextResponse.json({ success: true, count: products.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
