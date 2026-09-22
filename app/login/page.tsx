'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@smartpay.local');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('sp_token', data.token);
      localStorage.setItem('sp_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Connection error. Is MongoDB running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1526 0%, #111d35 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.25rem', color: 'white',
              boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
            }}>SP</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>SMARTPAY</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Collect smarter. Reconcile faster.
          </p>
        </div>

        {/* Demo mode badge */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b', borderRadius: '8px',
          padding: '0.625rem 1rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.8125rem', fontWeight: 600, color: '#92400e',
        }}>
          <span>⚡</span>
          <div>
            <div>DEMO MODE — Pre-filled with demo credentials</div>
            <div style={{ fontWeight: 400, marginTop: '0.125rem', color: '#b45309' }}>
              demo@smartpay.local / demo123
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: '20px',
          padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0f1e', marginBottom: '0.375rem' }}>
            Merchant Sign In
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Access your SmartPay dashboard
          </p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '0.75rem 1rem',
              fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '0.9375rem', color: '#0a0f1e',
                  outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '0.9375rem', color: '#0a0f1e',
                  outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                background: loading ? '#93c5fd' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'background 0.15s',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Setup hint */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '1rem', marginTop: '1rem',
          fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)',
        }}>
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.375rem' }}>First time setup</div>
          Make sure MongoDB is running, then visit{' '}
          <code style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>/api/seed</code>{' '}
          (POST) to load demo data.
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
