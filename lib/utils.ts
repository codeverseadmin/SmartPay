import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(d);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export const STATUS_CONFIG = {
  PAID: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PARTIAL: { label: 'Partial', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACTIVE: { label: 'Active', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
  PENDING: { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  MERCHANT_CONFIRMED: {
    label: 'Merchant-Confirmed',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};
