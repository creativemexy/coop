import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Request } from 'express';
import type { StateStore } from 'passport-oauth2';

export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_transaction';

const COOKIE_PATH = '/api/v1/auth/google';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: COOKIE_PATH,
  maxAge: 10 * 60 * 1000,
};

interface OAuthMetadata {
  authorizationURL: string;
  tokenURL: string;
  clientID: string;
}

type StoreCallback = (error: Error | null, state?: string) => void;
type VerifyCallback = (
  error: Error | null,
  codeVerifier: boolean,
  state?: unknown,
) => void;
type PkceVerifyCallback = (
  error: Error | null,
  codeVerifier: boolean | string,
  state?: unknown,
) => void;

export class GoogleOAuthStateStore implements StateStore {
  constructor(private readonly secret: string) {
    if (!secret) {
      throw new Error('Google OAuth state signing secret must be configured');
    }
  }

  store(request: Request, callback: StoreCallback): void;
  store(request: Request, metadata: OAuthMetadata, callback: StoreCallback): void;
  store(
    request: Request,
    verifier: string,
    state: unknown,
    metadata: OAuthMetadata,
    callback: StoreCallback,
  ): void;
  store(
    request: Request,
    verifierOrMetadataOrCallback: string | OAuthMetadata | StoreCallback,
    stateOrCallback?: unknown,
    _metadata?: OAuthMetadata,
    callback?: StoreCallback,
  ): void {
    const verifier =
      typeof verifierOrMetadataOrCallback === 'string'
        ? verifierOrMetadataOrCallback
        : undefined;
    const storeCallback =
      typeof verifierOrMetadataOrCallback === 'function'
        ? verifierOrMetadataOrCallback
        : typeof stateOrCallback === 'function'
          ? (stateOrCallback as StoreCallback)
          : callback;

    if (!storeCallback) {
      throw new Error('Google OAuth store callback is required');
    }
    if (!verifier) {
      storeCallback(new Error('Google OAuth PKCE transaction data is required'));
      return;
    }

    const response = request.res;
    if (!response) {
      storeCallback(new Error('Google OAuth response is unavailable'));
      return;
    }

    const state = randomBytes(32).toString('base64url');
    const payload = `${state}.${verifier}`;
    const signature = this.sign(payload);
    response.cookie(
      GOOGLE_OAUTH_STATE_COOKIE,
      `${payload}.${signature}`,
      COOKIE_OPTIONS,
    );
    storeCallback(null, state);
  }

  verify(request: Request, providedState: string, callback: VerifyCallback): void;
  verify(
    request: Request,
    providedState: string,
    metadata: OAuthMetadata,
    callback: VerifyCallback,
  ): void;
  verify(
    request: Request,
    providedState: string,
    _metadataOrCallback: OAuthMetadata | VerifyCallback,
    callback?: VerifyCallback,
  ): void {
    const verifyCallback =
      typeof _metadataOrCallback === 'function'
        ? _metadataOrCallback
        : callback;
    if (!verifyCallback) {
      throw new Error('Google OAuth verification callback is required');
    }

    const response = request.res;
    if (!response) {
      verifyCallback(new Error('Google OAuth response is unavailable'), false);
      return;
    }
    response.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, COOKIE_OPTIONS);

    const cookie = request.cookies?.[GOOGLE_OAUTH_STATE_COOKIE];
    if (typeof cookie !== 'string' || typeof providedState !== 'string') {
      verifyCallback(null, false, {
        message: 'Unable to verify authorization request state.',
      });
      return;
    }

    const [state, verifier, signature, ...extra] = cookie.split('.');
    if (
      extra.length > 0 ||
      !state ||
      !verifier ||
      !signature ||
      !this.matches(signature, this.sign(`${state}.${verifier}`)) ||
      !this.matches(state, providedState)
    ) {
      verifyCallback(null, false, {
        message: 'Invalid authorization request state.',
      });
      return;
    }

    // The runtime accepts the PKCE verifier here, but the installed typings only allow boolean.
    (verifyCallback as unknown as PkceVerifyCallback)(null, verifier);
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64url');
  }

  private matches(left: string, right: string): boolean {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    return (
      leftBytes.length === rightBytes.length &&
      timingSafeEqual(leftBytes, rightBytes)
    );
  }
}
