import { MongoClient } from 'mongodb';

// Replace with your actual MongoDB URI if running locally
const uri = process.env.MONGODB_URI || "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/sahimed?ssl=true&replicaSet=atlas-mymgwbv-shard-0&authSource=admin&retryWrites=true&w=majority";

async function migrateOrders() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db('sahimed');
    
    // 1. Find all orders that are missing userId or customer_id
    const orphanedOrders = await db.collection('orders').find({
      $and: [
        { userId: { $exists: false } },
        { customer_id: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${orphanedOrders.length} orders missing a User ID.`);

    let migrationCount = 0;

    for (const order of orphanedOrders) {
      const phone = order.phoneNumber || order.phone || order.customer_phone;
      
      if (!phone) {
        console.log(`Skipping Order ${order.orderId}: No phone number found.`);
        continue;
      }

      // Clean the phone number to match the variants
      const stripped = phone.toString().replace(/\D/g, '');
      const last10 = stripped.slice(-10);
      const variants = [phone, stripped, last10, `+91${last10}`, `91${last10}`, `0${last10}`];

      // 2. Find a user with this phone number
      const userProfile = await db.collection('users').findOne({
        $or: [
          { phoneNumber: { $in: variants } },
          { phone: { $in: variants } },
          { phone_number: { $in: variants } }
        ]
      });

      if (userProfile && userProfile.uid) {
        // 3. Update the order with the found UID
        await db.collection('orders').updateOne(
          { _id: order._id },
          { $set: { userId: userProfile.uid, customer_id: userProfile.uid, updatedAt: new Date() } }
        );
        console.log(`Migrated Order ${order.orderId} to User ${userProfile.uid} (Phone: ${phone})`);
        migrationCount++;
      } else {
        console.log(`Could not find user profile for Phone ${phone} (Order ${order.orderId})`);
      }
    }

    console.log(`Migration complete. Total orders updated: ${migrationCount}`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

migrateOrders();
