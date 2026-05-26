import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDbAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { missionId } = await req.json();
    if (!missionId) return NextResponse.json({ error: "Mission ID is required" }, { status: 400 });

    const db = getDbAdmin();
    if (!db) return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });

    const missionDoc = await db.collection('marketing_missions').doc(missionId).get();
    if (!missionDoc.exists) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

    const missionData = missionDoc.data();
    const videoUrl = missionData.videoUrl;

    if (!videoUrl) return NextResponse.json({ error: "No video URL found for this mission" }, { status: 400 });

    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientID || !clientSecret) {
      return NextResponse.json({ 
        error: "DRIVE_NOT_CONFIGURED", 
        message: "Google Drive API keys are missing in .env" 
      }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientID, clientSecret, redirectUri);

    // STRATEGY: In a real app, we'd check for a stored refresh token.
    // For now, we return the Auth URL if the user needs to authenticate.
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
    });

    return NextResponse.json({ 
      success: true, 
      authRequired: true, 
      authUrl 
    });

  } catch (error: any) {
    console.error("DRIVE_SAVE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
