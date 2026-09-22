import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Invoice from '@/lib/db/models/Invoice';
import { verifyJWT, getTokenFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const start30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const merchantId = payload.userId;

    // All invoices for daily chart (last 30 days)
    const recentInvoices = await Invoice.find({
      merchantId,
      createdAt: { $gte: start30Days },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Today's stats
    const todayInvoices = await Invoice.find({
      merchantId,
      createdAt: { $gte: startOfToday },
    }).lean();

    const todayCollected = todayInvoices.reduce((sum, inv) => sum + (inv.collectedAmount || 0), 0);
    const todayPending = todayInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

    // Overall stats
    const allInvoices = await Invoice.find({ merchantId }).lean();
    const totalVolume = allInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalCollected = allInvoices.reduce((sum, inv) => sum + (inv.collectedAmount || 0), 0);
    const completedCount = allInvoices.filter((inv) => inv.status === 'PAID').length;
    const activeCount = allInvoices.filter(
      (inv) => inv.status === 'ACTIVE' || inv.status === 'PARTIAL'
    ).length;
    const partialCount = allInvoices.filter((inv) => inv.status === 'PARTIAL').length;
    const cancelledCount = allInvoices.filter((inv) => inv.status === 'CANCELLED').length;
    const avgInvoiceValue =
      allInvoices.length > 0 ? totalVolume / allInvoices.length : 0;

    // Build daily chart data (last 30 days)
    const dailyMap: Record<string, { collected: number; pending: number; date: string }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = {
        date: key,
        collected: 0,
        pending: 0,
      };
    }

    for (const inv of recentInvoices) {
      const key = new Date(inv.createdAt).toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].collected += inv.collectedAmount || 0;
        dailyMap[key].pending += inv.remainingAmount || 0;
      }
    }

    const dailyData = Object.values(dailyMap);

    // Status distribution
    const statusDistribution = [
      { status: 'PAID', count: completedCount, label: 'Paid' },
      { status: 'PARTIAL', count: partialCount, label: 'Partial' },
      { status: 'ACTIVE', count: activeCount - partialCount, label: 'Active' },
      { status: 'CANCELLED', count: cancelledCount, label: 'Cancelled' },
    ];

    // Strategy distribution
    const strategyMap = allInvoices.reduce(
      (acc, inv) => {
        const s = inv.strategy || 'single';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const recentCollections = await Invoice.find({ merchantId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('paymentParts')
      .lean();

    return NextResponse.json({
      summary: {
        todayCollected,
        todayPending,
        totalVolume,
        totalCollected,
        completedCount,
        activeCount,
        partialCount,
        cancelledCount,
        avgInvoiceValue,
        totalInvoices: allInvoices.length,
      },
      dailyData,
      statusDistribution,
      strategyDistribution: Object.entries(strategyMap).map(([strategy, count]) => ({
        strategy,
        count,
      })),
      recentCollections,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
