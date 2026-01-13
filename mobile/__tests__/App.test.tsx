/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** App.test
*/

/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/api/auth', () => ({
  fetchOAuthProviders: jest.fn().mockResolvedValue([]),
  createOAuthState: jest.fn(() => 'state'),
  recordPendingOAuthState: jest.fn(),
  consumePendingOAuthState: jest.fn(),
  finalizeOAuthLogin: jest.fn().mockResolvedValue({}),
  parseOAuthState: jest.fn(() => null),
  getAuthToken: jest.fn().mockResolvedValue(null),
  logout: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/api/services', () => ({
  completeServiceConnection: jest.fn().mockResolvedValue(undefined),
  SERVICE_OAUTH_EVENT: 'service-oauth-complete',
}));

const App = require('../App').default;

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
