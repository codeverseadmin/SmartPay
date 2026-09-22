'use client';

import { useState, useEffect } from 'react';

interface UserSettings {
  merchantName: string;
  businessName: string;
  businessUpiId: string;
  businessPhone: string;
  businessEmail: string;
  displayName: string;
  invoicePrefix: string;
  defaultMaxPayment: number;
  defaultStrategy: 'single' | 'smart' | 'custom';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    merchantName: '', businessName: '', businessUpiId: '', businessPhone: '',
    businessEmail: '', displayName: '', invoicePrefix: 'SP',
    defaultMaxPayment: 1999, defaultStrategy: 'smart',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('sp_token');
      const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setSettings({
          merchantName: d.user.merchantName || '',
          businessName: d.user.businessName || '',
          businessUpiId: d.user.businessUpiId || '',
          businessPhone: d.user.businessPhone || '',
          businessEmail: d.user.businessEmail || '',
          displayName: d.user.displayName || '',
          invoicePrefix: d.user.invoicePrefix || 'SP',
          defaultMaxPayment: d.user.defaultMaxPayment || 1999,
          defaultStrategy: d.user.defaultStrategy || 'smart',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(section: Partial<UserSettings>) {
    setSaving(true);
    setError('');
    setSaved(false);
    const token = localStorage.getItem('sp_token');
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(section),
    });
    if (res.ok) {
      const d = await res.json();
      const u = localStorage.getItem('sp_user');
      if (u) {
        const user = JSON.parse(u);
        localStorage.setItem('sp_user', JSON.stringify({ ...user, ...d.user }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError('Failed to save settings');
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '0.9375rem', color: '#0a0f1e', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s', background: 'white',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem',
  };

  function Section({ title, subtitle, children, onSave }: { title: string; subtitle: string; children: React.ReactNode; onSave: () => void }) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f1e', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>{subtitle}</p>
        </div>
        {children}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onSave} disabled={saving} style={{
            padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            background: saving ? '#93c5fd' : '#2563eb', color: 'white',
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f1e', margin: 0, letterSpacing: '-0.025em' }}>Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage your merchant profile and preferences</p>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#15803d', fontWeight: 600 }}>
          ✓ Settings saved successfully
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#dc2626' }}>
          ⚠ {error}
        </div>
      )}

      {/* Business Profile */}
      <Section title="Business Profile" subtitle="Your business information shown on payment requests" onSave={() => handleSave({ merchantName: settings.merchantName, businessName: settings.businessName, businessUpiId: settings.businessUpiId, businessPhone: settings.businessPhone, businessEmail: settings.businessEmail, displayName: settings.displayName })}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input style={inputStyle} value={settings.businessName} onChange={e => setSettings(s => ({ ...s, businessName: e.target.value }))} onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input style={inputStyle} value={settings.displayName} onChange={e => setSettings(s => ({ ...s, displayName: e.target.value }))} onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Business UPI ID</label>
            <input style={inputStyle} value={settings.businessUpiId} onChange={e => setSettings(s => ({ ...s, businessUpiId: e.target.value }))} placeholder="businessname@upi" onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Business Phone</label>
              <input style={inputStyle} value={settings.businessPhone} onChange={e => setSettings(s => ({ ...s, businessPhone: e.target.value }))} onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
            <div>
              <label style={labelStyle}>Business Email</label>
              <input style={inputStyle} type="email" value={settings.businessEmail} onChange={e => setSettings(s => ({ ...s, businessEmail: e.target.value }))} onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>
        </div>
      </Section>

      {/* Payment Preferences */}
      <Section title="Payment Preferences" subtitle="Default settings for new collections" onSave={() => handleSave({ defaultMaxPayment: settings.defaultMaxPayment, defaultStrategy: settings.defaultStrategy })}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Default Collection Strategy</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {[
                { v: 'single' as const, label: 'Single' },
                { v: 'smart' as const, label: 'Smart Split' },
                { v: 'custom' as const, label: 'Custom' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setSettings(s => ({ ...s, defaultStrategy: opt.v }))} style={{
                  padding: '0.625rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${settings.defaultStrategy === opt.v ? '#2563eb' : '#e2e8f0'}`,
                  background: settings.defaultStrategy === opt.v ? '#eff6ff' : 'white',
                  color: settings.defaultStrategy === opt.v ? '#2563eb' : '#374151',
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Default Maximum Payment Amount (₹)</label>
            <input style={inputStyle} type="number" min="1" value={settings.defaultMaxPayment} onChange={e => setSettings(s => ({ ...s, defaultMaxPayment: parseInt(e.target.value) || 1999 }))} onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.375rem' }}>Used for Smart Split calculation</div>
          </div>
        </div>
      </Section>

      {/* Invoice Preferences */}
      <Section title="Invoice Preferences" subtitle="Numbering and formatting for invoices" onSave={() => handleSave({ invoicePrefix: settings.invoicePrefix })}>
        <div>
          <label style={labelStyle}>Invoice Prefix</label>
          <input style={{ ...inputStyle, maxWidth: '200px' }} value={settings.invoicePrefix} onChange={e => setSettings(s => ({ ...s, invoicePrefix: e.target.value.toUpperCase() }))} placeholder="SP" maxLength={5} onFocus={e => { e.target.style.borderColor = '#2563eb'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.375rem' }}>
            Invoice numbers will look like: <strong>{settings.invoicePrefix}-1001</strong>
          </div>
        </div>
      </Section>

      {/* Notifications (mock) */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f1e', margin: 0 }}>Notifications</h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>Demo settings — not functional in pilot</p>
        </div>
        {[
          { label: 'Email Notifications', desc: 'Receive email when payment is confirmed', enabled: true },
          { label: 'SMS Notifications', desc: 'Receive SMS alerts for payment events', enabled: false },
        ].map(n => (
          <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9375rem' }}>{n.label}</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{n.desc}</div>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: n.enabled ? '#2563eb' : '#d1d5db', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', transition: 'left 0.15s', left: n.enabled ? '23px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Pilot Disclaimer */}
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#92400e' }}>
        <strong>⚡ Pilot Mode</strong><br />
        SmartPay is a pilot application. Payment confirmations are merchant-confirmed and do not involve automatic bank verification. This application is not a licensed payment service provider.
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
