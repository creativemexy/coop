const RAW_BODY_PATHS = new Set([
  '/api/v1/payments/webhook/paystack',
  '/api/v1/payments/webhook/firstcheckout/virtual-account-deposit',
  '/api/v1/kyc/webhook',
]);

export function shouldCaptureRawBody(url: string): boolean {
  const path = new URL(url, 'http://localhost').pathname
    .replace(/\/+$/, '')
    .toLowerCase();
  return RAW_BODY_PATHS.has(path);
}
