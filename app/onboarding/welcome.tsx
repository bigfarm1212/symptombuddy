import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const SYMPTOMS_PREVIEW = [
  { label: 'Fatigue' },
  { label: 'Headache' },
  { label: 'Brain fog' },
  { label: 'Bloating' },
  { label: 'Anxiety' },
  { label: 'Insomnia' },
  { label: 'Dizziness' },
  { label: 'Nausea' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <ThemedText variant="caption" color={Colors.textMuted}>
            Skip
          </ThemedText>
        </TouchableOpacity>

        {/* Illustration Area */}
        <View style={styles.illustrationArea}>
          {/* Floating chips illustration */}
          <View style={styles.chipsContainer}>
            {SYMPTOMS_PREVIEW.map((s, i) => (
              <View
                key={s.label}
                style={[
                  styles.floatingChip,
                  {
                    opacity: 0.6 + (i % 3) * 0.13,
                    transform: [{ rotate: `${(i % 5 - 2) * 4}deg` }],
                  },
                ]}
              >
                <ThemedText style={styles.chipLabel}>{s.label}</ThemedText>
              </View>
            ))}
          </View>

          {/* Center question */}
          <View style={styles.questionBubble}>
            <Ionicons name="help" size={32} color={Colors.amber} />
          </View>
        </View>

        {/* Copy */}
        <View style={styles.copySection}>
          <ThemedText variant="display" style={styles.headline}>
            Do you have symptoms no one can explain?
          </ThemedText>
          <ThemedText variant="body" style={styles.subline}>
            Millions of people experience recurring symptoms — fatigue, headaches, bloating, brain fog — with no clear answers.
          </ThemedText>
          <ThemedText variant="body" style={styles.subline2}>
            <ThemedText style={{ fontWeight: '600', color: Colors.primary }}>SymptomBuddy </ThemedText>
            helps you track, understand, and share your symptoms with your doctor.
          </ThemedText>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push('/onboarding/how-it-works')}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.nextButtonText}>Get started →</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: height * 0.4,
    position: 'relative',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  floatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  questionBubble: {
    position: 'absolute',
    right: 0,
    top: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  copySection: {
    paddingBottom: 24,
  },
  headline: {
    fontSize: 26,
    lineHeight: 34,
    color: Colors.text,
    marginBottom: 14,
  },
  subline: {
    marginBottom: 10,
    lineHeight: 22,
  },
  subline2: {
    lineHeight: 22,
  },
  ctaSection: {
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
