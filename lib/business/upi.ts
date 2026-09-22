/**
 * UPI URI generation
 * Generates standard UPI payment URI strings locally.
 * Does NOT call any payment API.
 */

export interface UPIParams {
  pa: string;   // Payee UPI ID
  pn: string;   // Payee Name
  am: number;   // Amount
  cu?: string;  // Currency (default INR)
  tn?: string;  // Transaction note
  tr?: string;  // Transaction reference
}

/**
 * Generates a standard UPI payment URI
 * Format: upi://pay?pa=MERCHANT_UPI&pn=MERCHANT_NAME&am=AMOUNT&cu=INR
 */
export function generateUPIUri(params: UPIParams): string {
  const cu = params.cu || 'INR';
  const encoded = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am.toFixed(2),
    cu,
    ...(params.tn ? { tn: params.tn } : {}),
    ...(params.tr ? { tr: params.tr } : {}),
  });
  return `upi://pay?${encoded.toString()}`;
}

/**
 * Validates a UPI ID format
 * Format: handle@bank or mobile@bank
 */
export function isValidUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;
  return upiRegex.test(upiId.trim());
}
