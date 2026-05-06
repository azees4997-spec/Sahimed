import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/sahimed?ssl=true&replicaSet=atlas-mymgwbv-shard-0&authSource=admin&retryWrites=true&w=majority";

async function migratePrescriptions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db('sahimed');
    
    const orphanedRx = await db.collection('prescriptions').find({
      userId: { $exists: false }
    }).toArray();

    console.log(`Found ${orphanedRx.length} prescriptions missing a User ID.`);

    let migrationCount = 0;

    for (const rx of orphanedRx) {
      const phone = rx.phoneNumber || rx.phone;
      
      if (!phone) {
        console.log(`Skipping Prescription ${rx._id}: No phone number found.`);
        continue;
      }

      const stripped = phone.toString().replace(/\D/g, '');
      const last10 = stripped.slice(-10);
      const variants = [phone, stripped, last10, `+91${last10}`, `91${last10}`, `0${last10}`];

      const userProfile = await db.collection('users').findOne({
        $or: [
          { phoneNumber: { $in: variants } },
          { phone: { $in: variants } },
          { phone_number: { $in: variants } }
        ]
      });

      if (userProfile && userProfile.uid) {
        await db.collection('prescriptions').updateOne(
          { _id: rx._id },
          { $set: { userId: userProfile.uid, updatedAt: new Date() } }
        );
        console.log(`Migrated Prescription ${rx._id} to User ${userProfile.uid} (Phone: ${phone})`);
        migrationCount++;
      }
    }

    console.log(`Migration complete. Total prescriptions updated: ${migrationCount}`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

migratePrescriptions();
