import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useLogStore } from '@/store/useLogStore';
import { requestNotificationPermissions, scheduleDailyReminder } from '@/hooks/useNotifications';
import Colors from '@/constants/Colors';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const SymptomBuddyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.alert,
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({});

  const { fetchDashboard } = useLogStore();

  useEffect(() => {
    async function hideSplash() {
      if (loaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Already hidden
        }
        fetchDashboard();
        initNotifications();
      }
    }
    hideSplash();
  }, [loaded, fetchDashboard]);

  async function initNotifications() {
    const granted = await requestNotificationPermissions();
    if (granted) {
      // Don't overwrite users setting on every app load
      const { profile } = useLogStore.getState();
      if (profile.notificationTime) {
        const [h, m] = profile.notificationTime.split(':').map(Number);
        await scheduleDailyReminder(h, m);
      } else {
        await scheduleDailyReminder(20, 0); // Default if none
      }
    }
  }

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={SymptomBuddyTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="profile"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Profile & Settings',
                headerStyle: { backgroundColor: Colors.surface },
                headerTitleStyle: { color: Colors.text, fontWeight: '600', fontSize: 17 },
                headerTintColor: Colors.primary,
              }}
            />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
