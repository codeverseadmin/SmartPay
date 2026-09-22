'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';

function formatINR(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(d));
}

interface PaymentPart {
  _id: string;
  sequence: number;
  amount: number;
  status: 'PENDING' | 'MERCHANT_CONFIRMED' | 'CANCELLED';
  upiUri: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  merchantUpiId: string;
  merchantName: string;
  description: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  status: string;
  strategy: string;
  maxPaymentAmount?: number;
  paymentParts: PaymentPart[];
  auditLog: Array<{ action: string; timestamp: string; metadata?: Record<string, unknown> }>;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    PAID: { bg: '#dcfce7', color: '#15803d', label: 'PAID' },
    PARTIAL: { bg: '#fef3c7', color: '#b45309', label: 'PARTIAL' },
    ACTIVE: { bg: '#dbeafe', color: '#1a4fd6', label: 'ACTIVE' },
    CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'CANCELLED' },
    PENDING: { bg: '#f4f4f5', color: '#52525b', label: 'PENDING' },
    MERCHANT_CONFIRMED: { bg: '#dcfce7', color: '#15803d', label: 'Merchant-Confirmed' },
  };
  const c = cfg[status] || cfg.ACTIVE;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
      {c.label}
    </span>
  );
}

function QRModal({ upiUri, amount, sequence, onClose }: { upiUri: string; amount: number; sequence: number; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(upiUri, { width: 280, margin: 2, color: { dark: '#0a0f1e', light: '#ffffff' } })
      .then(setQrDataUrl);
  }, [upiUri]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0a0f1e', marginBottom: '0.25rem' }}>Payment {sequence}</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.25rem' }}>{formatINR(amount)}</div>
        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>Scan with any UPI app to pay</div>

        {qrDataUrl ? (
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', marginBottom: '1.25rem' }}>
            <img src={qrDataUrl} alt="UPI QR Code" style={{ width: '240px', height: '240px' }} />
          </div>
        ) : (
          <div style={{ width: '240px', height: '240px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#94a3b8', fontSize: '0.875rem' }}>Generating QR...</div>
        )}

        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem', background: '#f8fafc', borderRadius: '8px', padding: '0.5rem 0.75rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {upiUri}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <a href={upiUri} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: '#2563eb', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
            Open UPI App
          </a>
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'none', border: '1.5px solid #e2e8f0', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          Close
        </button>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
          ⓘ Payment must be confirmed by merchant after receipt
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

