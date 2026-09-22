'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

function formatINR(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    PAID: { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
    PARTIAL: { bg: '#fef3c7', color: '#b45309', label: 'Partial' },
    ACTIVE: { bg: '#dbeafe', color: '#1a4fd6', label: 'Active' },
    CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
    DRAFT: { bg: '#f4f4f5', color: '#52525b', label: 'Draft' },
  };
  const c = cfg[status] || cfg.ACTIVE;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
      {c.label}
    </span>
  );
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#2563eb', '#ef4444'];

interface AnalyticsData {
  summary: {
    todayCollected: number;
    todayPending: number;
    completedCount: number;
    activeCount: number;
    totalInvoices: number;
    totalVolume: number;
  };
  dailyData: Array<{ date: string; collected: number; pending: number }>;
  statusDistribution: Array<{ status: string; count: number; label: string }>;
  recentCollections: Array<{
    _id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    collectedAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'7' | '30'>('7');
  const [greeting, setGreeting] = useState('Good day');
  const [userName, setUserName] = useState('Merchant');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('sp_token');
    if (!token) return;
    try {
      const res = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
    const u = localStorage.getItem('sp_user');
    if (u) try { setUserName(JSON.parse(u).merchantName || JSON.parse(u).businessName || 'Merchant'); } catch {}
    fetchData();
  }, [fetchData]);

  const chartData = data?.dailyData?.slice(-(parseInt(chartRange))) || [];

  const kpis = [
    { label: "Today's Collections", value: formatINR(data?.summary.todayCollected || 0), icon: '↑', color: '#22c55e', bg: '#dcfce7' },
    { label: 'Pending', value: formatINR(data?.summary.todayPending || 0), icon: '⧖', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Completed Invoices', value: String(data?.summary.completedCount || 0), icon: '✓', color: '#2563eb', bg: '#dbeafe' },
    { label: 'Active Collections', value: String(data?.summary.activeCount || 0), icon: '◉', color: '#8b5cf6', bg: '#ede9fe' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.025em', margin: 0 }}>
            {greeting}, {userName} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Here's what's happening with your collections.
          </p>
        </div>
        <Link href="/create" style={{
          background: '#2563eb', color: 'white', borderRadius: '10px',
          padding: '0.625rem 1.25rem', fontWeight: 700, fontSize: '0.9375rem',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
        }}>
          ＋ New Collection
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
              <div style={{ width: '32px', height: '32px', background: kpi.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, fontWeight: 800, fontSize: '0.875rem' }}>{kpi.icon}</div>
            </div>
            <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.025em' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Area Chart */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.9375rem' }}>Collection Activity</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Collected vs Pending</div>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {(['7', '30'] as const).map((r) => (
                <button key={r} onClick={() => setChartRange(r)} style={{
                  padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem',
                  fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  background: chartRange === r ? '#0d1526' : 'transparent',
                  color: chartRange === r ? 'white' : '#64748b',
                  borderColor: chartRange === r ? '#0d1526' : '#e2e8f0',
                  transition: 'all 0.15s',
                }}>{r} Days</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [formatINR(Number(v))]} labelFormatter={(l: unknown) => `Date: ${l}`} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#2563eb" strokeWidth={2} fill="url(#gradCollected)" />
              <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPending)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Invoice Status</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.75rem' }}>Distribution</div>
          {data?.statusDistribution && data.statusDistribution.some(s => s.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.statusDistribution.filter(s => s.count > 0)}
                  dataKey="count" nameKey="label"
                  cx="50%" cy="45%" outerRadius={70} innerRadius={35}
                  paddingAngle={2}
                >
                  {data.statusDistribution.filter(s => s.count > 0).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem' }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v} invoices`, name as string]} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Collections */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#0a0f1e' }}>Recent Collections</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Latest payment activity</div>
          </div>
          <Link href="/collections" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>View all →</Link>
        </div>

        {/* Desktop table */}
        <div className="sp-hide-mobile">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Invoice', 'Customer', 'Amount', 'Collected', 'Status', 'Created', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#fafafa', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentCollections?.map((inv) => (
                <tr key={inv._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#0a0f1e', fontSize: '0.875rem' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: '1rem', color: '#374151', fontSize: '0.875rem' }}>{inv.customerName}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#0a0f1e', fontSize: '0.875rem' }}>{formatINR(inv.totalAmount)}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#16a34a', fontSize: '0.875rem' }}>{formatINR(inv.collectedAmount)}</td>
                  <td style={{ padding: '1rem' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8125rem' }}>
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Link href={`/collections/${inv._id}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>View →</Link>
                  </td>
                </tr>
              ))}
              {(!data?.recentCollections || data.recentCollections.length === 0) && (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No collections yet. Create your first collection to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sp-show-mobile" style={{ padding: '0.75rem' }}>
          {data?.recentCollections?.map((inv) => (
            <Link key={inv._id} href={`/collections/${inv._id}`} style={{ display: 'block', textDecoration: 'none', background: '#fafafa', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '0.875rem', marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.875rem' }}>{inv.invoiceNumber}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>{inv.customerName}</div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: '#0a0f1e' }}>{formatINR(inv.totalAmount)}</div>
                <div style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>{formatINR(inv.collectedAmount)} collected</div>
              </div>
            </Link>
          ))}
          {(!data?.recentCollections || data.recentCollections.length === 0) && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No collections yet.</div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .sp-show-mobile { display: none !important; } }
        @media (max-width: 767px) {
          .sp-hide-mobile { display: none !important; }
          div[style*="grid-template-columns: minmax(0, 2fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
