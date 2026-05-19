import { NextResponse } from 'next/server';
import { ShipwayService } from '@/lib/logistics/shipway';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');

    if (!awb) {
      return NextResponse.json({ error: 'Missing awb parameter' }, { status: 400 });
    }

    // Verify token to ensure security
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const trackingResult = await ShipwayService.trackShipment(awb);

    if (!trackingResult.success) {
      return NextResponse.json({ error: trackingResult.error }, { status: 500 });
    }

    return NextResponse.json(trackingResult.data);
  } catch (error: any) {
    console.error('[API] Tracking fetch failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
