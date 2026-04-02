import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { ThemedText } from './ThemedText';
import { Pattern } from '@/utils/ai';

interface PatternCardProps {
  pattern: Pattern;
  onPress?: () => void;
}

export function PatternCard({ pattern, onPress }: PatternCardProps) {
  const [expanded, setExpanded] = useState(false);

  const badgeColor =
    pattern.level === 'strong'
      ? Colors.alert
      : pattern.level === 'possible'
      ? Colors.ai
      : Colors.neutral;

  const badgeLabel =
    pattern.level === 'strong'
      ? 'Strong link'
      : pattern.level === 'possible'
      ? 'Possible link'
      : 'Weak signal';

  const bgColor =
    pattern.level === 'strong'
      ? Colors.alertLight
      : pattern.level === 'possible'
      ? Colors.aiLight
      : '#F5F5F3';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={() => {
        Haptics.selectionAsync();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
        onPress?.();
      }}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <ThemedText style={styles.badgeText}>{badgeLabel}</ThemedText>
        </View>
        <View style={styles.confidence}>
          <ThemedText style={[styles.confidenceNum, { color: badgeColor }]}>
            {pattern.confidence}%
          </ThemedText>
        </View>
      </View>
      <ThemedText variant="section" style={styles.title}>
        {pattern.symptom} ↔ {pattern.trigger}
      </ThemedText>
      {expanded && (
        <ThemedText variant="body" style={styles.description}>
          {pattern.description}
        </ThemedText>
      )}
      <ThemedText variant="caption" style={styles.tapHint}>
        {expanded ? 'Tap to collapse' : 'Tap for details'}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  confidence: {},
  confidenceNum: {
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 20,
  },
  tapHint: {
    marginTop: 4,
    color: Colors.textMuted,
  },
});
