import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, FadeInLeft } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { ThemedCard } from './ThemedCard';

interface StreakCardProps {
  streak: number;
  totalLogs: number;
}

export function StreakCard({ streak, totalLogs }: StreakCardProps) {
  return (
    <ThemedCard variant="primary" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View>
            <Animated.View key={`streak-${streak}`} entering={ZoomIn.duration(400).springify()}>
              <ThemedText style={styles.streakNum}>{streak}</ThemedText>
            </Animated.View>
            <ThemedText style={styles.streakLabel}>day streak!</ThemedText>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.right}>
          <Animated.View key={`total-${totalLogs}`} entering={ZoomIn.duration(400).springify()}>
            <ThemedText style={styles.totalNum}>{totalLogs}</ThemedText>
          </Animated.View>
          <ThemedText style={styles.totalLabel}>total logs</ThemedText>
        </View>
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          key={`bar-${streak}`}
          entering={FadeInLeft.duration(1000).springify()}
          style={[styles.progressFill, { width: `${Math.min(100, (streak / 30) * 100)}%` }]} 
        />
      </View>
      <ThemedText style={styles.progressLabel}>
        {streak < 7 ? `✨ AI Insight active! Best results after 7 days.` : streak < 30 ? `${30 - streak} more days to full report` : 'Full report unlocked!'}
      </ThemedText>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  streakNum: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 36,
  },
  streakLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  right: {
    alignItems: 'center',
  },
  totalNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  totalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
});
