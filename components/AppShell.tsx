'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/create', icon: '＋', label: 'Create Collection' },
  { href: '/collections', icon: '◈', label: 'Collections' },
  { href: '/analytics', icon: '▦', label: 'Analytics' },
  { href: '/settings', icon: '⚙', label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ merchantName?: string; businessName?: string; businessUpiId?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    const userData = localStorage.getItem('sp_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }
  }, [router]);

  function getInitials(name?: string) {
    if (!name) return 'M';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <div style={{
        background: '#0d1526', width: '240px', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', color: 'white' }}>SP</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.025em' }}>SMARTPAY</span>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.25rem', padding: '4px' }}>✕</button>
          )}
        </div>

        <div style={{ padding: '0.75rem 1rem' }}>
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span>⚡</span> DEMO MODE
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0.75rem' }}>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: '8px', marginBottom: '0.25rem',
                textDecoration: 'none', fontWeight: active ? 600 : 400, fontSize: '0.875rem',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {item.href === '/create' && (
                  <span style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>NEW</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'white', flexShrink: 0 }}>
              {getInitials(user?.merchantName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.businessName || 'Merchant'}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.businessUpiId || ''}</div>
            </div>
            <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.875rem', padding: '4px', borderRadius: '4px' }}>⎋</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Desktop Sidebar */}
      <div className="sp-hide-mobile" style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto', flexShrink: 0 }}>
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '260px', zIndex: 101 }}>
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <div className="sp-show-mobile" style={{ background: '#0d1526', padding: '0 1rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem', padding: '4px' }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'white' }}>SP</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>SMARTPAY</span>
          </div>
          <Link href="/create" style={{ background: '#2563eb', color: 'white', borderRadius: '6px', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none' }}>+ New</Link>
        </div>

        <main style={{ flex: 1, background: '#f1f3f8', padding: '1.5rem', overflowX: 'hidden' }}>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <div className="sp-show-mobile" style={{ background: '#0d1526', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', position: 'sticky', bottom: 0, zIndex: 40, flexShrink: 0 }}>
          {[...NAV.filter(n => n.href !== '/create'), { href: '/create', icon: '＋', label: 'Create' }].map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.625rem 0.25rem', textDecoration: 'none', gap: '0.25rem',
                color: active ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                fontSize: '0.625rem', fontWeight: active ? 700 : 400,
              }}>
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                {item.label.split(' ')[0]}
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .sp-show-mobile { display: none !important; } }
        @media (max-width: 767px) { .sp-hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
