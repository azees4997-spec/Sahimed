import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId parameter' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    // Find all orders for this user that were tagged to the specific family member
    const orders = await db.collection('orders')
      .find({
        $or: [
          { userId: user.uid },
          { customer_id: user.uid }
        ],
        'patientDetails.memberId': memberId
      })
      .toArray();

    // Map medications and track the latest order date and total quantity ordered
    const medicationsMap: { [key: string]: any } = {};

    orders.forEach((order) => {
      const orderDate = order.orderDate?._seconds 
        ? new Date(order.orderDate._seconds * 1000) 
        : new Date(order.orderDate || 0);

      order.items?.forEach((item: any) => {
        if (!item.name) return;
        const key = item.name.toLowerCase().trim();
        
        if (!medicationsMap[key]) {
          medicationsMap[key] = {
            _id: item._id || item.productId,
            name: item.name,
            price: item.price || item.unitPrice || 0,
            mrp: item.mrp || item.unitPrice || 0,
            imageUrl: item.imageUrl || item.image || '',
            quantity: item.quantity || 1,
            lastOrdered: orderDate
          };
        } else {
          // Accumulate quantity and update latest order date
          medicationsMap[key].quantity += (item.quantity || 1);
          if (orderDate > medicationsMap[key].lastOrdered) {
            medicationsMap[key].lastOrdered = orderDate;
          }
        }
      });
    });

    const medications = Object.values(medicationsMap).sort((a: any, b: any) => 
      b.lastOrdered.getTime() - a.lastOrdered.getTime()
    );

    return NextResponse.json({ medications });
  } catch (error) {
    console.error('[FAMILY_MEDICATIONS_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch medications' }, { status: 500 });
  }
}
