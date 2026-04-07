import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = parseInt(searchParams.get('limit') || '50');
  const category = searchParams.get('category');
  const qStr = searchParams.get('q');
  const q = qStr ? escapeRegExp(qStr) : null;
  const moleculeId = searchParams.get('moleculeId');
  const isGeneric = searchParams.get('isGeneric');
  const isBestSeller = searchParams.get('isBestSeller');

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('products');

    const query: any = {};
    if (category) {
      query.category = category;
    }

    // 1. Handle isGeneric (Robust: handles both Boolean and String)
    if (isGeneric !== null) {
      const isTrue = isGeneric === 'true';
      query.isGeneric = { $in: [isTrue, isGeneric] };
    }

    // 2. Handle isBestSeller (Robust)
    if (isBestSeller !== null) {
      const isTrue = isBestSeller === 'true';
      query.isBestSeller = { $in: [isTrue, isBestSeller] };
    }

    let moleculeOr: any[] = [];
    if (moleculeId) {
      try {
        if (moleculeId.length === 24) {
          moleculeOr = [
            { moleculeId: moleculeId },
            { moleculeId: new ObjectId(moleculeId) }
          ];
        } else {
          moleculeOr = [{ moleculeId: moleculeId }];
        }

        // AUTO-MAPPING FALLBACK
        const moleculeDoc = await db.collection('molecules').findOne(
          (moleculeId.length === 24 ? { _id: new ObjectId(moleculeId) } : { _id: moleculeId }) as any
        );
        
        if (moleculeDoc && (moleculeDoc.molecule || moleculeDoc.name)) {
          const saltName = moleculeDoc.molecule || moleculeDoc.name;
          moleculeOr.push({ saltComposition: { $regex: saltName, $options: 'i' } });
          moleculeOr.push({ salt: { $regex: saltName, $options: 'i' } });
          moleculeOr.push({ composition: { $regex: saltName, $options: 'i' } });
        }
      } catch (e) {
        moleculeOr = [{ moleculeId: moleculeId }];
      }
    }

    let searchOr: any[] = [];
    if (q) {
      searchOr = [
        { name: { $regex: `^${q}`, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { saltComposition: { $regex: q, $options: 'i' } },
        { salt: { $regex: q, $options: 'i' } },
        { composition: { $regex: q, $options: 'i' } },
        { molecule: { $regex: q, $options: 'i' } }
      ];
    }

    // Combine filters intelligently
    if (moleculeOr.length > 0 && searchOr.length > 0) {
      query.$and = [
        { $or: moleculeOr },
        { $or: searchOr }
      ];
    } else if (moleculeOr.length > 0) {
      query.$or = moleculeOr;
    } else if (searchOr.length > 0) {
      query.$or = searchOr;
    }

    const pipeline: any[] = [
      { $match: query },
      { $limit: limitValue },
      {
        $lookup: {
          from: 'molecules',
          let: { mId: '$moleculeId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$mId'] },
                    { $eq: [{ $toString: '$_id' }, '$$mId'] }
                  ]
                }
              }
            }
          ],
          as: 'moleculeData'
        }
      },
      {
        $addFields: {
          moleculeData: { $arrayElemAt: ['$moleculeData', 0] }
        }
      }
    ];

    const startTime = Date.now();
    const products = await collection.aggregate(pipeline).toArray();
    const duration = Date.now() - startTime;
    
    console.log(`[Search API] Aggregation Params: mol=${moleculeId || 'none'}, q=${q || 'none'} | Result: ${products.length} in ${duration}ms`);

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    console.error("[Search API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("sahimed");

    // Ensure the document has an _id that matches Firestore's ID if provided
    const docId = body.id || body._id;
    const { id, _id, ...rest } = body;
    const productData = { 
      ...rest, 
      _id: docId as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // INTELLIGENT MAPPING: Auto-link to molecule if missing
    if (!productData.moleculeId && productData.saltComposition) {
      const moleculesCol = db.collection('molecules');
      const allMolecules = await moleculesCol.find({}).toArray();
      const match = allMolecules.find(m => 
        productData.saltComposition.toLowerCase().includes((m.molecule || m.name || "").toLowerCase()) ||
        (m.molecule || m.name || "").toLowerCase().includes(productData.saltComposition.toLowerCase())
      );
      if (match) {
        productData.moleculeId = match._id || match.id;
      }
    }

    const result = await db.collection("products").insertOne(productData);
    
    return NextResponse.json({ success: true, insertedId: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
