import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Invoice from '@/lib/db/models/Invoice';
import PaymentPart from '@/lib/db/models/PaymentPart';
import { verifyJWT, getTokenFromRequest } from '@/lib/auth';
import {
  calculateCollectedAmount,
  calculateRemainingAmount,
  calculateInvoiceStatus,
} from '@/lib/business/reconciliation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    // Allow public access for customer payment page
    const invoice = await Invoice.findById(id).populate('paymentParts').lean();
    if (!invoice) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('GET /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const invoice = await Invoice.findOne({ _id: id, merchantId: payload.userId });
    if (!invoice) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    invoice.status = 'CANCELLED';
    invoice.auditLog.push({
      action: 'INVOICE_CANCELLED',
      timestamp: new Date(),
    });
    await invoice.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // POST to /api/collections/[id] — confirm payment part
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { partId, action } = await req.json();

    await connectDB();

    const invoice = await Invoice.findOne({ _id: id, merchantId: payload.userId }).populate(
      'paymentParts'
    );
    if (!invoice) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    const part = await PaymentPart.findOne({ _id: partId, invoiceId: id });
    if (!part) return NextResponse.json({ error: 'Payment part not found' }, { status: 404 });

    if (action === 'confirm') {
      if (part.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Payment part is not in pending state' },
          { status: 400 }
        );
      }
      part.status = 'MERCHANT_CONFIRMED';
      part.confirmedAt = new Date();
      await part.save();

      invoice.auditLog.push({
        action: 'PAYMENT_CONFIRMED',
        timestamp: new Date(),
        metadata: { partId: part._id, amount: part.amount, sequence: part.sequence },
      });
    } else if (action === 'cancel') {
      part.status = 'CANCELLED';
      part.cancelledAt = new Date();
      await part.save();

      invoice.auditLog.push({
        action: 'PAYMENT_CANCELLED',
        timestamp: new Date(),
        metadata: { partId: part._id, amount: part.amount, sequence: part.sequence },
      });
    }

    // Recalculate invoice totals
    const allParts = await PaymentPart.find({ invoiceId: id });
    const collectedAmount = calculateCollectedAmount(allParts);
    const remainingAmount = calculateRemainingAmount(invoice.totalAmount, collectedAmount);
    const newStatus = calculateInvoiceStatus(allParts, invoice.totalAmount, invoice.status);

    if (newStatus === 'PAID' && invoice.status !== 'PAID') {
      invoice.auditLog.push({
        action: 'INVOICE_PAID',
        timestamp: new Date(),
        metadata: { totalAmount: invoice.totalAmount },
      });
    }

    invoice.collectedAmount = collectedAmount;
    invoice.remainingAmount = remainingAmount;
    invoice.status = newStatus;
    await invoice.save();

    const updated = await Invoice.findById(id).populate('paymentParts').lean();
    return NextResponse.json({ invoice: updated });
  } catch (error) {
    console.error('POST /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
