import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    // 1. Set is_generic: true for all products with medicine_type containing 'generic'
    const resultGeneric = await col.updateMany(
      { 
        $or: [
          { medicine_type: { $regex: 'generic', $options: 'i' } },
          { is_generic: true },
          { isGeneric: true }
        ]
      },
      { 
        $set: { 
          is_generic: true, 
          isGeneric: true, 
          medicine_type: 'Generic',
          updatedAt: new Date() 
        } 
      }
    );

    // 2. Set is_generic: false for all other products
    const resultBranded = await col.updateMany(
      { 
        $and: [
          { medicine_type: { $not: { $regex: 'generic', $options: 'i' } } },
          { is_generic: { $ne: true } },
          { isGeneric: { $ne: true } }
        ]
      },
      { 
        $set: { 
          is_generic: false, 
          isGeneric: false,
          updatedAt: new Date() 
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully populated is_generic across MongoDB Product Master collection',
      genericProductsUpdated: resultGeneric.modifiedCount,
      brandedProductsUpdated: resultBranded.modifiedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
