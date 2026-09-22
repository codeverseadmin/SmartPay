'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Strategy = 'single' | 'smart' | 'custom';

interface SplitPart {
  sequence: number;
  amount: number | string;
}

function formatINR(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}

function calculateSmartSplit(totalAmount: number, maxPaymentAmount: number): SplitPart[] {
  if (totalAmount <= 0 || maxPaymentAmount <= 0) return [];
  const parts: SplitPart[] = [];
  let remaining = Math.round(totalAmount * 100) / 100;
  let seq = 1;
  while (remaining > 0) {
    const thisPayment = Math.min(maxPaymentAmount, remaining);
    const rounded = Math.round(thisPayment * 100) / 100;
    if (rounded <= 0) break;
    parts.push({ sequence: seq++, amount: rounded });
    remaining = Math.round((remaining - rounded) * 100) / 100;
  }
  return parts;
}

export default function CreateCollectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [merchantUpiId, setMerchantUpiId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  // Strategy
  const [strategy, setStrategy] = useState<Strategy>('smart');
  const [maxPayment, setMaxPayment] = useState('1999');
  const [customParts, setCustomParts] = useState<SplitPart[]>([
    { sequence: 1, amount: '' },
    { sequence: 2, amount: '' },
  ]);

  // Preview
  const [previewParts, setPreviewParts] = useState<SplitPart[]>([]);

  // Load merchant UPI from settings
  useEffect(() => {
    const u = localStorage.getItem('sp_user');
    if (u) {
      try {
        const user = JSON.parse(u);
        setMerchantUpiId(user.businessUpiId || '');
        setMaxPayment(String(user.defaultMaxPayment || 1999));
        if (user.defaultStrategy) setStrategy(user.defaultStrategy);
      } catch {}
    }
  }, []);

  // Recalculate preview when inputs change
  useEffect(() => {
    const total = parseFloat(totalAmount);
    if (!total || total <= 0) { setPreviewParts([]); return; }

    if (strategy === 'single') {
      setPreviewParts([{ sequence: 1, amount: total }]);
    } else if (strategy === 'smart') {
      const max = parseFloat(maxPayment);
      if (max > 0) setPreviewParts(calculateSmartSplit(total, max));
    } else {
      setPreviewParts(customParts.filter(p => Number(p.amount) > 0).map((p, i) => ({ sequence: i + 1, amount: Number(p.amount) })));
    }
  }, [totalAmount, strategy, maxPayment, customParts]);

  const totalCustom = customParts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPreview = previewParts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalAmt = parseFloat(totalAmount) || 0;
  const planValid = Math.abs(totalPreview - totalAmt) < 0.01 && previewParts.length > 0;

  function addCustomPart() {
    setCustomParts(prev => [...prev, { sequence: prev.length + 1, amount: '' }]);
  }

  function removeCustomPart(idx: number) {
    setCustomParts(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sequence: i + 1 })));
  }

  function updateCustomPart(idx: number, val: string) {
    setCustomParts(prev => prev.map((p, i) => i === idx ? { ...p, amount: val } : p));
  }

  const canProceed1 = merchantUpiId.trim() && customerName.trim() && totalAmount && parseFloat(totalAmount) > 0;
  const canProceed2 = strategy === 'single' || (strategy === 'smart' && parseFloat(maxPayment) > 0) || (strategy === 'custom' && planValid);

  const handleSubmit = useCallback(async () => {
    setError('');
    setLoading(true);
    const token = localStorage.getItem('sp_token');

    try {
      const body: Record<string, unknown> = {
        merchantUpiId,
        customerName,
        customerPhone,
        invoiceNumber,
        description,
        totalAmount: parseFloat(totalAmount),
        strategy,
      };

      if (strategy === 'smart') body.maxPaymentAmount = parseFloat(maxPayment);
      if (strategy === 'custom') {
        body.customParts = customParts.filter(p => Number(p.amount) > 0).map((p, i) => ({ sequence: i + 1, amount: Number(p.amount) }));
      }

      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create collection'); return; }

      router.push(`/collections/${data.invoice._id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [merchantUpiId, customerName, customerPhone, invoiceNumber, description, totalAmount, strategy, maxPayment, customParts, router]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '0.9375rem', color: '#0a0f1e', background: 'white',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 500,
    color: '#374151', marginBottom: '0.375rem',
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f1e', margin: 0, letterSpacing: '-0.025em' }}>
          Create Collection
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Set up a payment collection plan for your customer
        </p>
      </div>

      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8125rem', fontWeight: 700,
              background: step > s ? '#22c55e' : step === s ? '#2563eb' : '#e2e8f0',
              color: step >= s ? 'white' : '#94a3b8',
            }}>
              {step > s ? '✓' : s}
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: step === s ? 700 : 400, color: step === s ? '#0a0f1e' : '#94a3b8' }}>
              {s === 1 ? 'Invoice Details' : s === 2 ? 'Collection Strategy' : 'Review & Create'}
            </span>
            {s < 3 && <div style={{ width: '32px', height: '1px', background: '#e2e8f0' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Invoice Details */}
      {step === 1 && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f1e', marginBottom: '1.25rem' }}>Invoice Details</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Merchant UPI ID <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={inputStyle} value={merchantUpiId} onChange={e => setMerchantUpiId(e.target.value)} placeholder="yourname@upi" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Customer Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Rahul Das" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
            <div>
              <label style={labelStyle}>Customer Phone</label>
              <input style={inputStyle} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+91-98765-43210" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Invoice Number</label>
              <input style={inputStyle} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Auto-generated" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
            <div>
              <label style={labelStyle}>Total Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} type="number" min="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="5000" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="Samsung Smart TV 55" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>

          {totalAmt > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#15803d', fontWeight: 500 }}>
              Invoice total: <strong>{formatINR(totalAmt)}</strong>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!canProceed1}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '10px',
              background: canProceed1 ? '#2563eb' : '#94a3b8',
              color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem',
              cursor: canProceed1 ? 'pointer' : 'not-allowed',
            }}
          >
            Continue → Collection Strategy
          </button>
        </div>
      )}

      {/* Step 2: Strategy */}
      {step === 2 && (
        <div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f1e', marginBottom: '1rem' }}>Collection Strategy</h2>

            {/* Strategy Cards */}
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { id: 'single' as Strategy, title: 'Single Payment', desc: 'Collect the entire amount as one payment.', icon: '⦿' },
                { id: 'smart' as Strategy, title: 'Smart Split', desc: 'Automatically generate multiple collection steps based on your maximum payment size.', icon: '✦' },
                { id: 'custom' as Strategy, title: 'Custom Split', desc: 'Manually define each payment amount.', icon: '⊞' },
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  style={{
                    display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '10px',
                    border: `2px solid ${strategy === s.id ? '#2563eb' : '#e2e8f0'}`,
                    background: strategy === s.id ? '#eff6ff' : 'white',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: '36px', height: '36px', background: strategy === s.id ? '#2563eb' : '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: strategy === s.id ? 'white' : '#64748b' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0a0f1e', marginBottom: '0.25rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Split Config */}
            {strategy === 'smart' && (
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <label style={labelStyle}>Maximum Payment Amount (₹)</label>
                <input style={inputStyle} type="number" min="1" value={maxPayment} onChange={e => setMaxPayment(e.target.value)} placeholder="1999" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.5rem' }}>
                  The collection will be split into steps of at most ₹{parseFloat(maxPayment) ? new Intl.NumberFormat('en-IN').format(parseFloat(maxPayment)) : '—'} each.
                </div>
              </div>
            )}

            {/* Custom Split */}
            {strategy === 'custom' && (
              <div style={{ marginBottom: '1rem' }}>
                {customParts.map((part, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.625rem' }}>
                    <div style={{ width: '28px', height: '28px', background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <input
                        style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                        type="number" min="0.01" value={part.amount}
                        onChange={e => updateCustomPart(idx, e.target.value)}
                        placeholder={`Payment ${idx + 1} amount`}
                        onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                      />
                    </div>
                    <button onClick={() => removeCustomPart(idx)} disabled={customParts.length <= 1} style={{ background: 'none', border: 'none', color: customParts.length > 1 ? '#ef4444' : '#d1d5db', cursor: customParts.length > 1 ? 'pointer' : 'default', fontSize: '1.125rem', padding: '4px' }}>✕</button>
                  </div>
                ))}
                <button onClick={addCustomPart} style={{ width: '100%', padding: '0.5rem', border: '1.5px dashed #2563eb', borderRadius: '8px', background: 'transparent', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                  + Add Payment Step
                </button>

                {/* Validation */}
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  background: planValid ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${planValid ? '#bbf7d0' : '#fecaca'}`,
                  fontSize: '0.8125rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.25rem' }}>
                    <span>Total Invoice</span><span style={{ fontWeight: 600, color: '#0a0f1e' }}>{formatINR(totalAmt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.25rem' }}>
                    <span>Planned Collection</span><span style={{ fontWeight: 600, color: '#0a0f1e' }}>{formatINR(totalCustom)}</span>
                  </div>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: planValid ? '#15803d' : '#dc2626' }}>
                      {planValid ? '✓ VALID' : '✗ ' + (totalCustom < totalAmt ? 'SHORT by ' + formatINR(totalAmt - totalCustom) : 'EXCESS by ' + formatINR(totalCustom - totalAmt))}
                    </span>
                    <span style={{ fontWeight: 600, color: planValid ? '#15803d' : '#dc2626' }}>
                      Diff: {formatINR(Math.abs(totalAmt - totalCustom))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {previewParts.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#0a0f1e', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Payment Plan Preview</div>
              {previewParts.map((p) => (
                <div key={p.sequence} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '24px', height: '24px', background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>{p.sequence}</div>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>Payment {p.sequence}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0a0f1e' }}>{formatINR(Number(p.amount))}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: '#0a0f1e' }}>Total ({previewParts.length} payment{previewParts.length !== 1 ? 's' : ''})</span>
                <span style={{ fontWeight: 800, color: planValid ? '#15803d' : '#dc2626' }}>{formatINR(totalPreview)}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'white', border: '1.5px solid #e2e8f0', color: '#374151', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceed2}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', background: canProceed2 ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9375rem', cursor: canProceed2 ? 'pointer' : 'not-allowed' }}
            >
              Continue → Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f1e', marginBottom: '1.25rem' }}>Review Collection</h2>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Merchant UPI', value: merchantUpiId },
                { label: 'Customer', value: customerName + (customerPhone ? ` • ${customerPhone}` : '') },
                { label: 'Invoice Number', value: invoiceNumber || 'Auto-generated' },
                { label: 'Description', value: description || '—' },
                { label: 'Total Amount', value: formatINR(totalAmt), highlight: true },
                { label: 'Strategy', value: strategy === 'single' ? 'Single Payment' : strategy === 'smart' ? `Smart Split (max ${formatINR(parseFloat(maxPayment))})` : 'Custom Split' },
                { label: 'Payment Steps', value: `${previewParts.length} payment${previewParts.length !== 1 ? 's' : ''}` },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: highlight ? 800 : 600, color: highlight ? '#15803d' : '#0a0f1e', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#0a0f1e', marginBottom: '0.625rem', fontSize: '0.9375rem' }}>Payment Plan</div>
              {previewParts.map((p) => (
                <div key={p.sequence} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Payment {p.sequence}</span>
                  <span style={{ fontWeight: 700, color: '#0a0f1e', fontSize: '0.875rem' }}>{formatINR(Number(p.amount))}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem' }}>
                ⚠ {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'white', border: '1.5px solid #e2e8f0', color: '#374151', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>← Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9375rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />Creating...</>
              ) : '🚀 Create Collection'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
