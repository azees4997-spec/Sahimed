import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const SUPPLIER_FIELDS = [
  'supplier_code',
  'supplier_name',
  'compliance_details.gstin',
  'compliance_details.drug_license_number',
  'financials.credit_days',
  'financials.is_active'
];

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((curr, key) => curr?.[key], obj) ?? '';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const suppliers = await db.collection('Supplier Master').find({}).toArray();

    const headers = fieldsParam 
      ? fieldsParam.split(',').map(f => f.trim()).filter(f => SUPPLIER_FIELDS.includes(f)) 
      : SUPPLIER_FIELDS;

    const csvContent = [
      headers.join(','),
      ...suppliers.map(s => {
        return headers.map(h => {
          let val = getNestedValue(s, h);
          if (typeof val === 'boolean') val = val.toString();
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
        'Content-Disposition': 'attachment; filename=sahimed_supplier_master_export.csv'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const suppliers = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Supplier Master');

    const ops = suppliers.map((s: any) => ({
      updateOne: {
        filter: { supplier_code: s.supplier_code },
        update: { 
          $set: { 
            supplier_code: s.supplier_code,
            supplier_name: s.supplier_name,
            compliance_details: {
              gstin: s['compliance_details.gstin'] || s.compliance_details?.gstin || '',
              drug_license_number: s['compliance_details.drug_license_number'] || s.compliance_details?.drug_license_number || ''
            },
            financials: {
              credit_days: Number(s['financials.credit_days'] || s.financials?.credit_days || 0),
              is_active: s['financials.is_active'] ?? s.financials?.is_active ?? true
            },
            updatedAt: new Date() 
          } 
        },
        upsert: true
      }
    }));

    await col.bulkWrite(ops);

    return NextResponse.json({ success: true, count: suppliers.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
