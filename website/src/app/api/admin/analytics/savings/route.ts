import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);

    const client = await clientPromise;
    const db = client.db('sahimed');

    // Fetch all orders
    const orders = await db.collection('orders').find({}).toArray();

    let totalSavings = 0;
    let totalGrossMrp = 0;
    let totalRevenue = 0;
    let genericItemsCount = 0;
    let brandedItemsCount = 0;
    let genericRevenue = 0;
    let brandedRevenue = 0;

    const moleculeSavingsMap: Record<string, { count: number; totalSaved: number; name: string }> = {};

    orders.forEach(order => {
      const orderPayable = Number(order.totalAmount || 0);
      const orderMrp = Number(order.billingBreakdown?.grossMrp || orderPayable * 1.4);
      const orderSavings = Math.max(0, orderMrp - orderPayable);

      totalSavings += orderSavings;
      totalGrossMrp += orderMrp;
      totalRevenue += orderPayable;

      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const isGen = item.isGeneric === true || item.isGeneric === "true" || (item.category || '').toLowerCase().includes('generic');
        const itemPrice = Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1);
        const itemMrp = Number(item.mrp || itemPrice * 1.4) * Number(item.quantity || 1);
        const itemSavings = Math.max(0, itemMrp - itemPrice);

        if (isGen) {
          genericItemsCount += item.quantity || 1;
          genericRevenue += itemPrice;
        } else {
          brandedItemsCount += item.quantity || 1;
          brandedRevenue += itemPrice;
        }

        const composition = item.composition || item.saltComposition || item.name || 'General Formulations';
        if (!moleculeSavingsMap[composition]) {
          moleculeSavingsMap[composition] = { count: 0, totalSaved: 0, name: composition };
        }
        moleculeSavingsMap[composition].count += item.quantity || 1;
        moleculeSavingsMap[composition].totalSaved += itemSavings;
      });
    });

    const totalItems = genericItemsCount + brandedItemsCount;
    const genericConversionRate = totalItems > 0 ? Math.round((genericItemsCount / totalItems) * 100) : 0;
    const avgSavingsPerOrder = orders.length > 0 ? Math.round(totalSavings / orders.length) : 0;

    // Top 5 Money Saving Molecules
    const topMolecules = Object.values(moleculeSavingsMap)
      .sort((a, b) => b.totalSaved - a.totalSaved)
      .slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalSavings: Math.round(totalSavings),
        totalGrossMrp: Math.round(totalGrossMrp),
        totalRevenue: Math.round(totalRevenue),
        totalOrders: orders.length,
        genericConversionRate,
        avgSavingsPerOrder,
        genericItemsCount,
        brandedItemsCount,
        genericRevenue: Math.round(genericRevenue),
        brandedRevenue: Math.round(brandedRevenue),
      },
      topMolecules
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 500 });
  }
}
