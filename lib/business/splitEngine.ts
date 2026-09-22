/**
 * SmartPay Split Engine
 * Calculates optimal payment split plans
 */

export interface SplitPart {
  sequence: number;
  amount: number;
}

export interface SplitResult {
  parts: SplitPart[];
  totalPlanned: number;
  isValid: boolean;
  difference: number;
}

/**
 * Calculates smart split of totalAmount into parts <= maxAmount
 * - Never exceeds total
 * - Never generates zero-value payments
 * - Handles decimals correctly
 * - Handles exact multiples
 * - Correctly calculates final remainder
 */
export function calculateSmartSplit(totalAmount: number, maxPaymentAmount: number): SplitResult {
  if (totalAmount <= 0 || maxPaymentAmount <= 0) {
    return { parts: [], totalPlanned: 0, isValid: false, difference: totalAmount };
  }

  // If total fits in one payment
  if (totalAmount <= maxPaymentAmount) {
    const parts = [{ sequence: 1, amount: Math.round(totalAmount * 100) / 100 }];
    return { parts, totalPlanned: parts[0].amount, isValid: true, difference: 0 };
  }

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

  const totalPlanned = parts.reduce((sum, p) => Math.round((sum + p.amount) * 100) / 100, 0);
  const difference = Math.round((totalAmount - totalPlanned) * 100) / 100;

  return {
    parts,
    totalPlanned,
    isValid: Math.abs(difference) < 0.01,
    difference,
  };
}

export interface ValidationResult {
  isValid: boolean;
  totalPlanned: number;
  difference: number;
  errors: string[];
}

/**
 * Validates a custom payment plan against the invoice total
 */
export function validatePaymentPlan(
  parts: { amount: number }[],
  totalAmount: number
): ValidationResult {
  const errors: string[] = [];

  if (!parts || parts.length === 0) {
    errors.push('Payment plan must have at least one payment');
  }

  const invalidParts = parts.filter((p) => !p.amount || p.amount <= 0);
  if (invalidParts.length > 0) {
    errors.push('All payment amounts must be greater than zero');
  }

  const totalPlanned = parts.reduce((sum, p) => Math.round((sum + (p.amount || 0)) * 100) / 100, 0);
  const difference = Math.round((totalAmount - totalPlanned) * 100) / 100;

  if (Math.abs(difference) >= 0.01) {
    errors.push(
      `Payment plan total (₹${totalPlanned.toLocaleString('en-IN')}) does not match invoice total (₹${totalAmount.toLocaleString('en-IN')})`
    );
  }

  return {
    isValid: errors.length === 0,
    totalPlanned,
    difference,
    errors,
  };
}
