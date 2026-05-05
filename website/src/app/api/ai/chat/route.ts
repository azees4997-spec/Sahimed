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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: [searchProductsTool],
      systemInstruction: "You are SahiAI, the official health and savings assistant for Sahimed. Your goal is to help users understand generic medicines and find cheaper alternatives. Generic medicines are identical to branded ones in dosage, safety, strength, quality, and performance. They cost less because they don't have the same marketing and R&D costs. You can search for products using the search_products tool. Always be professional, empathetic, and clear. If you suggest a medicine, remind the user to consult a doctor. Keep responses concise and use bullet points for product lists.",
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    // Handle Function Calling
    const calls = response.functionCalls();
    if (calls && calls.length > 0) {
      const call = calls[0];
      if (call.name === "search_products") {
        const { query, isGeneric } = call.args as any;
        
        // Connect to MongoDB and search
        const client = await clientPromise;
        const db = client.db('sahimed');
        const collection = db.collection('products');
        
        const mongoQuery: any = {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { saltComposition: { $regex: query, $options: 'i' } },
            { salt: { $regex: query, $options: 'i' } },
            { composition: { $regex: query, $options: 'i' } }
          ]
        };
        
        if (isGeneric !== undefined) {
          mongoQuery.isGeneric = isGeneric;
        }

        const products = await collection.find(mongoQuery).limit(5).toArray();
        
        // Provide tool result back to Gemini
        const toolResult = await chat.sendMessage([
          {
            functionResponse: {
              name: "search_products",
              response: { products: products.map(p => ({
                id: p._id || p.id,
                name: p.name,
                price: p.price,
                isGeneric: p.isGeneric,
                description: p.description,
                image: p.image || p.images?.[0]
              })) },
            },
          },
        ]);
        
        return NextResponse.json({ 
          content: toolResult.response.text(),
          role: "assistant"
        });
      }
      
      if (call.name === "search_knowledge") {
        const { query } = call.args as any;
        const client = await clientPromise;
        const db = client.db('sahimed');
        const collection = db.collection('knowledge_base');
        
        const info = await collection.find({
          $or: [
            { question: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } }
          ]
        }).limit(3).toArray();
        
        const toolResult = await chat.sendMessage([
          {
            functionResponse: {
              name: "search_knowledge",
              response: { results: info },
            },
          },
        ]);
        
        return NextResponse.json({ 
          content: toolResult.response.text(),
          role: "assistant"
        });
      }
    }

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
