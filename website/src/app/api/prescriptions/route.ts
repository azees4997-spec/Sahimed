import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // IDENTITY MATCHING: Just like in orders/addresses, we match by UID and Phone
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
      // ULTRA-AGGRESSIVE MATCHING: Catch every possible format
      const stripped = activePhone.replace(/\D/g, '');
      const last10 = stripped.slice(-10);
      
      const phoneVariants = Array.from(new Set([
        activePhone, 
        stripped, 
        last10, 
        `+91${last10}`, 
        `91${last10}`, 
        `0${last10}`
      ]));
      
      phoneVariants.forEach(v => {
        identityConditions.push({ phoneNumber: v });
        identityConditions.push({ phone: v });
        identityConditions.push({ phone_number: v });
        identityConditions.push({ customer_phone: v });
        identityConditions.push({ customerPhone: v });

        const numValue = parseInt(v.replace(/\D/g, ''));
        if (!isNaN(numValue)) {
          identityConditions.push({ phoneNumber: numValue });
          identityConditions.push({ phone: numValue });
          identityConditions.push({ phone_number: numValue });
        }
      });

      // Find all other UIDs associated with any variant of this phone number for legacy sync
      const linkedUsers = await db.collection('users').find({
        $or: [
          { phoneNumber: { $in: phoneVariants } },
          { phone: { $in: phoneVariants } },
          { phone_number: { $in: phoneVariants } }
        ]
      }).toArray();
      
      linkedUsers.forEach(u => {
        if (u.uid) {
          identityConditions.push({ userId: u.uid });
        }
      });
    }

    const prescriptions = await db.collection('prescriptions')
      .find({ $or: Array.from(new Set(identityConditions.map(c => JSON.stringify(c)))).map(s => JSON.parse(s)) })
      .sort({ uploadDate: -1 })
      .toArray();
      
    return NextResponse.json(prescriptions.map(p => ({ ...p, id: p._id.toString() })));
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    const body = await req.json();
    
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const prescriptionRecord = {
      userId: user.uid,
      phoneNumber: body.phoneNumber || user.phoneNumber || '',
      patientName: body.patientName || 'Self',
      notes: body.notes || '',
      imageUrls: body.imageUrls || [],
      imageUrl: body.imageUrls?.[0] || '', // Primary image
      status: 'Pending Review',
      platform: body.platform || 'web',
      uploadDate: new Date(),
      createdAt: new Date()
    };

    const result = await db.collection('prescriptions').insertOne(prescriptionRecord);
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
