/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** authState.test
*/

import {
  consumePendingOAuthState,
  createOAuthState,
  extractProviderFromState,
  getOAuthAuthorizationUrl,
  parseOAuthState,
  recordPendingOAuthState,
} from '../src/api/auth';

jest.mock('../src/api/storage', () => ({
  getApiBaseUrl: jest.fn(() => Promise.resolve('http://localhost:8080')),
}));

describe('OAuth state helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates and parses a deterministic service state', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const state = createOAuthState('github', {mode: 'service', serviceName: 'github'});

    const parsed = parseOAuthState(state);
    expect(parsed).toEqual({
      mode: 'service',
      providerId: 'github',
      serviceName: 'github',
      nonce: state.split('::')[3],
    });
    expect(state).toContain('service::github');
  });

  it('records and consumes pending OAuth state', () => {
    const state = 'login::google::nonce123';

    recordPendingOAuthState(state);

    expect(consumePendingOAuthState(state)).toBe(true);
    expect(consumePendingOAuthState(state)).toBe(false);
  });

  it('extracts provider from legacy state format', () => {
    const legacy = 'providerOnly::nonce';

    expect(extractProviderFromState(legacy)).toBe('providerOnly');
  });
});

describe('getOAuthAuthorizationUrl', () => {
  it('builds the correct URL and returns authorization link', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({authorization_url: 'http://auth.example/authorize'}),
    });
    global.fetch = fetchMock as any;

    const url = await getOAuthAuthorizationUrl('github', 'state123');

    expect(url).toBe('http://auth.example/authorize');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/oauth/authorize/github/mobile?state=state123',
    );
  });
});
