import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    const { searchParams } = new URL(req.url);

    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    const query: any = {};
    
    // Apply Date Filter if provided
    if (start || end) {
      const dateRange: any = {};
      if (start) {
        const startDate = new Date(start);
        if (!isNaN(startDate.getTime())) dateRange.$gte = startDate;
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        if (!isNaN(endDate.getTime())) dateRange.$lte = endDate;
      }
      query.$or = [
        { orderDate: dateRange },
        { createdAt: dateRange }
      ];
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ];

    const results = await db.collection('orders').aggregate(pipeline).toArray();

    // Format results
    const metrics = {
      pendingApproval: 0,
      readyToPack: 0,
      inTransit: 0,
      delivered: 0,
      totalRevenue: 0,
      totalOrders: 0
    };

    results.forEach((r: any) => {
      const status = r._id;
      const count = r.count;
      
      metrics.totalOrders += count;
      
      // Calculate revenue only for non-cancelled and non-returned
      if (status !== 'Cancelled' && status !== 'Returned') {
        metrics.totalRevenue += r.totalRevenue || 0;
      }

      if (status === 'Pending Pharmacist' || status === 'Pending Consult') {
        metrics.pendingApproval += count;
      } else if (status === 'Confirmed') {
        metrics.readyToPack += count;
      } else if (status === 'In Transit' || status === 'Out for Delivery') {
        metrics.inTransit += count;
      } else if (status === 'Delivered') {
        metrics.delivered += count;
      }
    });

    return NextResponse.json(metrics);
  } catch (err: any) {
    console.error('Metrics API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
