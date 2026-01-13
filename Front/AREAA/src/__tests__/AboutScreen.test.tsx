/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** AboutScreen.test
*/

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import AboutScreen from '../screens/AboutScreen';
import { fetchAbout } from '../services/api';

vi.mock('../services/api', () => ({
  fetchAbout: vi.fn(),
}));

const mockFetchAbout = fetchAbout as unknown as Mock;

const sampleAbout = {
  client: { host: 'client.local' },
  server: {
    current_time: 1700000000,
    services: [
      {
        name: 'github',
        actions: [{ name: 'push', description: 'Push' }],
        reactions: [{ name: 'notify', description: 'Notify' }],
      },
    ],
  },
};

describe('AboutScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows first service name when data loads', async () => {
    mockFetchAbout.mockResolvedValueOnce(sampleAbout as any);

    render(<AboutScreen />);

    await waitFor(() => {
      expect(screen.getByText(/First service/i)).toBeInTheDocument();
    });
    expect(screen.getByText('First service: github')).toBeInTheDocument();
  });

  it('shows an error message on failure', async () => {
    mockFetchAbout.mockRejectedValueOnce(new Error('boom'));

    render(<AboutScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });
});
