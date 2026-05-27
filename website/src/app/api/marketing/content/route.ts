import { NextRequest, NextResponse } from 'next/server';
import { getSEOContent, deleteSEOContent, saveSEOContent, updateSEOContent } from '@/lib/marketing-db';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, content, excerpt, keywords, category, images, videoLink, attachments } = body;
    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const saved = await saveSEOContent({
      title,
      slug,
      content,
      excerpt: excerpt || '',
      keywords: keywords || [],
      trendTopic: '',
      category: category || 'General Health',
      status: 'draft',
      featuredProducts: [],
      images: images || [],
      videoLink: videoLink || '',
      attachments: attachments || []
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("CREATE_BLOG_ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to create content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, slug, content, excerpt, keywords, category, images, videoLink, attachments, status } = body;
    if (!id || !title || !slug) {
      return NextResponse.json({ error: "ID, title and slug are required" }, { status: 400 });
    }

    const updated = await updateSEOContent(id, {
      title,
      slug,
      content,
      excerpt: excerpt || '',
      keywords: keywords || [],
      category: category || 'General Health',
      status: status || 'draft',
      images: images || [],
      videoLink: videoLink || '',
      attachments: attachments || []
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("UPDATE_BLOG_ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 });
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
