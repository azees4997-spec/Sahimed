import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveSEOContent } from '@/lib/marketing-db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { topic, category } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are an expert Health Content Marketer and SEO specialist for "Sahimed", an Indian online pharmacy.
      Generate a high-quality, SEO-optimized blog article about: "${topic}".
      Target audience: Health-conscious people in India.
      Category: ${category || 'General Health'}.

      Instructions:
      1. Create a catchy, click-worthy title.
      2. Write a 800-1200 word article. Use HTML tags for formatting (h1, h2, p, ul, li).
      3. Focus on symptoms, management, and medicine suggestions common in India.
      4. Include an excerpt (max 160 characters) for the meta description.
      5. Provide a list of 5 SEO keywords.
      6. Suggest a URL slug.

      Return the response in JSON format:
      {
        "title": "...",
        "slug": "...",
        "content": "...",
        "excerpt": "...",
        "keywords": ["...", "..."],
        "trendTopic": "${topic}"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the text (in case there's markdown wrapping)
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr);

    let saved = null;
    let dbError = null;

    try {
      saved = await saveSEOContent({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        keywords: data.keywords,
        trendTopic: topic,
        category: category || 'General Health',
        status: 'draft',
        featuredProducts: []
      });
    } catch (err) {
      console.error("MONGODB_SAVE_ERROR:", err);
      dbError = "Content generated but could not be saved to MongoDB. Please check your connection.";
    }

    return NextResponse.json({ 
      success: true, 
      data: data, // Return the raw generated data
      saved: saved,
      warning: dbError
    });
  } catch (error) {
    console.error("GENERATION_ERROR:", error);
    return NextResponse.json({ error: "Failed to generate content. Please ensure your AI API key is valid." }, { status: 500 });
  }
}
