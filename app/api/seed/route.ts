import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import Invoice from '@/lib/db/models/Invoice';
import PaymentPart from '@/lib/db/models/PaymentPart';
import { generateUPIUri } from '@/lib/business/upi';
import bcrypt from 'bcryptjs';

const DEMO_USER = {
  email: 'demo@smartpay.local',
  password: 'demo123',
  merchantName: 'ABC Electronics',
  businessName: 'ABC Electronics',
  businessUpiId: 'abcelectronics@upi',
  businessPhone: '+91-98765-43210',
  businessEmail: 'demo@smartpay.local',
  displayName: 'ABC Electronics',
  invoicePrefix: 'SP',
  invoiceCounter: 1009,
  defaultMaxPayment: 1999,
  defaultStrategy: 'smart' as const,
};

interface SeedPart {
  sequence: number;
  amount: number;
  status: 'PENDING' | 'MERCHANT_CONFIRMED' | 'CANCELLED';
}

interface SeedInvoice {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  description: string;
  totalAmount: number;
  strategy: 'single' | 'smart' | 'custom';
  maxPaymentAmount?: number;
  status: 'PAID' | 'PARTIAL' | 'ACTIVE' | 'CANCELLED';
  parts: SeedPart[];
  daysAgo: number;
}

const SEED_INVOICES: SeedInvoice[] = [
  {
    invoiceNumber: 'SP-1001',
    customerName: 'Rahul Das',
    customerPhone: '+91-98765-11001',
    description: 'Samsung Smart TV 55" 4K',
    totalAmount: 5000,
    strategy: 'smart',
    maxPaymentAmount: 1999,
    status: 'PAID',
    parts: [
      { sequence: 1, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 2, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 3, amount: 1002, status: 'MERCHANT_CONFIRMED' },
    ],
    daysAgo: 0,
  },
  {
    invoiceNumber: 'SP-1002',
    customerName: 'Amit Roy',
    customerPhone: '+91-98765-11002',
    description: 'LG Refrigerator 350L Double Door',
    totalAmount: 12000,
    strategy: 'smart',
    maxPaymentAmount: 1999,
    status: 'PARTIAL',
    parts: [
      { sequence: 1, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 2, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 3, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 4, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 5, amount: 1999, status: 'PENDING' },
      { sequence: 6, amount: 2005, status: 'PENDING' },
    ],
    daysAgo: 0,
  },
  {
    invoiceNumber: 'SP-1003',
    customerName: 'Sourav Electronics',
    customerPhone: '+91-98765-11003',
    description: 'Wholesale Electronics - B2B Order #5531',
    totalAmount: 25000,
    strategy: 'smart',
    maxPaymentAmount: 1999,
    status: 'PAID',
    parts: [
      { sequence: 1, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 2, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 3, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 4, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 5, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 6, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 7, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 8, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 9, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 10, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 11, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 12, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 13, amount: 1012, status: 'MERCHANT_CONFIRMED' },
    ],
    daysAgo: 1,
  },
  {
    invoiceNumber: 'SP-1004',
    customerName: 'Priya Sharma',
    customerPhone: '+91-98765-11004',
    description: 'iPhone 15 Pro Max 256GB Natural Titanium',
    totalAmount: 8750,
    strategy: 'smart',
    maxPaymentAmount: 1999,
    status: 'ACTIVE',
    parts: [
      { sequence: 1, amount: 1999, status: 'PENDING' },
      { sequence: 2, amount: 1999, status: 'PENDING' },
      { sequence: 3, amount: 1999, status: 'PENDING' },
      { sequence: 4, amount: 1999, status: 'PENDING' },
      { sequence: 5, amount: 754, status: 'PENDING' },
    ],
    daysAgo: 1,
  },
  {
    invoiceNumber: 'SP-1005',
    customerName: 'Mehta Furniture',
    customerPhone: '+91-98765-11005',
    description: 'Modular Sofa Set - Living Room',
    totalAmount: 37500,
    strategy: 'custom',
    status: 'PARTIAL',
    parts: [
      { sequence: 1, amount: 10000, status: 'MERCHANT_CONFIRMED' },
      { sequence: 2, amount: 10000, status: 'MERCHANT_CONFIRMED' },
      { sequence: 3, amount: 10000, status: 'PENDING' },
      { sequence: 4, amount: 7500, status: 'PENDING' },
    ],
    daysAgo: 3,
  },
  {
    invoiceNumber: 'SP-1006',
    customerName: 'Sunita Devi',
    customerPhone: '+91-98765-11006',
    description: 'Washing Machine 7kg Fully Automatic',
    totalAmount: 2500,
    strategy: 'single',
    status: 'PAID',
    parts: [{ sequence: 1, amount: 2500, status: 'MERCHANT_CONFIRMED' }],
    daysAgo: 5,
  },
  {
    invoiceNumber: 'SP-1007',
    customerName: 'Kumar & Sons',
    customerPhone: '+91-98765-11007',
    description: 'Industrial Printer - Office Equipment',
    totalAmount: 15000,
    strategy: 'smart',
    maxPaymentAmount: 1999,
    status: 'CANCELLED',
    parts: [
      { sequence: 1, amount: 1999, status: 'CANCELLED' },
      { sequence: 2, amount: 1999, status: 'CANCELLED' },
      { sequence: 3, amount: 1999, status: 'CANCELLED' },
      { sequence: 4, amount: 1999, status: 'CANCELLED' },
      { sequence: 5, amount: 1999, status: 'CANCELLED' },
      { sequence: 6, amount: 1999, status: 'CANCELLED' },
      { sequence: 7, amount: 1999, status: 'CANCELLED' },
      { sequence: 8, amount: 1013, status: 'CANCELLED' },
    ],
    daysAgo: 7,
  },
  {
    invoiceNumber: 'SP-1008',
    customerName: 'Delhi Traders',
    customerPhone: '+91-98765-11008',
    description: 'Bulk Electronics Order - Q3 2026',
    totalAmount: 18000,
    strategy: 'smart',
    maxPaymentAmount: 1999,
    status: 'PARTIAL',
    parts: [
      { sequence: 1, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 2, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 3, amount: 1999, status: 'MERCHANT_CONFIRMED' },
      { sequence: 4, amount: 1999, status: 'PENDING' },
      { sequence: 5, amount: 1999, status: 'PENDING' },
      { sequence: 6, amount: 1999, status: 'PENDING' },
      { sequence: 7, amount: 1999, status: 'PENDING' },
      { sequence: 8, amount: 1999, status: 'PENDING' },
      { sequence: 9, amount: 1008, status: 'PENDING' },
    ],
    daysAgo: 10,
  },
];

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Seed not allowed in production' }, { status: 403 });
    }

    await connectDB();

    // Clean existing demo data
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    if (existingUser) {
      await Invoice.deleteMany({ merchantId: existingUser._id });
      await PaymentPart.deleteMany({});
      await User.deleteOne({ _id: existingUser._id });
    }

    // Create demo user
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
    const user = await User.create({
      ...DEMO_USER,
      passwordHash,
    });

    // Create invoices + parts
    for (const inv of SEED_INVOICES) {
      const createdAt = new Date(Date.now() - inv.daysAgo * 24 * 60 * 60 * 1000);

      // Calculate actual collected/remaining based on parts
      const collectedAmount = inv.parts
        .filter((p) => p.status === 'MERCHANT_CONFIRMED')
        .reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = inv.totalAmount - collectedAmount;

      const invoice = await Invoice.create({
        invoiceNumber: inv.invoiceNumber,
        merchantId: user._id,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        merchantUpiId: DEMO_USER.businessUpiId,
        merchantName: DEMO_USER.businessName,
        description: inv.description,
        totalAmount: inv.totalAmount,
        collectedAmount,
        remainingAmount,
        status: inv.status,
        strategy: inv.strategy,
        maxPaymentAmount: inv.maxPaymentAmount,
        auditLog: [
          { action: 'COLLECTION_CREATED', timestamp: createdAt },
          { action: 'PAYMENT_PLAN_CREATED', timestamp: new Date(createdAt.getTime() + 60000) },
          ...(inv.status === 'PAID'
            ? [{ action: 'INVOICE_PAID', timestamp: new Date(createdAt.getTime() + 3600000) }]
            : []),
          ...(inv.status === 'CANCELLED'
            ? [{ action: 'INVOICE_CANCELLED', timestamp: new Date(createdAt.getTime() + 1800000) }]
            : []),
        ],
        createdAt,
      });

      const partIds = [];
      for (const part of inv.parts) {
        const upiUri = generateUPIUri({
          pa: DEMO_USER.businessUpiId,
          pn: DEMO_USER.businessName,
          am: part.amount,
          tn: `${inv.invoiceNumber} - Payment ${part.sequence}`,
          tr: `${inv.invoiceNumber}-P${part.sequence}`,
        });

        const confirmedAt =
          part.status === 'MERCHANT_CONFIRMED'
            ? new Date(createdAt.getTime() + part.sequence * 300000)
            : undefined;

        const pp = await PaymentPart.create({
          invoiceId: invoice._id,
          sequence: part.sequence,
          amount: part.amount,
          status: part.status,
          upiUri,
          confirmedAt,
          createdAt,
        });
        partIds.push(pp._id);
      }

      await Invoice.findByIdAndUpdate(invoice._id, { paymentParts: partIds });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      credentials: { email: DEMO_USER.email, password: DEMO_USER.password },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed: ' + String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed demo data',
    credentials: { email: 'demo@smartpay.local', password: 'demo123' },
  });
}
