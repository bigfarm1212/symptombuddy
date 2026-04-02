import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function scheduleDailyReminder(hour: number, minute: number) {
  // 1. Cancel existing reminders
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Schedule new daily reminder
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "How are you feeling today?",
      body: "Take 60 seconds to log your symptoms and identify patterns.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log(`Daily reminder scheduled for ${hour}:${minute < 10 ? '0'+minute : minute} (ID: ${id})`);
  return id;
}

// Request permissions helper
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}
