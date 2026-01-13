/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** auth.test
*/

import { describe, expect, it, beforeEach } from 'vitest';

import { getToken, isAuthenticated, logout } from '../services/auth';

beforeEach(() => {
  localStorage.clear();
});

describe('auth token helpers', () => {
  it('returns false when no token is stored', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('detects token presence and can clear it', () => {
    localStorage.setItem('auth_token', 'abc123');

    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toBe('abc123');

    logout();
    expect(isAuthenticated()).toBe(false);
  });
});
