import type { Request, Response } from 'express';
import type { StateStore } from 'passport-oauth2';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GoogleOAuthStateStore,
} from './google-oauth-state.store';

describe('GoogleOAuthStateStore', () => {
  const metadata = {
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    clientID: 'client-id',
  };

  function createRequest() {
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;
    const request = {
      cookies: {},
      res: response,
    } as unknown as Request;
    return { request, response };
  }

  it('stores a browser-bound state and returns the PKCE verifier only for matching state', () => {
    const store = new GoogleOAuthStateStore('test-access-secret');
    const passportStore: StateStore = store;
    const { request, response } = createRequest();
    const verifier = 'test-code-verifier';
    let state = '';

    store.store(request, verifier, undefined, metadata, (error, value) => {
      expect(error).toBeNull();
      state = value as string;
    });

    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.cookie).toHaveBeenCalledWith(
      GOOGLE_OAUTH_STATE_COOKIE,
      expect.stringContaining(state),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth/google',
      }),
    );

    const cookieValue = (response.cookie as jest.Mock).mock.calls[0][1];
    request.cookies = { [GOOGLE_OAUTH_STATE_COOKIE]: cookieValue };

    store.verify(request, state, (error, codeVerifier) => {
      expect(error).toBeNull();
      expect(codeVerifier).toBe(verifier);
    });
    expect(response.clearCookie).toHaveBeenCalledWith(
      GOOGLE_OAUTH_STATE_COOKIE,
      expect.objectContaining({ path: '/api/v1/auth/google' }),
    );
    expect(passportStore).toBe(store);
  });

  it('rejects a mismatched state', () => {
    const store = new GoogleOAuthStateStore('test-access-secret');
    const { request, response } = createRequest();
    let state = '';

    store.store(
      request,
      'test-code-verifier',
      undefined,
      metadata,
      (_error, value) => {
        state = value as string;
      },
    );

    const cookieValue = (response.cookie as jest.Mock).mock.calls[0][1];
    request.cookies = { [GOOGLE_OAUTH_STATE_COOKIE]: cookieValue };

    store.verify(request, `${state}x`, (error, codeVerifier) => {
      expect(error).toBeNull();
      expect(codeVerifier).toBe(false);
    });
  });

  it('rejects a tampered signed transaction cookie', () => {
    const store = new GoogleOAuthStateStore('test-access-secret');
    const { request, response } = createRequest();
    let state = '';

    store.store(
      request,
      'test-code-verifier',
      undefined,
      metadata,
      (_error, value) => {
        state = value as string;
      },
    );

    const cookieValue = (response.cookie as jest.Mock).mock.calls[0][1];
    const tamperedCookie = `${cookieValue.slice(0, -1)}${cookieValue.endsWith('A') ? 'B' : 'A'}`;
    request.cookies = { [GOOGLE_OAUTH_STATE_COOKIE]: tamperedCookie };

    store.verify(request, state, (error, codeVerifier) => {
      expect(error).toBeNull();
      expect(codeVerifier).toBe(false);
    });
  });
});
