import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn, ZoomOut, FadeIn, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Chip } from '@/components/ui/Chip';
import {
  SYMPTOMS,
  TRIGGERS,
  SYMPTOM_CATEGORIES,
  SymptomCategory,
  getSymptomsByCategory,
} from '@/constants/Symptoms';
import { useLogStore } from '@/store/useLogStore';

export default function LogScreen() {
  const { addLog } = useLogStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeCategory, setActiveCategory] = useState<SymptomCategory>('Physical');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, number>>({}); // id → severity
  const [selectedTriggers, setSelectedTriggers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categorySymptoms = useMemo(
    () => getSymptomsByCategory(activeCategory),
    [activeCategory]
  );

  const totalSelected = Object.keys(selectedSymptoms).length;

  const toggleSymptom = (id: string, sel: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSymptoms((prev) => {
      const next = { ...prev };
      if (sel) {
        next[id] = 5; // default severity
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const setSeverity = (id: string, value: number) => {
    const rounded = Math.round(value);
    if (selectedSymptoms[id] !== rounded) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSymptoms((prev) => ({ ...prev, [id]: rounded }));
  };

  const toggleTrigger = (id: string, sel: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTriggers((prev) => {
      const next = new Set(prev);
      sel ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    const log = {
      date: todayStr,
      symptoms: Object.entries(selectedSymptoms).map(([symptomId, severity]) => ({
        symptomId,
        severity,
      })),
      triggers: Array.from(selectedTriggers),
      notes,
      createdAt: Date.now(),
    };
    addLog(log);
    setSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      Alert.alert("Log saved!", "Great job tracking today. Keep it up!", [
        { text: "View Insights", onPress: () => router.push('/insights') },
        { text: "Done", onPress: () => router.push('/') },
      ]);
    }, 600);
  };

  const getSeverityLabel = (val: number) => {
    if (val <= 2) return 'Very mild';
    if (val <= 4) return 'Mild';
    if (val <= 6) return 'Moderate';
    if (val <= 8) return 'Severe';
    return 'Very severe';
  };

  const severityColor = (val: number) => {
    if (val <= 3) return Colors.primary;
    if (val <= 6) return Colors.amber;
    return Colors.alert;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <ThemedText variant="display">Log symptoms</ThemedText>
          <View style={styles.headerMeta}>
            <ThemedText variant="caption">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </ThemedText>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color={Colors.primary} />
              <ThemedText style={styles.timeBadgeText}>~45 sec</ThemedText>
            </View>
          </View>
        </View>
        {totalSelected > 0 && (
          <View style={styles.countBadge}>
            <ThemedText style={styles.countBadgeText}>{totalSelected}</ThemedText>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          {SYMPTOM_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                activeCategory === cat && styles.categoryTabActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <ThemedText
                style={[
                  styles.categoryTabLabel,
                  activeCategory === cat && styles.categoryTabLabelActive,
                ]}
              >
                {cat}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Symptom Chip Grid */}
        <View style={styles.section}>
          <View style={styles.chipGrid}>
            {categorySymptoms.map((symptom) => (
              <Chip
                key={symptom.id}
                label={symptom.label}
                selected={symptom.id in selectedSymptoms}
                onPress={(sel) => toggleSymptom(symptom.id, sel)}
              />
            ))}
            <Chip
              label="+ Add custom"
              selected={false}
              color={Colors.neutral}
              onPress={() =>
                Alert.alert('Custom symptom', 'Custom symptoms coming soon in v1.5!')
              }
            />
          </View>

          {/* Severity sliders for selected symptoms in this category */}
          {categorySymptoms
            .filter((s) => s.id in selectedSymptoms)
            .map((symptom) => {
              const val = selectedSymptoms[symptom.id];
              return (
                <ThemedCard key={symptom.id} style={styles.sliderCard}>
                  <View style={styles.sliderHeader}>
                    <ThemedText variant="section" style={styles.sliderLabel}>
                      {symptom.label}
                    </ThemedText>
                    <View style={[styles.severityBadge, { backgroundColor: severityColor(val) + '20' }]}>
                      <ThemedText style={[styles.severityLabel, { color: severityColor(val) }]}>
                        {getSeverityLabel(val)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.severityNum, { color: severityColor(val) }]}>
                      {val}/10
                    </ThemedText>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={val}
                    onValueChange={(v) => setSeverity(symptom.id, v)}
                    minimumTrackTintColor={severityColor(val)}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={severityColor(val)}
                  />
                  <View style={styles.sliderLabels}>
                    <ThemedText variant="caption">Mild</ThemedText>
                    <ThemedText variant="caption">Severe</ThemedText>
                  </View>
                </ThemedCard>
              );
            })}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Triggers */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            Possible triggers today
          </ThemedText>
          <View style={styles.chipGrid}>
            {TRIGGERS.map((trigger) => (
              <Chip
                key={trigger.id}
                label={trigger.label}
                selected={selectedTriggers.has(trigger.id)}
                onPress={(sel) => toggleTrigger(trigger.id, sel)}
                color={Colors.amber}
              />
            ))}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Notes */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            Anything else? <ThemedText variant="caption">(optional)</ThemedText>
          </ThemedText>
          <ThemedCard style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about today..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ThemedCard>
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, (saving || showSuccess) && { backgroundColor: Colors.success || '#4CAF50' }]}
            onPress={handleSave}
            disabled={saving || showSuccess || totalSelected === 0}
          >
            {showSuccess ? (
              <Animated.View entering={ZoomIn} exiting={ZoomOut} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <ThemedText style={styles.saveText}>Log saved!</ThemedText>
              </Animated.View>
            ) : saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <ThemedText style={styles.saveText}>
                  {totalSelected === 0 ? 'Select at least one symptom' : 'Save log'}
                </ThemedText>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  timeBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  countBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  countBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  categoryTabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  categoryTabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  sliderCard: {
    padding: 14,
    marginTop: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sliderLabel: {
    flex: 1,
    color: Colors.text,
  },
  severityBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  severityNum: {
    fontSize: 16,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  slider: {
    height: 36,
    marginHorizontal: -4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    color: Colors.text,
  },
  notesCard: {
    padding: 12,
  },
  notesInput: {
    minHeight: 80,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: undefined,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
