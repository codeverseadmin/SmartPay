import { IPaymentPart } from '@/lib/db/models/PaymentPart';
import type { InvoiceStatus } from '@/lib/db/models/Invoice';

/**
 * Calculate collected amount from confirmed payment parts
 */
export function calculateCollectedAmount(parts: IPaymentPart[]): number {
  return parts
    .filter((p) => p.status === 'MERCHANT_CONFIRMED')
    .reduce((sum, p) => Math.round((sum + p.amount) * 100) / 100, 0);
}

/**
 * Calculate remaining amount
 */
export function calculateRemainingAmount(totalAmount: number, collectedAmount: number): number {
  return Math.round((totalAmount - collectedAmount) * 100) / 100;
}

/**
 * Calculate invoice status based on payment parts and total
 */
export function calculateInvoiceStatus(
  parts: IPaymentPart[],
  totalAmount: number,
  currentStatus?: InvoiceStatus
): InvoiceStatus {
  if (currentStatus === 'CANCELLED') return 'CANCELLED';

  if (!parts || parts.length === 0) return 'ACTIVE';

  const allCancelled = parts.every((p) => p.status === 'CANCELLED');
  if (allCancelled) return 'CANCELLED';

  const collectedAmount = calculateCollectedAmount(parts);
  const remaining = calculateRemainingAmount(totalAmount, collectedAmount);

  if (remaining <= 0) return 'PAID';
  if (collectedAmount > 0) return 'PARTIAL';

  return 'ACTIVE';
}

/**
 * Generate an invoice number with prefix and sequence
 */
export function generateInvoiceNumber(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(4, '0')}`;
}

/**
 * Format amount in Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount as plain number with Indian formatting
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(amount);
}
