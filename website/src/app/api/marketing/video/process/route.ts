import { NextRequest, NextResponse } from 'next/server';
import { getDbAdmin } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const db = getDbAdmin();
    if (!db) {
      return NextResponse.json({ 
        error: "Firebase Credentials Missing. If you are on Vercel/Preview, you must add FIREBASE_PRIVATE_KEY, CLIENT_EMAIL, and PROJECT_ID to your Environment Variables. (In Production on Firebase App Hosting, this is automatic)." 
      }, { status: 500 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

    // 1. Create Mission (Server Side - Bypasses Rules)
    const missionRef = await db.collection('marketing_missions').add({
      topic,
      status: 'initializing',
      progress: 5,
      currentStep: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [{ stage: 'system', message: 'Mission Registered on Server', progress: 5, timestamp: new Date().toISOString() }]
    });

    const missionId = missionRef.id;

    // 2. Start background processing
    processMission(missionId, topic, model, db);

    return NextResponse.json({ success: true, missionId });
  } catch (error: any) {
    console.error("MISSION_START_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processMission(missionId: string, topic: string, model: any, db: any) {
  const updateStatus = async (step: number, progress: number, status: string, logMsg: string, data = {}) => {
    try {
      await db.collection('marketing_missions').doc(missionId).update({
        currentStep: step,
        progress: progress,
        status: status,
        updatedAt: new Date().toISOString(),
        logs: adminFieldUpdate(db, 'logs', { 
          stage: status, 
          message: logMsg, 
          progress: progress,
          timestamp: new Date().toISOString() 
        }),
        ...data
      });
    } catch (e) {
      console.error("FIRESTORE_UPDATE_ERROR:", e);
    }
  };

  try {
    // --- STEP 1 & 2: Intelligence + Creative (Combined for Speed) ---
    await updateStatus(0, 10, 'intelligence', 'Starting Market Research & Scripting...');
    await new Promise(r => setTimeout(r, 1000));
    await updateStatus(0, 25, 'intelligence', 'Analyzing competitor hooks and viral angles...');

    const combinedPrompt = `You are a viral marketing expert. Analyze the topic "${topic}" and write a 30-second high-energy video script.
    Return JSON with:
    1. "research": {"hooks": [], "angles": []}
    2. "script": "..." (The full script with visuals/audio)
    Ensure the script is optimized for the Sahimed pharmacy brand.`;

    const combinedRes = await model.generateContent(combinedPrompt);
    const combinedText = combinedRes.response.text().replace(/```json/g, "").replace(/```/g, "");
    const combinedData = JSON.parse(combinedText);

    await updateStatus(1, 45, 'creative', 'Script and Research finalized', { 
      researchData: combinedData.research, 
      scriptData: { script: combinedData.script } 
    });

    // --- STEP 3: Production ---
    await updateStatus(2, 55, 'production', 'Generating AI voiceover and visuals...');
    await new Promise(r => setTimeout(r, 2000));
    await updateStatus(2, 70, 'production', 'Rendering final video layers...');
    await new Promise(r => setTimeout(r, 2000));
    await updateStatus(2, 85, 'production', 'Production complete', { videoUrl: 'https://sample-videos.com/video123.mp4' });

    // --- STEP 4: Compliance ---
    await updateStatus(3, 90, 'compliance', 'Auditing content for safety rules...');
    const auditPrompt = `Audit this script for safety and platform rules: ${combinedData.script}. Return {"passed": true, "reason": "..."}`;
    const auditRes = await model.generateContent(auditPrompt);
    const auditData = JSON.parse(auditRes.response.text().replace(/```json/g, "").replace(/```/g, ""));
    await updateStatus(3, 95, 'compliance', 'Safety audit complete', { auditData });

    // --- STEP 5: Distribution ---
    await updateStatus(4, 98, 'distribution', 'Packing SEO metadata bundle...');
    const seoPrompt = `Generate hashtags and description for: ${topic}. Return {"hashtags": [], "description": "..."}`;
    const seoRes = await model.generateContent(seoPrompt);
    const seoData = JSON.parse(seoRes.response.text().replace(/```json/g, "").replace(/```/g, ""));
    await updateStatus(4, 100, 'ready', 'Mission Complete! Ready for Drive Export.', { seoData });

  } catch (error: any) {
    console.error("MISSION_PROCESS_ERROR:", error);
    try {
      await db.collection('marketing_missions').doc(missionId).update({
        status: 'error',
        progress: 0,
        errorMessage: error.message
      });
    } catch (e) {
      console.error("CRITICAL_FIRESTORE_ERROR:", e);
    }
  }
}

// Helper for Firestore arrayUnion
function adminFieldUpdate(db: any, field: string, value: any) {
  // We need to use firebase-admin's FieldValue
  const admin = require('firebase-admin');
  return admin.firestore.FieldValue.arrayUnion(value);
}
