import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Tool, SchemaType } from "@google/generative-ai";
import clientPromise from '@/lib/mongodb';

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 2. Define the Search Tool
const searchProductsTool: any = {
  functionDeclarations: [
    {
      name: "search_products",
      description: "Search for medicines in the Sahimed catalog by name, salt, or category. Use this to find generic alternatives.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "The name of the medicine or the salt/molecule (e.g., 'Paracetamol', 'Telmisartan').",
          },
          isGeneric: {
            type: SchemaType.BOOLEAN,
            description: "Whether to filter for generic medicines specifically.",
          }
        },
        required: ["query"],
      },
    },
    {
      name: "search_knowledge",
      description: "Search the Sahimed knowledge base for FAQs, policies, and health articles.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "The topic to search for (e.g., 'refund policy', 'what is a molecule').",
          }
        },
        required: ["query"],
      },
    },
  ],
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: 'v1' }
    );

    const result = await model.generateContent(messages[messages.length - 1].content);
    const response = await result.response;
    
    return NextResponse.json({ 
      content: response.text(),
      role: "assistant"
    });

  } catch (err: any) {
    console.error("[SahiAI API Error]", err);
    
    // Check for specific common issues
    if (err.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json({ error: "Invalid Gemini API Key. Please check your Vercel settings." }, { status: 500 });
    }
    if (err.message?.includes('MONGODB')) {
      return NextResponse.json({ error: "Database connection failed. Please check your MONGODB_URI." }, { status: 500 });
    }

    return NextResponse.json({ 
      error: "SahiAI is having trouble: " + (err.message || "Unknown Error"),
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
