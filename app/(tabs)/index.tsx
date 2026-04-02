import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { StreakCard } from '@/components/ui/StreakCard';
import { Chip } from '@/components/ui/Chip';
import { useLogStore } from '@/store/useLogStore';
import { computePatterns, getTopSymptoms, formatLabel } from '@/utils/ai';
import { SYMPTOMS } from '@/constants/Symptoms';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const { logs, profile, getStreak, getTotalLogs, patterns } = useLogStore();

  const streak = getStreak();
  const totalLogs = getTotalLogs();
  const greeting = getGreeting();
  const name = profile.name || 'there';

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find((l) => l.date === todayStr);
  const yesterdayLog = logs.find((l) => l.date === yesterday);

  // Combine local and store patterns (deduplicated by id, taking HIGHEST confidence)
  const allPatterns = useMemo(() => {
    const localPatterns = computePatterns(logs);
    const combined = [...localPatterns, ...patterns];
    const map = new Map();
    
    combined.forEach(p => {
      const existing = map.get(p.id);
      if (!existing || p.confidence > existing.confidence) {
        map.set(p.id, p);
      }
    });

    return Array.from(map.values())
      .filter(p => p.confidence > 50)
      .sort((a, b) => b.confidence - a.confidence);
  }, [logs, patterns]);

  const topPatterns = allPatterns.slice(0, 5);
  const topPattern = allPatterns[0];

  const topSymptoms = useMemo(() => getTopSymptoms(logs), [logs]);

  const hasLoggedToday = !!todayLog;

  if (!profile.hasCompletedOnboarding && !profile.name) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="caption" style={styles.date}>
              {formatDate(new Date())}
            </ThemedText>
            <ThemedText variant="display">
              {greeting}, {name}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {name.charAt(0).toUpperCase() || 'S'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <StreakCard streak={streak} totalLogs={totalLogs} />

        {/* AI Insight Card */}
        {topPattern ? (
          <TouchableOpacity
            style={styles.sectionWrapper}
            onPress={() => router.push('/insights')}
            activeOpacity={0.9}
          >
            <ThemedCard variant="ai" style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.aiBadge}>
                  <ThemedText style={styles.aiBadgeText}>AI Insight</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </View>
              <ThemedText style={styles.insightTitle}>
                {formatLabel(topPattern.symptom)} ↔ {formatLabel(topPattern.trigger)}
              </ThemedText>
              <ThemedText style={styles.insightBody}>
                {topPattern.description}
              </ThemedText>
              <View style={styles.insightFooter}>
                <ThemedText style={styles.insightConf}>
                  {topPattern.confidence}% confidence · Tap to view all patterns
                </ThemedText>
              </View>
            </ThemedCard>
          </TouchableOpacity>
        ) : (
          <ThemedCard variant="ai" style={[styles.insightCard, styles.sectionWrapper]}>
            <View style={styles.aiBadge}>
              <ThemedText style={styles.aiBadgeText}>AI Insight</ThemedText>
            </View>
            <ThemedText style={styles.insightTitle}>Instant AI active!</ThemedText>
            <ThemedText style={styles.insightBody}>
              Start logging! Your first insights appear instantly. Log for 7 days for most accurate medical patterns.
            </ThemedText>
          </ThemedCard>
        )}

        {/* Today's status / CTA */}
        {hasLoggedToday ? (
          <ThemedCard style={[styles.sectionWrapper, styles.todayCard]}>
            <View style={styles.todayHeader}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <ThemedText variant="section" style={{ marginLeft: 8 }}>
                Today's log complete ✓
              </ThemedText>
            </View>
            <View style={styles.chipRow}>
              {todayLog?.symptoms.slice(0, 4).map((s) => {
                const sym = SYMPTOMS.find((sy) => sy.id === s.symptomId);
                return (
                  <Chip
                    key={s.symptomId}
                    label={sym?.label || s.symptomId}
                    selected
                    size="sm"
                  />
                );
              })}
            </View>
          </ThemedCard>
        ) : (
          <TouchableOpacity
            style={[styles.sectionWrapper, styles.ctaButton]}
            onPress={() => router.push('/log')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <ThemedText style={styles.ctaText}>+ Log today's symptoms</ThemedText>
            <ThemedText style={styles.ctaTime}>~45 sec</ThemedText>
          </TouchableOpacity>
        )}

        {/* Yesterday's snapshot */}
        {yesterdayLog && yesterdayLog.symptoms.length > 0 && (
          <View style={styles.sectionWrapper}>
            <ThemedText variant="section" style={styles.sectionTitle}>
              Yesterday's symptoms
            </ThemedText>
            <ThemedCard style={styles.snapshotCard}>
              <View style={styles.chipRow}>
                {yesterdayLog.symptoms.map((s) => {
                  const sym = SYMPTOMS.find((sy) => sy.id === s.symptomId);
                  return (
                    <Chip
                      key={s.symptomId}
                      label={sym?.label || s.symptomId}
                      selected
                      size="sm"
                    />
                  );
                })}
              </View>
              {yesterdayLog.triggers.length > 0 && (
                <ThemedText variant="caption" style={styles.triggerText}>
                  Triggers: {yesterdayLog.triggers.join(', ')}
                </ThemedText>
              )}
            </ThemedCard>
          </View>
        )}

        {/* Top symptoms this month */}
        {topSymptoms.length > 0 && (
          <View style={styles.sectionWrapper}>
            <ThemedText variant="section" style={styles.sectionTitle}>
              Most common this month
            </ThemedText>
            <View style={styles.symptomList}>
              {topSymptoms.slice(0, 4).map((s, i) => (
                <View key={s.symptom} style={styles.symptomRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>
                      {s.symptom}
                    </ThemedText>
                    <View style={[styles.freqBar, { width: `${Math.min(100, (s.count / Math.max(1, topSymptoms[0].count)) * 100)}%`, marginTop: 4 }]} />
                  </View>
                  <ThemedText variant="caption" style={styles.symptomCount}>
                    {s.count}×
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weekly pattern teaser */}
        {topPatterns.length > 0 && (
          <TouchableOpacity
            style={styles.sectionWrapper}
            onPress={() => router.push('/insights')}
            activeOpacity={0.85}
          >
            <ThemedCard style={styles.teaserCard}>
              <View style={styles.teaserRow}>
                <Ionicons name="analytics-outline" size={20} color={Colors.ai} />
                <ThemedText variant="body" style={styles.teaserText}>
                  {topPatterns.length} patterns found · View full analysis →
                </ThemedText>
              </View>
            </ThemedCard>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  date: {
    marginBottom: 4,
    color: Colors.textMuted,
  },
  profileBtn: {},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  insightCard: {
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  insightBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
    marginBottom: 10,
  },
  insightFooter: {},
  insightConf: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  ctaTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  todayCard: {},
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 10,
    color: Colors.text,
  },
  snapshotCard: {
    padding: 12,
  },
  triggerText: {
    marginTop: 8,
    color: Colors.textMuted,
  },
  symptomList: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  symptomRank: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    width: 16,
  },
  symptomName: {
    flex: 1,
    color: Colors.text,
    fontWeight: '500',
  },
  freqBar: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    minWidth: 20,
  },
  symptomCount: {
    color: Colors.textMuted,
    width: 28,
    textAlign: 'right',
  },
  teaserCard: {
    padding: 14,
  },
  teaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teaserText: {
    color: Colors.ai,
    fontWeight: '500',
  },
});
