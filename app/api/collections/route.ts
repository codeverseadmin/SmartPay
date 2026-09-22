import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Invoice from '@/lib/db/models/Invoice';
import PaymentPart from '@/lib/db/models/PaymentPart';
import User from '@/lib/db/models/User';
import { verifyJWT, getTokenFromRequest } from '@/lib/auth';
import { calculateSmartSplit, validatePaymentPlan } from '@/lib/business/splitEngine';
import { generateUPIUri } from '@/lib/business/upi';
import { generateInvoiceNumber } from '@/lib/business/reconciliation';

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || '-createdAt';

    const query: Record<string, unknown> = { merchantId: payload.userId };
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('paymentParts')
      .lean();

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error) {
    console.error('GET /api/collections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      invoiceNumber: providedInvoiceNumber,
      description,
      totalAmount,
      merchantUpiId,
      strategy,
      maxPaymentAmount,
      customParts,
    } = body;

    // Validation
    if (!customerName?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be greater than zero' }, { status: 400 });
    }
    if (!merchantUpiId?.trim()) {
      return NextResponse.json({ error: 'Merchant UPI ID is required' }, { status: 400 });
    }

    // Get merchant info for invoice counter
    const merchant = await User.findById(payload.userId);
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    // Generate invoice number
    let invoiceNumber = providedInvoiceNumber?.trim();
    if (!invoiceNumber) {
      invoiceNumber = generateInvoiceNumber(merchant.invoicePrefix, merchant.invoiceCounter);
      await User.findByIdAndUpdate(payload.userId, { $inc: { invoiceCounter: 1 } });
    }

    // Check for duplicate invoice number
    const existing = await Invoice.findOne({ invoiceNumber, merchantId: payload.userId });
    if (existing) {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 });
    }

    // Calculate payment parts based on strategy
    let splitParts: { sequence: number; amount: number }[] = [];

    if (strategy === 'single') {
      splitParts = [{ sequence: 1, amount: totalAmount }];
    } else if (strategy === 'smart') {
      if (!maxPaymentAmount || maxPaymentAmount <= 0) {
        return NextResponse.json({ error: 'Maximum payment amount is required for smart split' }, { status: 400 });
      }
      const splitResult = calculateSmartSplit(totalAmount, maxPaymentAmount);
      if (!splitResult.isValid) {
        return NextResponse.json({ error: 'Could not generate valid payment plan' }, { status: 400 });
      }
      splitParts = splitResult.parts;
    } else if (strategy === 'custom') {
      if (!customParts || customParts.length === 0) {
        return NextResponse.json({ error: 'Custom payment parts are required' }, { status: 400 });
      }
      const validation = validatePaymentPlan(customParts, totalAmount);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.errors.join('. ') }, { status: 400 });
      }
      splitParts = customParts.map((p: { amount: number }, i: number) => ({
        sequence: i + 1,
        amount: p.amount,
      }));
    }

    // Create Invoice
    const invoice = new Invoice({
      invoiceNumber,
      merchantId: payload.userId,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || '',
      merchantUpiId: merchantUpiId.trim(),
      merchantName: merchant.businessName,
      description: description?.trim() || '',
      totalAmount,
      collectedAmount: 0,
      remainingAmount: totalAmount,
      status: 'ACTIVE',
      strategy,
      maxPaymentAmount: strategy === 'smart' ? maxPaymentAmount : undefined,
      auditLog: [
        {
          action: 'COLLECTION_CREATED',
          timestamp: new Date(),
          metadata: { invoiceNumber, totalAmount, strategy },
        },
      ],
    });

    await invoice.save();

    // Create PaymentParts
    const partDocs = [];
    for (const part of splitParts) {
      const upiUri = generateUPIUri({
        pa: merchantUpiId.trim(),
        pn: merchant.businessName,
        am: part.amount,
        tn: `${invoiceNumber} - Payment ${part.sequence}`,
        tr: `${invoiceNumber}-P${part.sequence}`,
      });

      const paymentPart = new PaymentPart({
        invoiceId: invoice._id,
        sequence: part.sequence,
        amount: part.amount,
        status: 'PENDING',
        upiUri,
      });

      await paymentPart.save();
      partDocs.push(paymentPart);
    }

    // Update invoice with part references
    invoice.paymentParts = partDocs.map((p) => p._id);
    invoice.auditLog.push({
      action: 'PAYMENT_PLAN_CREATED',
      timestamp: new Date(),
      metadata: { parts: splitParts.length, strategy },
    });
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id).populate('paymentParts').lean();

    return NextResponse.json({ invoice: populatedInvoice }, { status: 201 });
  } catch (error) {
    console.error('POST /api/collections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
