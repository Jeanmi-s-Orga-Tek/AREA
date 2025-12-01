import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const API_BASE_URL_KEY = 'api_base_url';
const DEFAULT_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

const normalizeBaseUrl = (url: string): string => {
  if (!url) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (
      Platform.OS === 'android' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      parsed.hostname = '10.0.2.2';
      return parsed.toString().replace(/\/$/, '');
    }
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    console.warn('Invalid API base URL, falling back to provided string');
    return url;
  }
};

export const getApiBaseUrl = async (): Promise<string | null> => {
  try {
    const storedUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (storedUrl) {
      return normalizeBaseUrl(storedUrl);
    }
    console.info(
      '[API] Using default base URL. Configure a custom URL from Settings if needed.',
    );
    return DEFAULT_BASE_URL ? normalizeBaseUrl(DEFAULT_BASE_URL) : null;
  } catch (error) {
    console.error('Error getting API base URL:', error);
    return null;
  }
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  try {
    const normalized = normalizeBaseUrl(url);
    await AsyncStorage.setItem(API_BASE_URL_KEY, normalized);
  } catch (error) {
    console.error('Error setting API base URL:', error);
    throw error;
  }
};

export const clearApiBaseUrl = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(API_BASE_URL_KEY);
  } catch (error) {
    console.error('Error clearing API base URL:', error);
    throw error;
  }
};
