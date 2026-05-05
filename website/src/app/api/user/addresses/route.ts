import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { ShipwayService } from '@/lib/logistics/shipway';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // IDENTITY MATCHING: Just like in orders, we match by UID and Phone
    const identityConditions: any[] = [
      { userId: user.uid }
    ];

    // FALLBACK: If phoneNumber is not in the token, check the MongoDB user profile
    let activePhone = user.phoneNumber;
    if (!activePhone) {
      const userProfile = await db.collection('users').findOne({ uid: user.uid });
      activePhone = userProfile?.phoneNumber || userProfile?.phone;
    }

    if (activePhone) {
      const last10 = activePhone.replace(/\D/g, '').slice(-10);
      const phoneVariants = [activePhone, last10, `+91${last10}`, `91${last10}`];
      phoneVariants.forEach(v => {
        identityConditions.push({ phoneNumber: v });
        identityConditions.push({ phone: v });
      });

      // Find all other UIDs associated with this phone number
      const linkedUsers = await db.collection('users').find({
        $or: [
          { phoneNumber: { $in: phoneVariants } },
          { phone: { $in: phoneVariants } }
        ]
      }).toArray();
      
      linkedUsers.forEach(u => {
        if (u.uid && u.uid !== user.uid) {
          identityConditions.push({ userId: u.uid });
        }
      });
    }

    const addresses = await db.collection('addresses')
      .find({ $or: identityConditions })
      .sort({ timestamp: -1 })
      .toArray();
      
    return NextResponse.json(addresses.map(a => ({ ...a, id: a._id.toString() })));
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    const body = await req.json();
    const { id, ...data } = body;
    
    const client = await clientPromise;
    const db = client.db('sahimed');

    // Get phone number for cross-platform matching
    let activePhone = user.phoneNumber;
    if (!activePhone) {
      const userProfile = await db.collection('users').findOne({ uid: user.uid });
      activePhone = userProfile?.phoneNumber || userProfile?.phone;
    }
    
    const addressData = {
      ...data,
      userId: user.uid,
      phoneNumber: activePhone, // Store phone number for syncing
      updatedAt: new Date(),
      timestamp: data.timestamp || new Date()
    };
    
    // Serviceability check
    if (addressData.pincode) {
      const fromPincode = process.env.WAREHOUSE_PINCODE || '560068';
      const svc = await ShipwayService.checkServiceability(fromPincode, addressData.pincode);
      if (svc.success && !svc.serviceable) {
        return NextResponse.json({ 
          error: `We currently do not deliver to ${addressData.pincode}. Please try another location.`,
          unserviceable: true 
        }, { status: 400 });
      }
    }

    if (id) {
      // Update existing
      let filter: any = { userId: user.uid };
      try {
        filter._id = id.length === 24 ? new ObjectId(id) : id;
      } catch (e) {
        filter._id = id;
      }

      await db.collection('addresses').updateOne(
        filter,
        { $set: addressData }
      );
      return NextResponse.json({ success: true, id });
    } else {
      // Create new
      const result = await db.collection('addresses').insertOne(addressData);
      return NextResponse.json({ success: true, id: result.insertedId });
    }
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // IDENTITY MATCHING: Ensure user owns the address they are deleting
    const identityConditions: any[] = [
      { userId: user.uid }
    ];

    let activePhone = user.phoneNumber;
    if (!activePhone) {
      const userProfile = await db.collection('users').findOne({ uid: user.uid });
      activePhone = userProfile?.phoneNumber || userProfile?.phone;
    }

    if (activePhone) {
      const last10 = activePhone.replace(/\D/g, '').slice(-10);
      const phoneVariants = [activePhone, last10, `+91${last10}`, `91${last10}`];
      phoneVariants.forEach(v => {
        identityConditions.push({ phoneNumber: v });
        identityConditions.push({ phone: v });
      });
    }

    let filter: any = { $or: identityConditions };
    try {
      filter._id = id.length === 24 ? new ObjectId(id) : id;
    } catch (e) {
      filter._id = id;
    }

    // Combine _id and identity check
    const finalFilter = {
      _id: filter._id,
      $or: identityConditions
    };

    await db.collection('addresses').deleteOne(finalFilter);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
