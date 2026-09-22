import mongoose, { Schema, Document, Model } from 'mongoose';
import { isMongoConnected } from '../mongoose';
import { LocalInvoice } from '../localStore';

export type InvoiceStatus = 'DRAFT' | 'ACTIVE' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type CollectionStrategy = 'single' | 'smart' | 'custom';

export interface IAuditEntry {
  action: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  merchantId: any;
  customerId?: any;
  customerName: string;
  customerPhone: string;
  merchantUpiId: string;
  merchantName: string;
  description: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  strategy: CollectionStrategy;
  maxPaymentAmount?: number;
  paymentParts: any[];
  auditLog: IAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const AuditEntrySchema = new Schema<IAuditEntry>(
  {
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '', trim: true },
    merchantUpiId: { type: String, required: true },
    merchantName: { type: String, required: true },
    description: { type: String, default: '' },
    totalAmount: { type: Number, required: true, min: 0.01 },
    collectedAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PARTIAL', 'PAID', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    strategy: {
      type: String,
      enum: ['single', 'smart', 'custom'],
      default: 'smart',
    },
    maxPaymentAmount: { type: Number },
    paymentParts: [{ type: Schema.Types.ObjectId, ref: 'PaymentPart' }],
    auditLog: [AuditEntrySchema],
  },
  { timestamps: true }
);

InvoiceSchema.index({ merchantId: 1, createdAt: -1 });
InvoiceSchema.index({ merchantId: 1, status: 1 });

const MongooseInvoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

const InvoiceProxy = new Proxy(MongooseInvoice, {
  get(target, prop, receiver) {
    if (isMongoConnected()) {
      return Reflect.get(target, prop, receiver);
    }
    return Reflect.get(LocalInvoice, prop);
  },
  construct(target, args) {
    if (isMongoConnected()) {
      return new (target as any)(...args);
    }
    return new (LocalInvoice as any)(...args);
  },
});

export default InvoiceProxy as unknown as Model<IInvoice>;
