import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleDailyReminder(hour: number, minute: number, title: string, body: string) {
  const granted = await requestPermissions();

  if (!granted) {
    return null;
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function scheduleWaterReminder() {
  return await scheduleDailyReminder(
    10, // 10:00 AM
    0,
    'Hydration Time! 💧',
    "Don't forget to log your water intake today"
  );
}

export async function scheduleWorkoutReminder() {
  return await scheduleDailyReminder(
    18, // 6:00 PM
    0,
    'Workout Time! 💪',
    'Time to crush those push-ups and log your workout'
  );
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
