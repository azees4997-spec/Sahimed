import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveSEOContent } from '@/lib/marketing-db';


export async function POST(req: NextRequest) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "") {
      return NextResponse.json({ 
        error: "AI_KEY_MISSING", 
        message: "Your GEMINI_API_KEY is not set in the environment. Please add it to your Vercel/Hosting environment variables." 
      }, { status: 500 });
    }

    const { topic, category } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(key);
    
    // Try multiple model names as fallbacks
    const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-pro"];
    let model;
    let success = false;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        const testResult = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 5 } });
        if (testResult) {
          success = true;
          console.log(`Successfully initialized with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!success || !model) {
      throw lastError || new Error("Could not initialize any Gemini model. Please check your API key permissions.");
    }

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
      data: data, 
      saved: saved,
      warning: dbError
    });
  } catch (error: any) {
    console.error("GENERATION_ERROR:", error);
    return NextResponse.json({ 
      error: "AI_GENERATION_FAILED", 
      message: error.message || "Failed to generate content",
      details: error.toString()
    }, { status: 500 });
  }
}