function ConfirmModal({ part, onConfirm, onClose, loading }: { part: PaymentPart; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ width: '56px', height: '56px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>✓</div>
        <h3 style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 800, color: '#0a0f1e', marginBottom: '0.5rem' }}>Confirm Payment</h3>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Confirm that you have received <strong style={{ color: '#0a0f1e' }}>{formatINR(part.amount)}</strong> for Payment {part.sequence}?
        </p>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#92400e', textAlign: 'center' }}>
          ⚠ This will be recorded as a <strong>merchant-confirmed payment</strong>.<br />
          SmartPay does not verify bank transactions.
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'white', border: '1.5px solid #e2e8f0', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: loading ? '#86efac' : '#22c55e', color: 'white', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />Confirming...</> : 'Confirm Payment'}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmPart, setConfirmPart] = useState<PaymentPart | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [qrPart, setQrPart] = useState<PaymentPart | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'timeline'>('payments');

  const fetchInvoice = useCallback(async () => {
    const token = localStorage.getItem('sp_token');
    const res = await fetch(`/api/collections/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setInvoice(d.invoice); }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const handleConfirm = async () => {
    if (!confirmPart) return;
    setConfirmLoading(true);
    const token = localStorage.getItem('sp_token');
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ partId: confirmPart._id, action: 'confirm' }),
      });
      if (res.ok) { const d = await res.json(); setInvoice(d.invoice); }
    } finally {
      setConfirmLoading(false);
      setConfirmPart(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ color: '#0a0f1e', marginBottom: '0.5rem' }}>Collection Not Found</h2>
        <Link href="/collections" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>← Back to Collections</Link>
      </div>
    );
  }

  const progressPct = Math.min(100, (invoice.collectedAmount / invoice.totalAmount) * 100);
  const parts = invoice.paymentParts || [];
  const pendingParts = parts.filter(p => p.status === 'PENDING');

  const auditLabels: Record<string, { icon: string; label: string; color: string }> = {
    COLLECTION_CREATED: { icon: '📋', label: 'Collection created', color: '#2563eb' },
    PAYMENT_PLAN_CREATED: { icon: '⚡', label: 'Payment plan generated', color: '#7c3aed' },
    PAYMENT_CONFIRMED: { icon: '✓', label: 'Payment merchant-confirmed', color: '#16a34a' },
    PAYMENT_CANCELLED: { icon: '✕', label: 'Payment cancelled', color: '#dc2626' },
    INVOICE_PAID: { icon: '🎉', label: 'Invoice fully paid', color: '#16a34a' },
    INVOICE_CANCELLED: { icon: '🚫', label: 'Invoice cancelled', color: '#dc2626' },
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#64748b' }}>
        <Link href="/collections" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Collections</Link>
        <span>›</span>
        <span style={{ color: '#0a0f1e', fontWeight: 600 }}>{invoice.invoiceNumber}</span>
      </div>

      {/* Invoice Header Card */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem' }}>Invoice</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.025em', margin: 0 }}>{invoice.invoiceNumber}</h1>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              {invoice.customerName}{invoice.customerPhone ? ` • ${invoice.customerPhone}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={invoice.status} />
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0a0f1e', marginTop: '0.5rem', letterSpacing: '-0.025em' }}>{formatINR(invoice.totalAmount)}</div>
            {invoice.description && <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{invoice.description}</div>}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 600 }}>
              {formatINR(invoice.collectedAmount)} collected
            </span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {formatINR(invoice.remainingAmount)} remaining
            </span>
          </div>
          <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              background: invoice.status === 'PAID'
                ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                : 'linear-gradient(90deg, #2563eb, #60a5fa)',
              width: `${progressPct}%`, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.375rem', textAlign: 'right' }}>
            {progressPct.toFixed(0)}% collected
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Merchant UPI', value: invoice.merchantUpiId },
            { label: 'Strategy', value: invoice.strategy === 'single' ? 'Single Payment' : invoice.strategy === 'smart' ? 'Smart Split' : 'Custom Split' },
            { label: 'Payment Steps', value: `${parts.length} step${parts.length !== 1 ? 's' : ''}` },
            { label: 'Pending', value: `${pendingParts.length} step${pendingParts.length !== 1 ? 's' : ''}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.625rem 0.875rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0f1e' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Customer pay link */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#1a4fd6', fontWeight: 500 }}>Customer payment page:</span>
          <a href={`/pay/${invoice._id}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
            /pay/{invoice._id.slice(-8)} ↗
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'white', borderRadius: '10px', padding: '0.25rem', border: '1px solid #e2e8f0' }}>
        {(['payments', 'timeline'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            background: activeTab === tab ? '#0d1526' : 'transparent',
            color: activeTab === tab ? 'white' : '#64748b',
          }}>
            {tab === 'payments' ? `Payment Steps (${parts.length})` : 'Timeline'}
          </button>
        ))}
      </div>

      {/* Payment Parts */}
      {activeTab === 'payments' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {parts.map((part) => (
            <div key={part._id} style={{
              background: 'white', borderRadius: '16px',
              border: `1.5px solid ${part.status === 'MERCHANT_CONFIRMED' ? '#bbf7d0' : part.status === 'CANCELLED' ? '#fecaca' : '#e2e8f0'}`,
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0,
                    background: part.status === 'MERCHANT_CONFIRMED' ? '#dcfce7' : part.status === 'CANCELLED' ? '#fee2e2' : '#dbeafe',
                    color: part.status === 'MERCHANT_CONFIRMED' ? '#15803d' : part.status === 'CANCELLED' ? '#dc2626' : '#2563eb',
                  }}>
                    {part.status === 'MERCHANT_CONFIRMED' ? '✓' : part.status === 'CANCELLED' ? '✕' : part.sequence}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0a0f1e' }}>Payment {part.sequence}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {part.status === 'MERCHANT_CONFIRMED' && part.confirmedAt
                        ? `Confirmed ${formatDate(part.confirmedAt)}`
                        : part.status === 'CANCELLED' ? 'Cancelled'
                        : 'Awaiting collection'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.025em' }}>{formatINR(part.amount)}</div>
                  <StatusBadge status={part.status} />
                </div>
              </div>

              {part.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setQrPart(part)}
                    style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: '#0d1526', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', minWidth: '120px' }}
                  >
                    📱 Show QR
                  </button>
                  <a
                    href={part.upiUri}
                    style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', textAlign: 'center', minWidth: '120px' }}
                  >
                    🔗 Open UPI
                  </a>
                  <button
                    onClick={() => setConfirmPart(part)}
                    style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: '#22c55e', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', minWidth: '160px' }}
                  >
                    ✓ Mark as Received
                  </button>
                </div>
              )}
            </div>
          ))}

          {parts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No payment steps found</div>
          )}
        </div>
      )}

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {invoice.auditLog?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No timeline events</div>
          )}
          {[...invoice.auditLog].reverse().map((entry, idx) => {
            const cfg = auditLabels[entry.action] || { icon: '•', label: entry.action, color: '#94a3b8' };
            return (
              <div key={idx} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', marginBottom: idx < invoice.auditLog.length - 1 ? '0.5rem' : 0, borderBottom: idx < invoice.auditLog.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: '32px', height: '32px', background: `${cfg.color}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>{cfg.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0a0f1e', fontSize: '0.875rem' }}>{cfg.label}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>{formatDate(entry.timestamp)}</div>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {entry.metadata.amount ? `Amount: ${formatINR(Number(entry.metadata.amount))}` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      {qrPart && <QRModal upiUri={qrPart.upiUri} amount={qrPart.amount} sequence={qrPart.sequence} onClose={() => setQrPart(null)} />}

      {/* Confirm Modal */}
      {confirmPart && <ConfirmModal part={confirmPart} onConfirm={handleConfirm} onClose={() => setConfirmPart(null)} loading={confirmLoading} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
