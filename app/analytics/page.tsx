'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

function formatINR(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));
}

const COLORS = ['#22c55e', '#f59e0b', '#2563eb', '#ef4444', '#7c3aed'];

interface AnalyticsData {
  summary: {
    todayCollected: number;
    todayPending: number;
    totalVolume: number;
    totalCollected: number;
    completedCount: number;
    activeCount: number;
    partialCount: number;
    cancelledCount: number;
    avgInvoiceValue: number;
    totalInvoices: number;
  };
  dailyData: Array<{ date: string; collected: number; pending: number }>;
  statusDistribution: Array<{ status: string; count: number; label: string }>;
  strategyDistribution: Array<{ strategy: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const token = localStorage.getItem('sp_token');
    const res = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const metrics = [
    { label: 'Total Collection Volume', value: formatINR(data?.summary.totalVolume || 0), sub: 'All time', icon: '₹', color: '#2563eb' },
    { label: 'Total Invoices', value: String(data?.summary.totalInvoices || 0), sub: 'Created', icon: '📋', color: '#7c3aed' },
    { label: 'Avg Invoice Value', value: formatINR(data?.summary.avgInvoiceValue || 0), sub: 'Per invoice', icon: '⌀', color: '#0891b2' },
    { label: 'Paid Invoices', value: String(data?.summary.completedCount || 0), sub: 'Completed', icon: '✓', color: '#16a34a' },
    { label: 'Partial Collections', value: String(data?.summary.partialCount || 0), sub: 'In progress', icon: '◑', color: '#f59e0b' },
    { label: 'Active Collections', value: String(data?.summary.activeCount || 0), sub: 'Pending start', icon: '◉', color: '#64748b' },
  ];

  const strategyLabels: Record<string, string> = { single: 'Single Payment', smart: 'Smart Split', custom: 'Custom Split' };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f1e', margin: 0, letterSpacing: '-0.025em' }}>Analytics</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Collection performance and insights</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: '0.875rem' }}>{m.icon}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color, letterSpacing: '-0.025em' }}>{m.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Daily Volume */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0a0f1e', marginBottom: '0.25rem' }}>Daily Collection Volume</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>Last 30 days</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.dailyData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [formatINR(Number(v))]} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#2563eb" strokeWidth={2.5} fill="url(#aGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0a0f1e', marginBottom: '0.25rem' }}>Invoice Status</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>Distribution</div>
          {data?.statusDistribution?.some(s => s.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.statusDistribution.filter(s => s.count > 0)} dataKey="count" nameKey="label" cx="50%" cy="45%" outerRadius={75} innerRadius={35} paddingAngle={2}>
                  {data.statusDistribution.filter(s => s.count > 0).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem' }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}`, name as string]} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data</div>
          )}
        </div>
      </div>

      {/* Strategy Bar Chart */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, color: '#0a0f1e', marginBottom: '0.25rem' }}>Collection Strategy Usage</div>
        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>How merchants split payments</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={(data?.strategyDistribution || []).map(s => ({ ...s, name: strategyLabels[s.strategy] || s.strategy }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
            <Bar dataKey="count" name="Invoices" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#0a0f1e', marginBottom: '1rem' }}>Collection Summary</div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[
            { label: 'Total Collection Volume', value: formatINR(data?.summary.totalVolume || 0) },
            { label: 'Total Amount Collected', value: formatINR(data?.summary.totalCollected || 0) },
            { label: 'Outstanding Balance', value: formatINR((data?.summary.totalVolume || 0) - (data?.summary.totalCollected || 0)) },
            { label: 'Collection Rate', value: data?.summary.totalVolume ? `${((data.summary.totalCollected / data.summary.totalVolume) * 100).toFixed(1)}%` : '0%' },
            { label: 'Average Invoice Value', value: formatINR(data?.summary.avgInvoiceValue || 0) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0a0f1e' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 767px) { div[style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
