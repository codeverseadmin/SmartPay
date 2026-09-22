'use client';

import { useState, useEffect, use } from 'react';
import QRCode from 'qrcode';

function formatINR(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}

interface PaymentPart {
  _id: string;
  sequence: number;
  amount: number;
  status: 'PENDING' | 'MERCHANT_CONFIRMED' | 'CANCELLED';
  upiUri: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  merchantName: string;
  description: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  status: string;
  paymentParts: PaymentPart[];
}

function QRDisplay({ upiUri, amount }: { upiUri: string; amount: number }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(upiUri, { width: 260, margin: 2, color: { dark: '#0a0f1e', light: '#ffffff' } })
      .then(setQrDataUrl);
  }, [upiUri]);

  return (
    <div style={{ textAlign: 'center' }}>
      {qrDataUrl ? (
        <div style={{ display: 'inline-block', padding: '1.25rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <img src={qrDataUrl} alt="UPI Payment QR" style={{ width: '220px', height: '220px', display: 'block' }} />
        </div>
      ) : (
        <div style={{ width: '220px', height: '220px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#94a3b8', fontSize: '0.875rem' }}>
          Loading QR…
        </div>
      )}
      <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>Scan with any supported UPI app</p>

      <a href={upiUri} style={{
        display: 'block', width: '100%', padding: '0.875rem',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: 'white', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
        textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
        marginBottom: '0.75rem',
      }}>
        Open UPI App
      </a>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <a href={`gpay://upi/pay?pa=${encodeURIComponent(upiUri.split('pa=')[1]?.split('&')[0] || '')}&am=${amount}`} style={{ flex: 1, padding: '0.625rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
          GPay
        </a>
        <a href={`phonepe://pay?pa=${encodeURIComponent(upiUri.split('pa=')[1]?.split('&')[0] || '')}&am=${amount}`} style={{ flex: 1, padding: '0.625rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
          PhonePe
        </a>
        <a href={`paytmmp://pay?pa=${encodeURIComponent(upiUri.split('pa=')[1]?.split('&')[0] || '')}&am=${amount}`} style={{ flex: 1, padding: '0.625rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
          Paytm
        </a>
      </div>
    </div>
  );
}

export default function CustomerPayPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const d = await res.json();
      setInvoice(d.invoice);
      setLoading(false);
    }
    load();
  }, [collectionId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f3f8', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>Loading payment request…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f3f8', fontFamily: "'Inter', system-ui, sans-serif", padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', textAlign: 'center', maxWidth: '360px', width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0a0f1e', marginBottom: '0.5rem' }}>Payment Request Not Found</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>This payment link may have expired or is invalid. Please contact the merchant.</p>
        </div>
      </div>
    );
  }

  const parts = invoice.paymentParts || [];
  const nextPending = parts.find(p => p.status === 'PENDING');
  const confirmedCount = parts.filter(p => p.status === 'MERCHANT_CONFIRMED').length;
  const progressPct = Math.min(100, (invoice.collectedAmount / invoice.totalAmount) * 100);
  const isPaid = invoice.status === 'PAID';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f3f8', fontFamily: "'Inter', system-ui, sans-serif", padding: '1rem' }}>
      <div style={{ maxWidth: '420px', margin: '0 auto', paddingTop: '1rem', paddingBottom: '3rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#0d1526', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'white', margin: '0 auto 0.75rem' }}>SP</div>
          <div style={{ fontWeight: 800, color: '#0a0f1e', fontSize: '1.125rem' }}>{invoice.merchantName}</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Payment Request</div>
        </div>

        {/* Invoice Summary */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invoice</div>
            <div style={{ fontWeight: 700, color: '#0a0f1e' }}>{invoice.invoiceNumber}</div>
          </div>
          {invoice.description && (
            <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem', padding: '0.625rem', background: '#f8fafc', borderRadius: '6px' }}>{invoice.description}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Invoice</span>
            <span style={{ fontWeight: 800, color: '#0a0f1e', fontSize: '1.125rem' }}>{formatINR(invoice.totalAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Collected</span>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatINR(invoice.collectedAmount)}</span>
          </div>

          {/* Progress */}
          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', marginBottom: '0.375rem', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              background: isPaid ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #2563eb, #60a5fa)',
              width: `${progressPct}%`, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{confirmedCount}/{parts.length} payments received</span>
            <span style={{ fontSize: '0.75rem', color: isPaid ? '#15803d' : '#64748b', fontWeight: 600 }}>
              {isPaid ? '✓ Fully Paid' : `${formatINR(invoice.remainingAmount)} remaining`}
            </span>
          </div>
        </div>

        {/* Paid State */}
        {isPaid && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginBottom: '0.5rem' }}>All Payments Complete!</div>
            <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>
              Invoice {invoice.invoiceNumber} has been fully collected.
            </div>
          </div>
        )}

        {/* Next Payment */}
        {!isPaid && nextPending && (
          <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #bfdbfe', padding: '1.5rem', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Next Payment</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Step {nextPending.sequence} of {parts.length}</div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.04em' }}>{formatINR(nextPending.amount)}</div>
            </div>

            {!showQR ? (
              <button
                onClick={() => setShowQR(true)}
                style={{ width: '100%', padding: '0.875rem', background: '#0d1526', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                📱 Show Payment QR
              </button>
            ) : (
              <QRDisplay upiUri={nextPending.upiUri} amount={nextPending.amount} />
            )}

            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.75rem', color: '#92400e', textAlign: 'center', marginTop: '0.75rem' }}>
              ⚠ Payment will be confirmed by the merchant after receipt
            </div>
          </div>
        )}

        {/* All Steps Summary */}
        {parts.length > 1 && (
          <div style={{ marginTop: '1rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.8125rem', fontWeight: 700, color: '#374151' }}>Payment Steps</div>
            {parts.map(p => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700,
                    background: p.status === 'MERCHANT_CONFIRMED' ? '#dcfce7' : p.status === 'CANCELLED' ? '#fee2e2' : '#f1f5f9',
                    color: p.status === 'MERCHANT_CONFIRMED' ? '#15803d' : p.status === 'CANCELLED' ? '#dc2626' : '#64748b',
                  }}>
                    {p.status === 'MERCHANT_CONFIRMED' ? '✓' : p.sequence}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Payment {p.sequence}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.875rem' }}>{formatINR(p.amount)}</div>
                  <div style={{ fontSize: '0.75rem', color: p.status === 'MERCHANT_CONFIRMED' ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                    {p.status === 'MERCHANT_CONFIRMED' ? 'Received' : p.status === 'CANCELLED' ? 'Cancelled' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          Powered by <strong style={{ color: '#64748b' }}>SMARTPAY</strong> · Collect smarter. Reconcile faster.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
