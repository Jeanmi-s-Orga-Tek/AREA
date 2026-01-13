/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** jest.setup
*/

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

global.fetch = jest.fn(() =>
	Promise.resolve({
		ok: true,
		json: async () => ({}),
		text: async () => '',
		status: 200,
		statusText: 'OK',
	}),
); 

jest.mock('./src/api/auth', () => ({
	...jest.requireActual('./src/api/auth'),
	getAuthToken: jest.fn().mockResolvedValue(null),
	logout: jest.fn().mockResolvedValue(undefined),
}));
