import mongoose from 'mongoose';
import { localStore } from './localStore';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpay';

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isMongoActive: boolean;
  hasAttempted: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: GlobalMongoose | undefined;
}

let cached = global.mongooseGlobal;

if (!cached) {
  cached = global.mongooseGlobal = {
    conn: null,
    promise: null,
    isMongoActive: false,
    hasAttempted: false,
  };
}

export function isMongoConnected(): boolean {
  return !!cached?.isMongoActive && mongoose.connection.readyState === 1;
}

async function connectDB(): Promise<typeof mongoose | null> {
  // Initialize local persistent store immediately
  localStore.init();

  if (cached!.conn && mongoose.connection.readyState === 1) {
    cached!.isMongoActive = true;
    return cached!.conn;
  }

  // If already attempted once and failed, immediately use localStore with zero delay
  if (cached!.hasAttempted && !cached!.isMongoActive) {
    return null;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1500, // Fast 1.5s check for external MongoDB
      connectTimeoutMS: 1500,
    };
    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
    cached!.isMongoActive = true;
    cached!.hasAttempted = true;
    console.log('[SmartPay DB] Connected to external MongoDB database successfully.');
    return cached!.conn;
  } catch (e: any) {
    cached!.promise = null;
    cached!.conn = null;
    cached!.isMongoActive = false;
    cached!.hasAttempted = true;
    console.info(
      '[SmartPay DB] External MongoDB not running. Operating on zero-latency local persistent store (.data/smartpay-db.json).'
    );
    return null;
  }
}

export default connectDB;
