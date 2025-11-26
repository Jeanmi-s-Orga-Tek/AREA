import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL_KEY = 'api_base_url';

export const getApiBaseUrl = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(API_BASE_URL_KEY);
  } catch (error) {
    console.error('Error getting API base URL:', error);
    return null;
  }
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(API_BASE_URL_KEY, url);
  } catch (error) {
    console.error('Error setting API base URL:', error);
    throw error;
  }
};
