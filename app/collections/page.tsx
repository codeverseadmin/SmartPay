'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

function formatINR(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  description: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  status: string;
  strategy: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    PAID: { bg: '#dcfce7', color: '#15803d' },
    PARTIAL: { bg: '#fef3c7', color: '#b45309' },
    ACTIVE: { bg: '#dbeafe', color: '#1a4fd6' },
    CANCELLED: { bg: '#fee2e2', color: '#b91c1c' },
    DRAFT: { bg: '#f4f4f5', color: '#52525b' },
  };
  const c = cfg[status] || cfg.ACTIVE;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

export default function CollectionsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('-createdAt');
  const [total, setTotal] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('sp_token');
    const params = new URLSearchParams({ sort, limit: '50' });
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await fetch(`/api/collections?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      setInvoices(d.invoices || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  }, [search, statusFilter, sort]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(t);
  }, [fetchInvoices]);

  const filterBtns = ['ALL', 'ACTIVE', 'PARTIAL', 'PAID', 'CANCELLED'];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f1e', margin: 0, letterSpacing: '-0.025em' }}>Collections</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>{total} total invoices</p>
        </div>
        <Link href="/create" style={{ background: '#2563eb', color: 'white', padding: '0.625rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          ＋ New Collection
        </Link>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice, customer, phone…"
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#0a0f1e', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {filterBtns.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{
              padding: '0.375rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: statusFilter === f ? '#0d1526' : 'transparent',
              color: statusFilter === f ? 'white' : '#64748b',
              borderColor: statusFilter === f ? '#0d1526' : '#e2e8f0',
              transition: 'all 0.15s',
            }}>{f}</button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#374151', outline: 'none', cursor: 'pointer' }}
        >
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-totalAmount">Highest amount</option>
          <option value="totalAmount">Lowest amount</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 1rem' }} />
          Loading collections…
        </div>
      )}

      {/* Desktop Table */}
      {!loading && (
        <div>
          <div className="sp-hide-mobile" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Invoice', 'Customer', 'Amount', 'Collected', 'Status', 'Created', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#fafafa', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const progressPct = Math.min(100, (inv.collectedAmount / inv.totalAmount) * 100);
                  return (
                    <tr key={inv._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.875rem' }}>{inv.invoiceNumber}</div>
                        {inv.description && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{inv.description}</div>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>{inv.customerName}</div>
                        {inv.customerPhone && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{inv.customerPhone}</div>}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#0a0f1e', fontSize: '0.9375rem' }}>{formatINR(inv.totalAmount)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{formatINR(inv.collectedAmount)}</div>
                        <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '999px', width: '80px' }}>
                          <div style={{ height: '100%', borderRadius: '999px', background: '#22c55e', width: `${progressPct}%` }} />
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}><StatusBadge status={inv.status} /></td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8125rem' }}>
                        {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(inv.createdAt))}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/collections/${inv._id}`} style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '0.375rem 0.75rem', borderRadius: '6px' }}>View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {invoices.length === 0 && (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>No collections found</div>
                <div style={{ fontSize: '0.875rem' }}>Try adjusting your filters or create a new collection</div>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="sp-show-mobile">
            {invoices.map((inv) => (
              <Link key={inv._id} href={`/collections/${inv._id}`} style={{ display: 'block', textDecoration: 'none', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.9375rem' }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{inv.customerName}</div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0a0f1e' }}>{formatINR(inv.totalAmount)}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>{formatINR(inv.collectedAmount)} collected</div>
                </div>
                {inv.description && <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.375rem' }}>{inv.description}</div>}
              </Link>
            ))}
            {invoices.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                No collections found
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) { .sp-show-mobile { display: none !important; } }
        @media (max-width: 767px) { .sp-hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
