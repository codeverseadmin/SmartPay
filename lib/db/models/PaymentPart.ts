import mongoose, { Schema, Document, Model } from 'mongoose';
import { isMongoConnected } from '../mongoose';
import { LocalPaymentPart } from '../localStore';

export type PaymentPartStatus = 'PENDING' | 'MERCHANT_CONFIRMED' | 'CANCELLED';

export interface IPaymentPart extends Document {
  invoiceId: any;
  sequence: number;
  amount: number;
  status: PaymentPartStatus;
  upiUri: string;
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  note?: string;
}

const PaymentPartSchema = new Schema<IPaymentPart>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    sequence: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: {
      type: String,
      enum: ['PENDING', 'MERCHANT_CONFIRMED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    upiUri: { type: String, required: true },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true }
);

const MongoosePaymentPart: Model<IPaymentPart> =
  mongoose.models.PaymentPart ||
  mongoose.model<IPaymentPart>('PaymentPart', PaymentPartSchema);

const PaymentPartProxy = new Proxy(MongoosePaymentPart, {
  get(target, prop, receiver) {
    if (isMongoConnected()) {
      return Reflect.get(target, prop, receiver);
    }
    return Reflect.get(LocalPaymentPart, prop);
  },
  construct(target, args) {
    if (isMongoConnected()) {
      return new (target as any)(...args);
    }
    return new (LocalPaymentPart as any)(...args);
  },
});

export default PaymentPartProxy as unknown as Model<IPaymentPart>;
