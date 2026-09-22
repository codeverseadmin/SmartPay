import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    // Auto-create/recover demo account if database is freshly deployed
    if (!user && cleanEmail === 'demo@smartpay.local') {
      const passwordHash = await bcrypt.hash('demo123', 10);
      user = await User.create({
        email: 'demo@smartpay.local',
        passwordHash,
        merchantName: 'ABC Electronics',
        businessName: 'ABC Electronics',
        businessUpiId: 'abcelectronics@upi',
        businessPhone: '+91-98765-43210',
        businessEmail: 'demo@smartpay.local',
        displayName: 'ABC Electronics',
        invoicePrefix: 'SP',
        invoiceCounter: 1010,
        defaultMaxPayment: 1999,
        defaultStrategy: 'smart',
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let isValid = false;
    if (cleanEmail === 'demo@smartpay.local' && password === 'demo123') {
      isValid = true;
    } else {
      isValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      merchantName: user.merchantName,
      businessName: user.businessName,
    });

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        merchantName: user.merchantName,
        businessName: user.businessName,
        businessUpiId: user.businessUpiId,
        displayName: user.displayName,
        invoicePrefix: user.invoicePrefix,
        defaultMaxPayment: user.defaultMaxPayment,
        defaultStrategy: user.defaultStrategy,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
