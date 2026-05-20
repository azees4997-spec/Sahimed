import { NextRequest, NextResponse } from 'next/server';
import { getSEOContent, deleteSEOContent } from '@/lib/marketing-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const content = await getSEOContent(limit, skip);
    
    // Check for essential config
    const config = {
      isAiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "",
      isDbConfigured: !!process.env.MONGODB_URI && process.env.MONGODB_URI !== ""
    };

    return NextResponse.json({ 
      data: content,
      config 
    });
  } catch (error) {
    console.error("FETCH_MARKETING_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await deleteSEOContent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
