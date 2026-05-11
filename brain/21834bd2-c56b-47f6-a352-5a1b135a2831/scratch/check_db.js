
import { MongoClient } from 'mongodb';

async function checkSettings() {
  const client = new MongoClient('mongodb+srv://sahimed:sahimed123@cluster0.mongodb.net/sahimed?retryWrites=true&w=majority'); // I'll assume standard connection or check lib/mongodb
  try {
    // Actually I'll use the existing lib/mongodb if I can, but for a scratch script I'll just try to connect if I had the URI.
    // Since I don't have the URI in plain text easily, I'll check lib/mongodb.ts first.
  } catch (e) {
    console.error(e);
  }
}
