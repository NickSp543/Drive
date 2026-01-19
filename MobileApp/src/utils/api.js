import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_BACKEND_PORT = 3000; //Backend api server port

// Determine API URL based on environment
function getApiUrl() {
  // For production builds: set EXPO_PUBLIC_API_URL
  if (!__DEV__) {
    return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  }

  // For development builds: use Expo host
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoConfig?.debuggerHost;
  const devHost = hostUri?.split(':')?.[0];
  if (devHost) {
    return `http://${devHost}:${DEV_BACKEND_PORT}/api`;
  }

  // Android emulator fallback
  return `http://10.0.2.2:${DEV_BACKEND_PORT}/api`;
}

const API_URL = getApiUrl();

// Token management
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const setUser = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user:', error);
  }
};

// API fetch function with token handling
export const apiFetch = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default API_URL;