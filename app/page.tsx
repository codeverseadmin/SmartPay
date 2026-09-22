'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f1f3f8', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        background: '#0d1526',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem', color: 'white', letterSpacing: '-0.5px'
            }}>SP</div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.025em' }}>SMARTPAY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b', borderRadius: '6px',
              padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#92400e',
            }}>PILOT</div>
            <Link href="/login" style={{
              background: '#2563eb', color: 'white', padding: '0.5rem 1.25rem',
              borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
              textDecoration: 'none', transition: 'background 0.15s',
            }}>Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0d1526 0%, #111d35 50%, #162347 100%)',
        color: 'white',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '999px', padding: '0.375rem 1rem',
            fontSize: '0.8125rem', fontWeight: 600, color: '#93c5fd',
            marginBottom: '1.5rem',
          }}>
            <span style={{ width: '6px', height: '6px', background: '#60a5fa', borderRadius: '50%', display: 'inline-block' }} />
            Merchant Payment Collection Platform — Pilot
          </div>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: '1.25rem',
          }}>
            SMARTER PAYMENT<br />
            <span style={{ color: '#60a5fa' }}>COLLECTION</span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '560px', margin: '0 auto 2rem' }}>
            Turn complex payment collection into one simple workflow.
            Create payment plans, generate UPI requests, and keep every payment matched to the right invoice.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              background: '#2563eb', color: 'white',
              padding: '0.875rem 2rem', borderRadius: '10px',
              fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 0 0 1px rgba(37,99,235,0.5), 0 8px 24px rgba(37,99,235,0.3)',
            }}>
              Start Free Pilot →
            </Link>
            <Link href="/login" style={{
              background: 'rgba(255,255,255,0.08)', color: 'white',
              padding: '0.875rem 2rem', borderRadius: '10px',
              fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              View Demo
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem',
            borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', flexWrap: 'wrap',
          }}>
            {[
              { value: '₹0 Setup', label: 'No upfront cost' },
              { value: 'UPI Native', label: 'Works with all UPI apps' },
              { value: 'Instant QR', label: 'Generate in seconds' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.03em' }}>Four steps to collect smarter</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {[
            { n: '01', title: 'Create Invoice', desc: 'Enter customer details, amount, and choose your payment plan strategy.' },
            { n: '02', title: 'Choose Collection Plan', desc: 'Single payment, smart auto-split, or a fully custom plan — your choice.' },
            { n: '03', title: 'Share Payment Request', desc: 'Each step gets its own QR code. Customer scans with any UPI app.' },
            { n: '04', title: 'Reconcile Automatically', desc: 'Confirm received payments. SmartPay reconciles everything against the invoice.' },
          ].map((step) => (
            <div key={step.n} style={{
              background: 'white', borderRadius: '16px',
              border: '1px solid #e2e8f0', padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <div style={{
                width: '40px', height: '40px', background: '#eff6ff',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.875rem', color: '#2563eb', marginBottom: '1rem',
              }}>{step.n}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f1e', marginBottom: '0.5rem' }}>{step.title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#0d1526', padding: '4rem 1.5rem', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>FOR HIGH-VALUE MERCHANTS</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>Why SmartPay</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '📋', title: 'One Invoice', desc: 'Your customers see one clean invoice. Payment steps are managed behind the scenes.' },
              { icon: '🔗', title: 'Multiple Collection Steps', desc: 'Break large collections into manageable parts automatically.' },
              { icon: '📊', title: 'Centralized Tracking', desc: 'Every payment, every invoice — one dashboard. No spreadsheets.' },
              { icon: '⚡', title: 'Simple Reconciliation', desc: 'Merchant confirms receipt. SmartPay handles the math.' },
              { icon: '📱', title: 'Mobile-First Workflow', desc: 'Works perfectly on any device. QR codes, UPI deep links — all included.' },
              { icon: '🔒', title: 'No Bank Integration Needed', desc: 'Works with your existing UPI ID. No setup, no API keys, no contracts.' },
            ].map((f) => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Segments */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.025em' }}>Built for merchants who collect high-value payments</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Any business accepting payments above ₹2,000</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          {['Electronics Stores', 'Furniture Businesses', 'Jewellery Shops', 'Automobile Dealers', 'Interior Designers', 'Wholesalers', 'B2B Suppliers', 'Education Providers', 'Appliance Stores', 'Service Businesses'].map((seg) => (
            <span key={seg} style={{
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '999px', padding: '0.4rem 1rem',
              fontSize: '0.875rem', fontWeight: 500, color: '#374151',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>{seg}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3464 0%, #162347 100%)',
        padding: '4rem 1.5rem', textAlign: 'center', color: 'white',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Built for experimentation.<br />Designed for scale.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem', lineHeight: 1.7 }}>
            SmartPay is a pilot. It does not independently verify bank settlements.
            All payment confirmations are merchant-confirmed. Start your pilot today.
          </p>
          <Link href="/login" style={{
            background: '#2563eb', color: 'white',
            padding: '0.875rem 2.5rem', borderRadius: '10px',
            fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
            display: 'inline-block',
          }}>
            Start Free Pilot
          </Link>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', marginTop: '1rem' }}>
            Use demo@smartpay.local / demo123 to explore
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0a0f1e', color: 'rgba(255,255,255,0.4)',
        padding: '1.5rem', textAlign: 'center', fontSize: '0.8125rem',
      }}>
        <div>SMARTPAY — Collect smarter. Reconcile faster.</div>
        <div style={{ marginTop: '0.375rem' }}>
          Pilot version — not a licensed payment service provider. All transactions are merchant-confirmed.
        </div>
      </footer>
    </div>
  );
}
