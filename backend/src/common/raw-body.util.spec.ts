import { shouldCaptureRawBody } from './raw-body.util';

describe('shouldCaptureRawBody', () => {
  it('captures raw bodies only for signature-checked webhook routes', () => {
    expect(shouldCaptureRawBody('/api/v1/payments/webhook/paystack')).toBe(
      true,
    );
    expect(
      shouldCaptureRawBody(
        '/api/v1/payments/webhook/firstcheckout/virtual-account-deposit',
      ),
    ).toBe(true);
    expect(shouldCaptureRawBody('/api/v1/kyc/webhook')).toBe(true);

    expect(shouldCaptureRawBody('/api/v1/auth/login')).toBe(false);
    expect(shouldCaptureRawBody('/api/v1/payments/webhook/unknown')).toBe(
      false,
    );
  });

  it('allows webhook query strings and trailing slashes', () => {
    expect(shouldCaptureRawBody('/api/v1/kyc/webhook/?source=provider')).toBe(
      true,
    );
  });
});
