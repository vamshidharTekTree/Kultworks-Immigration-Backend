import mongoose from 'mongoose';
import { mongoUrl } from '../configs/env.config.js';
import logger from './logger.util.js';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl, { dbName: 'immigration' });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed', { message: err.message });
    process.exit(1);
  }
};

export default connectDB;
