import mongoose, { Schema, Document, Model } from 'mongoose';
import { isMongoConnected } from '../mongoose';
import { LocalCustomer } from '../localStore';

export interface ICustomer extends Document {
  merchantId: any;
  name: string;
  phone: string;
  email: string;
  totalInvoices: number;
  totalCollected: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    totalInvoices: { type: Number, default: 0 },
    totalCollected: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CustomerSchema.index({ merchantId: 1, name: 1 });

const MongooseCustomer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

const CustomerProxy = new Proxy(MongooseCustomer, {
  get(target, prop, receiver) {
    if (isMongoConnected()) {
      return Reflect.get(target, prop, receiver);
    }
    return Reflect.get(LocalCustomer, prop);
  },
  construct(target, args) {
    if (isMongoConnected()) {
      return new (target as any)(...args);
    }
    return new (LocalCustomer as any)(...args);
  },
});

export default CustomerProxy as unknown as Model<ICustomer>;
