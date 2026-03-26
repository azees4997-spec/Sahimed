
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

    // --- PHASE 0: PRODUCT CATALOG ---
    logs.push("Phase 0: Migrating Product Catalog (Static Data)...");
    const medSnap = await getDocs(collection(db, 'medicines'));
    const products = medSnap.docs.map(doc => ({
      _id: doc.id as any,
      ...doc.data(),
      migratedAt: new Date()
    }));
    
    if (products.length > 0) {
      const productsCol = mongoDb.collection('products');
      const ops = products.map(prod => ({
        updateOne: {
          filter: { _id: prod._id },
          update: { $set: prod },
          upsert: true
        }
      }));
      await productsCol.bulkWrite(ops);
      logs.push(`Successfully synced ${products.length} products from medicine catalog.`);
    }

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
    if (liveDataItems.length > 0) {
      const ops = liveDataItems.map(item => ({
        updateOne: {
          filter: { sku: item.sku },
          update: { 
            $set: { 
              liveData: item.data,
              lastSyncedAt: new Date()
            } 
          }
        }
      }));
      const result = await productsCol.bulkWrite(ops);
      logs.push(`Successfully synced live data for ${result.matchedCount} products.`);
    }

    // --- PHASE 3: MOLECULES ---
    logs.push("Phase 3: Migrating Molecules...");
    const molSnap = await getDocs(collection(db, 'moleculeMaster'));
    const molecules = molSnap.docs.map(doc => ({ _id: doc.id as any, ...doc.data(), migratedAt: new Date() }));
    if (molecules.length > 0) {
      await mongoDb.collection('molecules').deleteMany({});
      await mongoDb.collection('molecules').insertMany(molecules);
      logs.push(`Successfully migrated ${molecules.length} molecules.`);
    }

    // --- PHASE 4: BANNERS ---
    logs.push("Phase 4: Migrating Banners...");
    const bannerSnap = await getDocs(collection(db, 'banners'));
    const banners = bannerSnap.docs.map(doc => ({ _id: doc.id as any, ...doc.data(), migratedAt: new Date() }));
    if (banners.length > 0) {
      await mongoDb.collection('banners').deleteMany({});
      await mongoDb.collection('banners').insertMany(banners);
      logs.push(`Successfully migrated ${banners.length} banners.`);
    }

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
