import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { useLogStore } from '@/store/useLogStore';
import {
  getTopSymptoms,
  getTriggerFrequency,
  getAverageScore,
  getBestWeek,
  formatLabel,
} from '@/utils/ai';
import { generateAndShareReport } from '@/utils/pdf';

function StatCard({
  iconName,
  label,
  value,
  color = Colors.text,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <ThemedCard style={styles.statCard}>
      <Ionicons name={iconName} size={22} color={color} style={{ marginBottom: 6 }} />
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText variant="caption" style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedCard>
  );
}

export default function ReportScreen() {
  const { logs, profile, getTotalLogs, patterns, reports, fetchReports, saveReport } = useLogStore();
  const isPro = profile.isPro;

  React.useEffect(() => {
    fetchReports();
  }, []);

  const topSymptoms = useMemo(() => getTopSymptoms(logs), [logs]);
  const triggerFreq = useMemo(() => getTriggerFrequency(logs), [logs]);
  const avgScore = useMemo(() => getAverageScore(logs), [logs]);
  const bestWeek = useMemo(() => getBestWeek(logs), [logs]);
  const totalLogs = getTotalLogs();

  const sortedLogs = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);
  const periodStart = sortedLogs[0]?.date || '—';
  const periodEnd = sortedLogs[sortedLogs.length - 1]?.date || '—';
  const strongPatterns = patterns.filter((p) => p.level === 'strong');
  const mostFreqSymptom = topSymptoms[0];
  const strongestTrigger = triggerFreq[0];

  const handleExportPDF = async () => {
    if (!isPro) {
      Alert.alert(
        'Pro feature',
        'Generate unlimited PDF reports with a SymptomBuddy Pro subscription (€8.99/month).',
        [
          { text: 'Learn more', onPress: () => {} },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    await generateAndShareReport(profile, logs, patterns);
    // Save to history
    const date = new Date().toLocaleDateString();
    saveReport(`Summary Report - ${date}`, `report_${Date.now()}.pdf`);
  };

  const handleShareLink = () => {
    if (!isPro) {
      Alert.alert('Pro feature', 'Upgrade to Pro to share your report with your doctor.');
      return;
    }
    Alert.alert('Link created!', 'A secure 24-hour link has been created. Share it with your doctor.');
  };

  const summaryText =
    `During ${periodStart} to ${periodEnd}, you logged ${totalLogs} times. ` +
    (mostFreqSymptom
      ? `Your most frequent symptom was ${formatLabel(mostFreqSymptom.symptom)} (${mostFreqSymptom.count} times). `
      : '') +
    (strongestTrigger
      ? `The trigger logged most often was ${formatLabel(strongestTrigger.trigger)}. `
      : '') +
    (patterns.length > 0
      ? `The AI detected ${patterns.length} pattern${patterns.length > 1 ? 's' : ''} in your data.`
      : 'Keep logging to detect patterns.');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="display">Doctor Report</ThemedText>
          <ThemedText variant="caption" style={styles.headerSub}>
            Share with your doctor
          </ThemedText>
        </View>

        {/* Hero Card */}
        <View style={styles.section}>
          <ThemedCard variant="ai" style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Ionicons name="document-text" size={32} color="rgba(255,255,255,0.9)" />
              <View style={styles.heroInfo}>
                <ThemedText style={styles.heroTitle}>SymptomBuddy Report</ThemedText>
                <ThemedText style={styles.heroPeriod}>
                  {periodStart} → {periodEnd}
                </ThemedText>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <ThemedText style={styles.heroStatNum}>{totalLogs}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>logs</ThemedText>
              </View>
              <View style={styles.heroStat}>
                <ThemedText style={styles.heroStatNum}>{patterns.length}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>patterns</ThemedText>
              </View>
              <View style={styles.heroStat}>
                <ThemedText style={styles.heroStatNum}>{strongPatterns.length}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>strong links</ThemedText>
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* Key Findings */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            Key findings
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              iconName="medical-outline"
              label="Most frequent symptom"
              value={formatLabel(mostFreqSymptom?.symptom || '—')}
              color={Colors.alert}
            />
            <StatCard
              iconName="flash-outline"
              label="Strongest trigger"
              value={formatLabel(strongestTrigger?.trigger || '—')}
              color={Colors.amber}
            />
            <StatCard
              iconName="analytics-outline"
              label="Avg severity"
              value={avgScore ? `${avgScore}/10` : '—'}
              color={Colors.ai}
            />
            <StatCard
              iconName="star-outline"
              label="Best week"
              value={bestWeek.replace('Week of ', '')}
              color={Colors.primary}
            />
          </View>
        </View>

        {/* AI Summary */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            AI Summary
          </ThemedText>
          <ThemedCard style={styles.summaryCard}>
            <View style={styles.aiBadge}>
              <ThemedText style={styles.aiBadgeText}>AI Generated</ThemedText>
            </View>
            <ThemedText variant="body" style={styles.summaryText}>
              {summaryText}
            </ThemedText>
          </ThemedCard>
        </View>

        {/* Top Patterns */}
        {patterns.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="section" style={styles.sectionTitle}>
              Patterns to discuss with your doctor
            </ThemedText>
            {patterns.slice(0, 3).map((p, i) => (
              <View key={p.id} style={styles.patternRow}>
                <View style={[styles.patternNum, { backgroundColor: p.level === 'strong' ? Colors.alertLight : Colors.aiLight }]}>
                  <ThemedText style={[styles.patternNumText, { color: p.level === 'strong' ? Colors.alert : Colors.ai }]}>
                    {i + 1}
                  </ThemedText>
                </View>
                <View style={styles.patternInfo}>
                  <ThemedText variant="section" style={styles.patternTitle}>
                    {formatLabel(p.symptom)} ↔ {formatLabel(p.trigger)}
                  </ThemedText>
                  <ThemedText variant="body" style={styles.patternDesc}>
                    {p.description}
                  </ThemedText>
                  <ThemedText variant="caption">
                    Confidence: {p.confidence}%
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Appointment Prep Checklist */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            What to tell your doctor
          </ThemedText>
          <ThemedCard style={styles.checklistCard}>
            {[
              `"I've been tracking my symptoms for ${totalLogs} days"`,
              mostFreqSymptom ? `"My most common symptom is ${formatLabel(mostFreqSymptom.symptom)}"` : null,
              strongestTrigger ? `"I've noticed ${formatLabel(strongestTrigger.trigger)} seems to be a trigger"` : null,
              strongPatterns[0] ? `"There's a pattern between my ${formatLabel(strongPatterns[0].symptom)} and ${formatLabel(strongPatterns[0].trigger)}"` : null,
              `"Here's my SymptomBuddy report with all the data"`,
            ]
              .filter(Boolean)
              .map((item, i) => (
                <View key={i} style={styles.checklistItem}>
                  <View style={styles.checklistDot} />
                  <ThemedText variant="body" style={styles.checklistText}>
                    {item}
                  </ThemedText>
                </View>
              ))}
          </ThemedCard>
        </View>

        {/* Export Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportPDF}
            activeOpacity={0.85}
          >
            <Ionicons name={isPro ? 'download-outline' : 'lock-closed-outline'} size={20} color="#fff" />
            <ThemedText style={styles.exportButtonText}>
              {isPro ? 'Export PDF Report' : 'Export PDF — Pro feature'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, !isPro && styles.shareButtonLocked]}
            onPress={handleShareLink}
            activeOpacity={0.85}
          >
            <Ionicons name={isPro ? 'share-outline' : 'lock-closed-outline'} size={20} color={isPro ? Colors.ai : Colors.textMuted} />
            <ThemedText style={[styles.shareButtonText, !isPro && { color: Colors.textMuted }]}>
              {isPro ? 'Share with Doctor (24h link)' : 'Share — Pro feature'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Report History */}
        <View style={styles.section}>
          <ThemedText variant="section" style={styles.sectionTitle}>
            Report history
          </ThemedText>
          {reports && reports.length > 0 ? (
            <ThemedCard style={styles.historyCard}>
              {reports.map((r, i) => (
                <View key={r.id} style={[styles.historyRow, i < reports.length - 1 && styles.historyBorder]}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.ai} />
                  </View>
                  <View style={styles.historyInfo}>
                    <ThemedText style={styles.historyTitle}>{r.title}</ThemedText>
                    <ThemedText variant="caption" style={styles.historyDate}>
                      {new Date(r.createdAt).toLocaleDateString()} · {r.type}
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => Sharing.shareAsync(`file://${r.fileName}`)}>
                    <Ionicons name="share-outline" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </ThemedCard>
          ) : (
            <ThemedCard style={styles.historyCard}>
              <View style={styles.historyEmpty}>
                <Ionicons name="document-outline" size={32} color={Colors.border} />
                <ThemedText variant="caption" style={styles.historyEmptyText}>
                  No saved reports yet. Generate your first report above.
                </ThemedText>
              </View>
            </ThemedCard>
          )}
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
  scroll: { flex: 1 },
  content: { paddingTop: 16 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerSub: {
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    color: Colors.text,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  heroInfo: { flex: 1 },
  heroTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  heroPeriod: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 3,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 0,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  heroStatNum: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    padding: 14,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    flexShrink: 1,
  },
  statLabel: {
    color: Colors.textMuted,
    lineHeight: 16,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.aiLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  aiBadgeText: {
    color: Colors.ai,
    fontSize: 11,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
  },
  summaryText: {
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  patternNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  patternNumText: {
    fontWeight: '700',
    fontSize: 15,
  },
  patternInfo: { flex: 1 },
  patternTitle: {
    color: Colors.text,
    marginBottom: 4,
    fontSize: 14,
  },
  patternDesc: {
    lineHeight: 19,
    marginBottom: 4,
  },
  checklistCard: {
    padding: 14,
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  checklistDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  checklistText: {
    flex: 1,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  exportButton: {
    backgroundColor: Colors.ai,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    shadowColor: Colors.ai,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  shareButton: {
    backgroundColor: Colors.aiLight,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.ai + '40',
  },
  shareButtonLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  shareButtonText: {
    color: Colors.ai,
    fontWeight: '600',
    fontSize: 14,
  },
  historyCard: {
    padding: 16,
  },
  historyEmpty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  historyEmptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  historyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyInfo: { flex: 1 },
  historyTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.text,
  },
  historyDate: {
    marginTop: 2,
    color: Colors.textMuted,
  },
});
