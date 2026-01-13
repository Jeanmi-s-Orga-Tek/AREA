import {Linking} from 'react-native';
import {sha256} from 'js-sha256';
import {AuthorizeUrlResponse, createOAuthState, recordPendingOAuthState} from './auth';
import {getApiBaseUrl} from './storage';

export const CANONICAL_OAUTH_REDIRECT = 'area.app://auth';
const LEGACY_OAUTH_REDIRECT = 'area.app:/auth';

const PKCE_VERIFIERS = new Map<string, string>();

const generateCodeVerifier = (): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const length = 64;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * charset.length);
    out += charset[idx];
  }
  return out;
};

const toBase64Url = (value: string): string =>
  value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const buildPkce = (): {verifier: string; challenge: string} => {
  const verifier = generateCodeVerifier();
  const challenge = toBase64Url(sha256.base64(verifier));
  return {verifier, challenge};
};

const normalizeCallbackUrl = (url: string): string | null => {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith(LEGACY_OAUTH_REDIRECT)) {
    return trimmed.replace(LEGACY_OAUTH_REDIRECT, CANONICAL_OAUTH_REDIRECT);
  }
  return trimmed;
};

const isUrlCallbackMatch = (url: string): boolean => {
  const normalized = normalizeCallbackUrl(url);
  if (!normalized) {
    return false;
  }
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'area.app:' && parsed.host === 'auth';
  } catch {
    return normalized.startsWith(CANONICAL_OAUTH_REDIRECT);
  }
};

const parseSearchParams = (url: string): URLSearchParams => {
  const normalized = normalizeCallbackUrl(url) ?? url;
  const queryIndex = normalized.indexOf('?');
  const hashIndex = normalized.indexOf('#');

  const query =
    queryIndex !== -1
      ? normalized.slice(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined)
      : '';
  const fragment = hashIndex !== -1 ? normalized.slice(hashIndex + 1) : '';

  const params = new URLSearchParams(query);
  if (fragment) {
    const fragmentParams = new URLSearchParams(fragment);
    fragmentParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.append(key, value);
      }
    });
  }

  return params;
};

const buildAuthorizeUrl = async (
  providerId: string,
  state: string,
  codeChallenge?: string,
): Promise<string> => {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL not configured');
  }

  const params = new URLSearchParams();
  if (state) {
    params.append('state', state);
  }
  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  const response = await fetch(
    `${baseUrl}/oauth/authorize/${providerId}/mobile?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to start OAuth for ${providerId}`);
  }

  const payload = (await response.json()) as AuthorizeUrlResponse;
  return payload.authorization_url;
};

const startOAuthFlow = async (
  providerId: string,
  options?: {mode?: 'login' | 'service'; serviceName?: string},
) => {
  const state = createOAuthState(providerId, {
    mode: options?.mode,
    serviceName: options?.serviceName,
  });
  recordPendingOAuthState(state);
  const {verifier, challenge} = buildPkce();
  PKCE_VERIFIERS.set(state, verifier);
  const authorizeUrl = await buildAuthorizeUrl(providerId, state, challenge);
  await Linking.openURL(authorizeUrl);
};

export const startLoginOAuth = async (providerId: string): Promise<void> => {
  await startOAuthFlow(providerId, {mode: 'login'});
};

export const startServiceOAuth = async (
  providerId: string,
  serviceName: string,
): Promise<void> => {
  await startOAuthFlow(providerId, {mode: 'service', serviceName});
};

export const isMobileOAuthCallbackUrl = (url: string): boolean => {
  return isUrlCallbackMatch(url);
};

export const getOAuthCallbackParams = (
  url: string,
): {code?: string; token?: string; state?: string; error?: string; codeVerifier?: string} => {
  const params = parseSearchParams(url);
  return {
    code: params.get('code') ?? undefined,
    token: params.get('token') ?? undefined,
    state: params.get('state') ?? undefined,
    error:
      params.get('error') || params.get('detail') || undefined,
    codeVerifier: params.get('code_verifier') ?? undefined,
  };
};

export const consumePkceVerifierForState = (state?: string | null): string | null => {
  if (!state) {
    return null;
  }
  const verifier = PKCE_VERIFIERS.get(state) ?? null;
  PKCE_VERIFIERS.delete(state);
  return verifier;
};
