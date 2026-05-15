import mongoose from 'mongoose';
import { Society } from './backend/src/models/Society.js';

const mongoUri = 'mongodb://127.0.0.1:27017/mpbs';

async function run() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    const count = await Society.countDocuments();
    const societies = await Society.find({}, 'societyId societyName').limit(5).lean();
    console.log(JSON.stringify({ count, societies }, null, 2));
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
