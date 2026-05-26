import { NextRequest, NextResponse } from 'next/server';
import { getDbAdmin } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const db = getDbAdmin();
    if (!db) return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Create Mission in Firestore
    const missionRef = await db.collection('marketing_missions').add({
      topic,
      status: 'initializing',
      currentStep: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [{ stage: 'system', message: 'Mission Initialized' }]
    });

    const missionId = missionRef.id;

    // Start background processing (Non-blocking)
    // In a real production app, we'd use a queue like BullMQ or a Cron job, 
    // but for this implementation, we will simulate the chain and update Firestore.
    processMission(missionId, topic, model, db);

    return NextResponse.json({ success: true, missionId });
  } catch (error: any) {
    console.error("MISSION_START_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processMission(missionId: string, topic: string, model: any, db: any) {
  const updateStatus = async (step: number, status: string, logMsg: string, data = {}) => {
    await db.collection('marketing_missions').doc(missionId).update({
      currentStep: step,
      status: status,
      updatedAt: new Date().toISOString(),
      logs: adminFieldUpdate(db, 'logs', { stage: status, message: logMsg, timestamp: new Date().toISOString() }),
      ...data
    });
  };

  try {
    // --- STEP 1: Intelligence (Market Researcher) ---
    await updateStatus(0, 'intelligence', `Analyzing market trends for ${topic}...`);
    const researchPrompt = `Analyze the topic "${topic}" for a high-energy video ad. 
    Identify: 1. Target Audience Hooks 2. Competitor Weaknesses 3. Key Viral Angles. 
    Format as JSON: {"hooks": [], "angles": []}`;
    const researchRes = await model.generateContent(researchPrompt);
    const researchData = JSON.parse(researchRes.response.text().replace(/```json/g, "").replace(/```/g, ""));
    await updateStatus(0, 'intelligence', 'Research complete', { researchData });

    // --- STEP 2: Creative (Script Writer) ---
    await updateStatus(1, 'creative', 'Drafting high-energy script...');
    const scriptPrompt = `Based on these hooks: ${JSON.stringify(researchData.hooks)}, write a 30-second high-energy video script for Sahimed. 
    Include Visuals, Audio, and Text Overlays. Format as JSON: {"script": "..."}`;
    const scriptRes = await model.generateContent(scriptPrompt);
    const scriptData = JSON.parse(scriptRes.response.text().replace(/```json/g, "").replace(/```/g, ""));
    await updateStatus(1, 'creative', 'Script finalized', { scriptData });

    // --- STEP 3: Production (Video Generator - Mock) ---
    await updateStatus(2, 'production', 'Rendering AI video assets...');
    // Simulated delay for production
    await new Promise(r => setTimeout(r, 4000));
    await updateStatus(2, 'production', 'Video rendering complete', { videoUrl: 'https://sample-videos.com/video123.mp4' });

    // --- STEP 4: Compliance (Auditor) ---
    await updateStatus(3, 'compliance', 'Running safety and platform audit...');
    const auditPrompt = `Check this script for compliance with YouTube/Meta rules (no nudity, no illegal drugs): ${scriptData.script}. 
    Return {"passed": true/false, "reason": "..."}`;
    const auditRes = await model.generateContent(auditPrompt);
    const auditData = JSON.parse(auditRes.response.text().replace(/```json/g, "").replace(/```/g, ""));
    await updateStatus(3, 'compliance', auditData.passed ? 'Audit passed' : 'Audit warning', { auditData });

    // --- STEP 5: Distribution (SEO Saver) ---
    await updateStatus(4, 'distribution', 'Generating SEO bundle...');
    const seoPrompt = `Generate trending hashtags and description for a video about "${topic}". 
    Format: {"hashtags": [], "description": "..."}`;
    const seoRes = await model.generateContent(seoPrompt);
    const seoData = JSON.parse(seoRes.response.text().replace(/```json/g, "").replace(/```/g, ""));
    await updateStatus(4, 'ready', 'Mission complete. Ready for export.', { seoData });

  } catch (error: any) {
    console.error("MISSION_PROCESS_ERROR:", error);
    await db.collection('marketing_missions').doc(missionId).update({
      status: 'error',
      errorMessage: error.message
    });
  }
}

// Helper for Firestore arrayUnion
function adminFieldUpdate(db: any, field: string, value: any) {
  // We need to use firebase-admin's FieldValue
  const admin = require('firebase-admin');
  return admin.firestore.FieldValue.arrayUnion(value);
}
