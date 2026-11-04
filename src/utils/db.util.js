import mongoose from 'mongoose';
import { mongoUrl } from '../configs/env.config.js';
import logger from './logger.util.js';

// Drop the old global `code_1` unique index on master-data collections if it still exists.
// This was replaced with a compound (orgId, code) unique index to support per-org seeding.
async function dropLegacyCodeIndexes() {
  const db = mongoose.connection.db;
  const targets = ['visatypes', 'casestages', 'doctypes'];
  for (const col of targets) {
    try {
      const collection = db.collection(col);
      const indexes = await collection.indexes();
      const legacy = indexes.find((idx) => idx.name === 'code_1' || (idx.key && idx.key.code === 1 && !idx.key.orgId));
      if (legacy) {
        await collection.dropIndex(legacy.name);
        logger.info(`[db] Dropped legacy index ${legacy.name} on ${col}`);
      }
    } catch (err) {
      // Collection may not exist yet — that is fine
      if (!err.message?.includes('ns not found') && !err.message?.includes('index not found')) {
        logger.warn(`[db] Could not drop legacy index on ${col}: ${err.message}`);
      }
    }
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl, { dbName: 'immigration' });
    logger.info('MongoDB connected');
    await dropLegacyCodeIndexes();
  } catch (err) {
    logger.error('MongoDB connection failed', { message: err.message });
    process.exit(1);
  }
};

export default connectDB;
