
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import clientPromise from '@/lib/mongodb';

const firebaseConfig = {
  "projectId": "studio-9756314138-8403b",
  "appId": "1:503492891847:web:8db8fc212c714cfb5c9ae2",
  "apiKey": "AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc",
  "authDomain": "studio-9756314138-8403b.firebaseapp.com",
  "storageBucket": "studio-9756314138-8403b.firebasestorage.app",
  "messagingSenderId": "503492891847"
};

export async function GET() {
  const logs: string[] = [];
  
  try {
    // 1. Initialize Firebase
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    logs.push("Firebase Initialized");

    // 2. Initialize MongoDB
    const client = await clientPromise;
    const mongoDb = client.db('sahimed');
    logs.push("MongoDB Connected");

    // --- PHASE 1: CATEGORIES ---
    logs.push("Phase 1: Migrating Categories...");
    const catSnap = await getDocs(collection(db, 'categories'));
    const categories = catSnap.docs.map(doc => ({
      _id: doc.id as any,
      ...doc.data(),
      migratedAt: new Date()
    }));
    
    if (categories.length > 0) {
      const catCol = mongoDb.collection('categories');
      await catCol.deleteMany({});
      await catCol.insertMany(categories);
      logs.push(`Successfully migrated ${categories.length} categories.`);
    }

    // --- PHASE 2: LIVE DATA SYNC ---
    logs.push("Phase 2: Syncing Live Data (Prices/Inventory)...");
    const liveSnap = await getDocs(collection(db, 'product_live_data'));
    const liveDataItems = liveSnap.docs.map(doc => ({
      sku: doc.id,
      data: doc.data()
    }));
    
    const productsCol = mongoDb.collection('products');
    let syncCount = 0;
    
    for (const item of liveDataItems) {
      const result = await productsCol.updateOne(
        { sku: item.sku },
        { 
          $set: { 
            liveData: item.data,
            lastSyncedAt: new Date()
          } 
        }
      );
      if (result.matchedCount > 0) syncCount++;
    }
    logs.push(`Successfully synced live data for ${syncCount} products.`);

    return NextResponse.json({ 
      success: true, 
      logs,
      message: "Data migrated successfully to MongoDB!"
    });

  } catch (err: any) {
    console.error("Migration API Error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      logs 
    }, { status: 500 });
  }
}
