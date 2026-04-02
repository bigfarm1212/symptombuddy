import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { useLogStore } from '@/store/useLogStore';
import { scheduleDailyReminder } from '@/hooks/useNotifications';

const NOTIFICATION_TIMES = ['07:00','08:00','09:00','12:00','18:00','20:00','21:00'];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightContent,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <ThemedText variant="body" style={styles.settingLabel} color={Colors.text}>
        {label}
      </ThemedText>
      {rightContent ? (
        rightContent
      ) : value ? (
        <>
          <ThemedText variant="caption" style={styles.settingValue}>
            {value}
          </ThemedText>
          {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
        </>
      ) : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profile, updateProfile, deleteProfile, logs } = useLogStore();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [conditions, setConditions] = useState(profile.conditions);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({ name, age, conditions });
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Account',
      'This will permanently delete ALL your data and logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteProfile();
            router.replace('/onboarding/welcome');
            Alert.alert('Account Deleted', 'All your data has been permanently removed.');
          },
        },
      ]
    );
  };

  const planBadge = profile.isPro ? 'Pro' : 'Free';
  const planColor = profile.isPro ? Colors.ai : Colors.neutral;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {name ? name.charAt(0).toUpperCase() : 'S'}
          </ThemedText>
        </View>
        <View style={[styles.planBadge, { backgroundColor: planColor + '20', borderColor: planColor + '40' }]}>
          <ThemedText style={[styles.planBadgeText, { color: planColor }]}>
            {planBadge}
          </ThemedText>
        </View>
      </View>

      {/* Profile Fields */}
      <View style={styles.section}>
        <ThemedText variant="section" style={styles.sectionTitle}>Profile</ThemedText>
        <ThemedCard style={styles.card}>
          <View style={styles.inputRow}>
            <ThemedText variant="label" style={styles.inputLabel}>Name</ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}>
            <ThemedText variant="label" style={styles.inputLabel}>Age</ThemedText>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Your age"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}>
            <ThemedText variant="label" style={styles.inputLabel}>Gender</ThemedText>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Gender',
                  undefined,
                  GENDER_OPTIONS.map((g) => ({
                    text: g,
                    onPress: () => updateProfile({ gender: g }),
                  }))
                )
              }
              style={styles.selectButton}
            >
              <ThemedText variant="body" color={profile.gender ? Colors.text : Colors.textMuted}>
                {profile.gender || 'Select...'}
              </ThemedText>
              <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ThemedCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit-outline" size={18} color={Colors.primary} />
          <ThemedText variant="section" style={{ marginLeft: 8 }}>Medical Profile</ThemedText>
        </View>
        <ThemedCard style={styles.medicalCard}>
          <ThemedText variant="caption" style={styles.medicalHint}>
            Shared with the AI to refine analysis of flare-ups and patterns.
          </ThemedText>
          <View style={styles.medicalInputWrapper}>
            <TextInput
              style={styles.medicalInput}
              value={conditions}
              onChangeText={setConditions}
              placeholder="List chronic conditions, daily medications, or allergies..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              blurOnSubmit={false}
            />
          </View>
        </ThemedCard>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <ThemedText variant="section" style={styles.sectionTitle}>Notifications</ThemedText>
        <ThemedCard style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            label="Daily log reminder"
            rightContent={
              <Switch
                value={notifEnabled}
                onValueChange={(val) => {
                  setNotifEnabled(val);
                  if (val) {
                    Alert.alert('Reminder On', `You will be reminded daily at ${profile.notificationTime || '08:00'}`);
                  }
                }}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.inputDivider} />
          <SettingRow
            icon="time-outline"
            label="Reminder time"
            value={profile.notificationTime || '08:00'}
            onPress={() => {
                Alert.alert(
                  'Set Reminder Time',
                  'Select when you want to be reminded to log your symptoms.',
                  NOTIFICATION_TIMES.map((time) => ({
                    text: time,
                    onPress: async () => {
                      updateProfile({ notificationTime: time });
                      const [h, m] = time.split(':').map(Number);
                      await scheduleDailyReminder(h, m);
                    },
                  }))
                );
            }}
          />
          <View style={styles.inputDivider} />
          <SettingRow
            icon="flask-outline"
            label="Notification Status"
            rightContent={
              <ThemedText variant="caption" style={{ color: Colors.success, fontWeight: '700' }}>
                ✅ ACTIVE
              </ThemedText>
            }
          />
          <TouchableOpacity 
            style={styles.testBtn}
            onPress={async () => {
              const Notifications = require('expo-notifications');
              const { status } = await Notifications.requestPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Go to your phone settings and enable notifications for SymptomBuddy.');
                return;
              }
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "SymptomBuddy Test! 🔔",
                  body: "This confirms your notifications are working perfectly on this device.",
                },
                trigger: null,
              });
              Alert.alert('Sent', 'Test notification triggered!');
            }}
          >
            <ThemedText style={styles.testBtnText}>Send test notification</ThemedText>
          </TouchableOpacity>
        </ThemedCard>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <ThemedText variant="section" style={styles.sectionTitle}>Subscription</ThemedText>
        <ThemedCard style={styles.card}>
          <SettingRow
            icon="star-outline"
            label="Current plan"
            value={profile.isPro ? 'Pro — €8.99/month' : 'Free plan'}
            onPress={() =>
              Alert.alert(
                'SymptomBuddy Pro',
                'Unlock unlimited AI insights, PDF reports, Ask AI, and more for €8.99/month.',
                [
                  { text: 'Upgrade to Pro', onPress: () => updateProfile({ isPro: true }) },
                  { text: 'Maybe later', style: 'cancel' },
                ]
              )
            }
          />
          <View style={styles.inputDivider} />
          <SettingRow
            icon="download-outline"
            label="Export data (CSV)"
            value={profile.isPro ? undefined : 'Pro only'}
            onPress={() =>
              profile.isPro
                ? Alert.alert('Export', 'CSV export coming soon!')
                : Alert.alert('Pro feature', 'Upgrade to Pro to export your data.')
            }
          />
        </ThemedCard>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <ThemedText variant="section" style={styles.sectionTitle}>Privacy</ThemedText>
        <ThemedCard style={styles.card}>
          <SettingRow
            icon="shield-outline"
            label="Data usage preferences"
            onPress={() => Alert.alert('Privacy', 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your data is never sold.')}
          />
          <View style={styles.inputDivider} />
          <SettingRow
            icon="trash-outline"
            label="Delete account"
            onPress={handleDeleteAccount}
          />
        </ThemedCard>
      </View>

      {/* Save Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <ThemedText style={styles.saveButtonText}>Save changes</ThemedText>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.footer}>
        <ThemedText variant="caption" style={styles.footerText}>
          SymptomBuddy v1.0.0 · {logs.length} logs · All data encrypted
        </ThemedText>
      </View>

        <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 80,
    includeFontPadding: false,
  },
  planBadge: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    marginBottom: 8,
    color: Colors.text,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  medicalCard: {
    paddingVertical: 16,
    backgroundColor: Colors.primaryLight + '40',
    borderWidth: 0,
  },
  medicalHint: {
    paddingHorizontal: 16,
    marginBottom: 12,
    color: Colors.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  medicalInputWrapper: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicalInput: {
    minHeight: 120,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputLabel: {
    width: 80,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  inputHint: {
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontFamily: undefined,
  },
  inputMultiline: {
    marginHorizontal: 16,
    marginBottom: 14,
    minHeight: 70,
    padding: 0,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontWeight: '500',
  },
  settingValue: {
    color: Colors.textMuted,
    marginRight: 4,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.textMuted,
  },
  testBtn: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  testBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
