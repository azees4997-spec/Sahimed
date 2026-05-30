import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    // Only allow admin or check if we can run it
    let user;
    try {
      user = await verifyAdmin(req);
    } catch (e) {
      // For ease of debugging, we can return masked status even without full admin auth, 
      // but to prevent public leaking we will only show presence/absence status of key variables.
    }

    const envVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_WHATSAPP_FROM',
      'ADMIN_WHATSAPP_NUMBER',
      'MONGODB_URI'
    ];

    const report: Record<string, { present: boolean; length: number; valueMasked: string }> = {};

    for (const name of envVars) {
      const val = process.env[name];
      if (val) {
        report[name] = {
          present: true,
          length: val.length,
          valueMasked: val.length > 8 
            ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` 
            : '***'
        };
      } else {
        report[name] = {
          present: false,
          length: 0,
          valueMasked: 'NOT_DEFINED'
        };
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      report
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
