// Learn more https://docs.expo.dev/guides/testing-with-jest/
import '@testing-library/jest-native/extend-expect';

// Mock Firebase
jest.mock('./src/services/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: true,
  missingFirebaseEnvVars: [],
}));

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => children,
  useGoogleLogin: () => jest.fn(),
}));
