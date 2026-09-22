import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartPay — Collect Smarter. Reconcile Faster.',
  description:
    'SmartPay is a merchant payment collection and reconciliation platform for Indian SMBs. Create payment plans, generate UPI collection requests, and track every invoice.',
  keywords: 'payment collection, UPI, invoice management, reconciliation, merchant payments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
