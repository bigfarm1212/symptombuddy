import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Chip } from '@/components/ui/Chip';
import { useLogStore } from '@/store/useLogStore';
import { SYMPTOM_CATEGORIES } from '@/constants/Symptoms';
import { scheduleDailyReminder } from '@/hooks/useNotifications';

const REMINDER_TIMES = ['07:00', '08:00', '09:00', '12:00', '18:00', '20:00', '21:00'];

export default function SetupScreen() {
  const { updateProfile } = useLogStore();

  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['Physical', 'Mental', 'Digestive', 'Sleep'])
  );
  const [reminderTime, setReminderTime] = useState('08:00');

  const toggleCategory = (cat: string, sel: boolean) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      sel ? next.add(cat) : next.delete(cat);
      return next;
    });
  };

  const handleStart = async () => {
    updateProfile({
      name: name.trim() || 'there',
      notificationTime: reminderTime,
      hasCompletedOnboarding: true,
    });

    // Schedule the chosen reminder
    const [h, m] = reminderTime.split(':').map(Number);
    if (h !== undefined && m !== undefined) {
      await scheduleDailyReminder(h, m);
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
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
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="display" style={styles.headline}>
            Quick setup
          </ThemedText>
          <ThemedText variant="body" style={styles.subline}>
            All of this can be changed later. It only takes 30 seconds.
          </ThemedText>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            What should we call you?
          </ThemedText>
          <ThemedCard style={styles.inputCard}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your first name..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </ThemedCard>
        </View>

        {/* Category Preferences */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            Which areas do you want to track?
          </ThemedText>
          <ThemedText variant="caption" style={styles.sectionHint}>
            You can always log all types — this just sets your default view.
          </ThemedText>
          <ThemedCard style={styles.chipCard}>
            <View style={styles.chipGrid}>
              {SYMPTOM_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={selectedCategories.has(cat)}
                  onPress={(sel) => toggleCategory(cat, sel)}
                />
              ))}
            </View>
          </ThemedCard>
        </View>

        {/* Reminder Time */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            Daily reminder time
          </ThemedText>
          <ThemedText variant="caption" style={styles.sectionHint}>
            We'll send a gentle nudge to log your symptoms.
          </ThemedText>
          <View style={styles.timeGrid}>
            {REMINDER_TIMES.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChip,
                  reminderTime === time && styles.timeChipActive,
                ]}
                onPress={() => setReminderTime(time)}
              >
                <ThemedText
                  style={[
                    styles.timeChipText,
                    reminderTime === time && styles.timeChipTextActive,
                  ]}
                >
                  {time}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Note */}
        <ThemedCard style={[styles.section, styles.privacyCard]}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
          <ThemedText variant="caption" style={styles.privacyText}>
            Your health data is encrypted at rest (AES-256) and in transit (TLS 1.3). It's never sold to third parties.
          </ThemedText>
        </ThemedCard>

        {/* Dots + CTA */}
        <View style={styles.navSection}>
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.startButtonText}>Start tracking</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <ThemedText variant="caption" color={Colors.textMuted}>
              Skip setup
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  header: {
    marginBottom: 24,
  },
  headline: {
    marginBottom: 8,
    color: Colors.text,
  },
  subline: {
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    color: Colors.text,
  },
  sectionHint: {
    marginBottom: 10,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  inputCard: {
    padding: 16,
  },
  nameInput: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: undefined,
  },
  chipCard: {
    padding: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  privacyText: {
    flex: 1,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  navSection: {
    gap: 12,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  skipButton: {
    padding: 8,
  },
});
