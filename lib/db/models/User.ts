import mongoose, { Schema, Document, Model } from 'mongoose';
import { isMongoConnected } from '../mongoose';
import { LocalUser } from '../localStore';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  merchantName: string;
  businessName: string;
  businessUpiId: string;
  businessPhone: string;
  businessEmail: string;
  displayName: string;
  invoicePrefix: string;
  invoiceCounter: number;
  defaultMaxPayment: number;
  defaultStrategy: 'single' | 'smart' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    merchantName: { type: String, required: true },
    businessName: { type: String, required: true },
    businessUpiId: { type: String, required: true },
    businessPhone: { type: String, default: '' },
    businessEmail: { type: String, default: '' },
    displayName: { type: String, required: true },
    invoicePrefix: { type: String, default: 'SP' },
    invoiceCounter: { type: Number, default: 1000 },
    defaultMaxPayment: { type: Number, default: 1999 },
    defaultStrategy: { type: String, enum: ['single', 'smart', 'custom'], default: 'smart' },
  },
  { timestamps: true }
);

const MongooseUser: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

const UserProxy = new Proxy(MongooseUser, {
  get(target, prop, receiver) {
    if (isMongoConnected()) {
      return Reflect.get(target, prop, receiver);
    }
    return Reflect.get(LocalUser, prop);
  },
  construct(target, args) {
    if (isMongoConnected()) {
      return new (target as any)(...args);
    }
    return new (LocalUser as any)(...args);
  },
});

export default UserProxy as unknown as Model<IUser>;
