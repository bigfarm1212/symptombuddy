import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';

const STEPS = [
  {
    step: '1',
    iconName: 'pencil' as any,
    title: 'Log in 60 seconds',
    description: 'Tap symptoms, rate severity, and note triggers. No typing needed — just chips and sliders.',
    color: Colors.primary,
    bgColor: Colors.primaryLight,
  },
  {
    step: '2',
    iconName: 'hardware-chip' as any,
    title: 'AI detects patterns',
    description: 'After 7–30 days of logging, the AI surfaces correlations between your symptoms and triggers.',
    color: Colors.ai,
    bgColor: Colors.aiLight,
  },
  {
    step: '3',
    iconName: 'document-text' as any,
    title: 'Share with your doctor',
    description: 'Generate a professional PDF report your doctor can read in 2 minutes. Finally, real data.',
    color: Colors.alert,
    bgColor: Colors.alertLight,
  },
];

export default function HowItWorksScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="display" style={styles.headline}>
            How SymptomBuddy works
          </ThemedText>
          <ThemedText variant="body" style={styles.subline}>
            Three simple steps to understanding your health.
          </ThemedText>
        </View>

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step.step} style={styles.stepRow}>
              <View style={[styles.stepIconWrapper, { backgroundColor: step.bgColor }]}>
                <Ionicons name={step.iconName} size={26} color={step.color} />
              </View>
              <View style={styles.stepContent}>
                <View style={[styles.stepNumBadge, { backgroundColor: step.color }]}>
                  <ThemedText style={styles.stepNum}>{step.step}</ThemedText>
                </View>
                <ThemedText variant="section" style={styles.stepTitle}>
                  {step.title}
                </ThemedText>
                <ThemedText variant="body" style={styles.stepDesc}>
                  {step.description}
                </ThemedText>
              </View>
              {i < STEPS.length - 1 && (
                <View style={styles.stepConnector}>
                  <View style={styles.stepLine} />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Free note */}
        <ThemedCard style={styles.freeCard}>
          <Ionicons name="gift" size={28} color={Colors.primary} style={{ marginRight: 6 }} />
          <View style={styles.freeContent}>
            <ThemedText variant="section" style={styles.freeTitle}>
              Free to start
            </ThemedText>
            <ThemedText variant="body" style={styles.freeDesc}>
              30 days of logging, 2 AI insights and 1 PDF report — completely free. Upgrade when you're ready.
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Navigation */}
        <View style={styles.navSection}>
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push('/onboarding/setup')}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.nextButtonText}>Set up my account →</ThemedText>
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
  steps: {
    flex: 1,
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
    position: 'relative',
  },
  stepIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepNumBadge: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  stepNum: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepTitle: {
    color: Colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    lineHeight: 20,
  },
  stepConnector: {
    position: 'absolute',
    left: 27,
    top: 56,
    bottom: 0,
    width: 2,
    alignItems: 'center',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  freeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    shadowOpacity: 0,
    elevation: 0,
  },
  freeContent: {
    flex: 1,
  },
  freeTitle: {
    color: Colors.primary,
    marginBottom: 2,
  },
  freeDesc: {
    lineHeight: 18,
  },
  navSection: {
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
