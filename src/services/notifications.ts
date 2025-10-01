import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior (only on native platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

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

  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  if (Platform.OS === 'android') {
    trigger.channelId = 'default';
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger,
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




