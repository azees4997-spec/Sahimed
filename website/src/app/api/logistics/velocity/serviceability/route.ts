import { NextRequest, NextResponse } from 'next/server';
import { VelocityService } from '@/lib/logistics/velocity';

export async function POST(req: NextRequest) {
  try {
    const { toPincode } = await req.json();

    if (!toPincode) {
      return NextResponse.json(
        { error: 'Destination pincode is required' },
        { status: 400 }
      );
    }

    // Defaulting origin to the Bengaluru warehouse pincode.
    // The user has a Bengaluru warehouse, assuming common Bengaluru pincode if not provided.
    const fromPincode = process.env.WAREHOUSE_PINCODE || '560001'; 

    const result = await VelocityService.checkServiceability(fromPincode, toPincode);

    if (result.success) {
      return NextResponse.json({
        serviceable: result.serviceable,
        carriers: result.carriers
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to check serviceability', details: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
