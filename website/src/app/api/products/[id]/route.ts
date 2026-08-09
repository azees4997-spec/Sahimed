import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    // Try matching by ObjectId, product_id string, or _id string
    let product = null;

    // Try as ObjectId first
    if (id.length === 24) {
      try {
        product = await col.findOne({ _id: new ObjectId(id) });
      } catch (e) {}
    }

    // Try as string _id or product_id
    if (!product) {
      product = await col.findOne({
        $or: [
          { _id: id as any },
          { product_id: id },
          { 'seo.url_slug': { $regex: escapeForSlug(id), $options: 'i' } }
        ]
      });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check salable status for non-admin access
    if (product.salable_status && !product.salable_status.toLowerCase().includes('salable')) {
      try {
        await verifyAdmin(request);
      } catch {
        return NextResponse.json({ error: 'Product unavailable' }, { status: 403 });
      }
    }

    // Look up mapped generic substitute if this product is branded
    let mappedGeneric = null;
    const isBranded = !(product.medicine_type || '').toLowerCase().includes('generic') && product.is_generic !== true;
    
    if (isBranded && (product.molecule_code || product.medical_info?.composition)) {
      try {
        const genQuery: any = {
          $or: [{ medicine_type: /generic/i }, { is_generic: true }],
          _id: { $ne: product._id }
        };
        if (product.molecule_code) {
          genQuery.molecule_code = product.molecule_code;
        } else if (product.medical_info?.composition) {
          genQuery['medical_info.composition'] = { $regex: product.medical_info.composition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }
        const found = await col.findOne(genQuery);
        if (found) {
          mappedGeneric = {
            ...found,
            id: found._id?.toString(),
            name: found.product_name,
            selling_price: found.selling_price ?? found.sale_price ?? found.packaging?.mrp,
            price: found.selling_price ?? found.sale_price ?? found.packaging?.mrp,
            mrp: found.packaging?.mrp,
            manufacturer: found.taxonomy?.marketer_name,
            saltComposition: found.medical_info?.composition
          };
        }
      } catch (e) {}
    }

    const isGen = (product.medicine_type || '').toLowerCase().includes('generic') || product.is_generic === true || product.isGeneric === true;

    // Return with legacy field aliases for backward compatibility
    const normalized = {
      ...product,
      id: product._id?.toString(),
      name: product.product_name,
      sku: product.product_id,
      medicine_type: product.medicine_type || (isGen ? 'Generic' : 'Branded'),
      is_generic: isGen,
      isGeneric: isGen,
      manufacturer: product.taxonomy?.marketer_name,
      category: product.taxonomy?.category_name,
      saltComposition: product.medical_info?.composition,
      selling_price: product.selling_price ?? product.sale_price ?? product.packaging?.mrp,
      price: product.selling_price ?? product.sale_price ?? product.packaging?.mrp,
      mrp: product.packaging?.mrp,
      imageUrl: product.images?.[0] || product.imageUrl || '',
      imageUrls: product.images || [],
      prescriptionRequired: product.safety_warnings?.is_rx_required,
      treatment: product.medical_info?.primary_use,
      howToUse: product.medical_info?.how_to_use,
      packSize: product.packaging?.packaging_detail,
      moleculeId: product.molecule_code,
      description: product.medical_info?.introduction,
      safetyAdvice: product.safety_warnings?.interactions?.safety_advise,
      sideEffects: product.medical_info?.side_effects || [],
      mappedGeneric: mappedGeneric,
    };

    return NextResponse.json(normalized, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function escapeForSlug(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');

    const { _id, id: _bodyId, ...updateData } = body;

    const query: any = { $or: [{ _id: id as any }, { product_id: id }] };
    if (id.length === 24) {
      try { query.$or.push({ _id: new ObjectId(id) }); } catch (e) {}
    }

    const result = await db.collection('Product Master').updateOne(
      query,
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('sahimed');

    const query: any = { $or: [{ _id: id as any }, { product_id: id }] };
    if (id.length === 24) {
      try { query.$or.push({ _id: new ObjectId(id) }); } catch (e) {}
    }

    const result = await db.collection('Product Master').deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
