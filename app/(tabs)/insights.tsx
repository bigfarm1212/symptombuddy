import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TextInput, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PatternCard } from '@/components/ui/PatternCard';
import { useLogStore } from '@/store/useLogStore';
import {
  getTopSymptoms,
  getTriggerFrequency,
  getSymptomTrend,
  computePatterns,
  formatLabel,
} from '@/utils/ai';
import Animated, { FadeInUp, ZoomIn, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SYMPTOMS } from '@/constants/Symptoms';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

const chartConfig = {
  backgroundColor: Colors.surface,
  backgroundGradientFrom: Colors.surface,
  backgroundGradientTo: Colors.surface,
  color: (opacity = 1) => `rgba(83, 74, 183, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(95, 94, 90, ${opacity})`,
  style: { borderRadius: 12 },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: Colors.ai,
  },
  propsForBackgroundLines: {
    strokeDasharray: '4,4',
    stroke: Colors.border,
  },
};

const barChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(29, 158, 117, ${opacity})`,
};

export default function InsightsScreen() {
  const { logs, profile, patterns, isGeneratingInsights, generateInsights, askAI } = useLogStore();
  const isPro = profile.isPro;

  // Local instant patterns
  const localPatterns = useMemo(() => computePatterns(logs), [logs]);
  
  // Combine local and store patterns (deduplicated by id, taking HIGHEST confidence)
  const allPatterns = useMemo(() => {
    const combined = [...localPatterns, ...patterns];
    const map = new Map();
    
    combined.forEach(p => {
      const existing = map.get(p.id);
      if (!existing || p.confidence > existing.confidence) {
        map.set(p.id, p);
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }, [localPatterns, patterns]);

  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const handleSendChat = async () => {
    if (!chatMessage.trim() || isAsking) return;
    
    const userMsg = { role: 'user', content: chatMessage.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatMessage('');
    setIsAsking(true);

    const answer = await askAI(newMessages);
    
    // Typewriter effect simulation
    let currentText = '';
    const assistantMsg = { role: 'assistant', content: '' };
    const messagesWithPlaceholder = [...newMessages, assistantMsg];
    setMessages(messagesWithPlaceholder);

    const typingSpeed = 15; // ms per character
    const words = answer.split(' ');
    
    for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages([...newMessages, { role: 'assistant', content: currentText }]);
        await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
    
    setIsAsking(false);
  };


  const topSymptoms = useMemo(() => getTopSymptoms(logs), [logs]);
  const triggerFreq = useMemo(() => getTriggerFrequency(logs), [logs]);

  const [selectedSymptom, setSelectedSymptom] = useState(
    topSymptoms[0]?.symptom || ''
  );

  const symptomId = useMemo(() => {
    const s = SYMPTOMS.find((sy) => sy.label === selectedSymptom);
    return s?.id || SYMPTOMS[0].id;
  }, [selectedSymptom]);

  const trendData = useMemo(
    () => getSymptomTrend(logs, symptomId),
    [logs, symptomId]
  );

  const totalLogs = logs.length;
  const daysTracked = totalLogs;

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
            <ThemedText variant="display">Insights</ThemedText>
            <ThemedText variant="caption" style={styles.headerSub}>
              30-day overview · {totalLogs} logs
            </ThemedText>
          </View>
          <View style={styles.logsBadge}>
            <ThemedText style={styles.logsBadgeText}>{daysTracked}</ThemedText>
            <ThemedText style={styles.logsBadgeSub}>days</ThemedText>
          </View>
        </View>

        {/* Trend Chart */}
        {trendData.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="section">Symptom trend</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.symptomPicker}>
                {topSymptoms.slice(0, 5).map((s: any) => (
                  <TouchableOpacity
                    key={s.symptom}
                    style={[
                      styles.symptomPickerChip,
                      selectedSymptom === s.symptom && styles.symptomPickerChipActive,
                    ]}
                    onPress={() => setSelectedSymptom(s.symptom)}
                  >
                    <ThemedText
                      style={[
                        styles.symptomPickerLabel,
                        selectedSymptom === s.symptom && styles.symptomPickerLabelActive,
                      ]}
                    >
                      {s.symptom}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Animated.View entering={FadeIn.duration(800)}>
              <ThemedCard style={styles.chartCard}>
                <LineChart
                  data={{
                    labels: trendData.map((d: any) => d.date),
                    datasets: [{ data: trendData.map((d: any) => d.severity) }],
                  }}
                  width={chartWidth - 32}
                  height={160}
                  chartConfig={chartConfig}
                  bezier={trendData.length > 1}
                  style={styles.chart}
                  withInnerLines
                  withOuterLines={false}
                  fromZero
                  segments={5}
                />
              </ThemedCard>
            </Animated.View>
          </View>
        ) : (
          <ThemedCard style={[styles.section, styles.emptyChart]}>
            <Ionicons name="analytics-outline" size={40} color={Colors.ai} />
            <ThemedText variant="section" style={styles.emptyTitle}>
              Building your trend
            </ThemedText>
            <ThemedText variant="body" style={styles.emptyBody}>
              7 days of logging provides the most accurate medical patterns—but we'll show your first insights instantly!
            </ThemedText>
          </ThemedCard>
        )}

        {allPatterns.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ThemedText variant="section">AI Patterns</ThemedText>
                <View style={styles.aiBadge}>
                  <ThemedText style={styles.aiBadgeText}>✨ AI</ThemedText>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => generateInsights()} 
                style={styles.refreshBtn}
                disabled={isGeneratingInsights}
              >
                {isGeneratingInsights ? (
                  <ActivityIndicator size="small" color={Colors.ai} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={14} color={Colors.ai} />
                    <ThemedText style={styles.refreshBtnText}>Refresh</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {allPatterns.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInUp.delay(i * 60).springify()}>
                <PatternCard 
                  pattern={p} 
                  onPress={() => {
                    Haptics.selectionAsync();
                    // Detail view logic
                  }}
                />
              </Animated.View>
            ))}
            {!isPro && allPatterns.length > 2 && (
              <ThemedCard variant="ai" style={styles.proTeaser}>
                <View style={styles.proTeaserRow}>
                  <Ionicons name="lock-closed" size={20} color="#fff" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={{ color: '#fff', fontWeight: '700' }}>
                      Unlock {allPatterns.length - 2} more insights
                    </ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                      Upgrade to Pro for full analysis.
                    </ThemedText>
                  </View>
                  <TouchableOpacity style={styles.upgradeBtnMini}>
                    <ThemedText style={styles.upgradeBtnMiniText}>Upgrade</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedCard>
            )}
            {isPro && allPatterns.length >= 5 && (
              <ThemedText variant="caption" style={{ textAlign: 'center', marginTop: 12, color: Colors.textMuted }}>
                Showing your top 5 strongest patterns
              </ThemedText>
            )}
          </View>
        ) : (
          <ThemedCard style={styles.emptyInsightsCard}>
            <Animated.View entering={ZoomIn.duration(600).springify()}>
              <Ionicons name="sparkles-outline" size={48} color={Colors.ai} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <ThemedText variant="section" style={{ textAlign: 'center', marginBottom: 8 }}>
                Building your patterns
              </ThemedText>
              <ThemedText variant="body" style={{ textAlign: 'center', color: Colors.textSecondary, lineHeight: 20 }}>
                Keep logging — our AI starts identifying medical correlations after just 3-7 logs. You're building a smarter health picture!
              </ThemedText>
            </Animated.View>
          </ThemedCard>
        )}

        {/* Top Symptoms */}
        {topSymptoms.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="section" style={styles.sectionTitle}>
              Top symptoms this month
            </ThemedText>
            <ThemedCard style={styles.listCard}>
              {topSymptoms.map((s: any, i: number) => (
                <View key={s.symptom} style={[styles.listRow, i < topSymptoms.length - 1 && styles.listRowBorder]}>
                  <ThemedText style={styles.listRank}>#{i + 1}</ThemedText>

                  <ThemedText variant="body" style={styles.listName} color={Colors.text}>
                    {formatLabel(s.symptom)}
                  </ThemedText>
                  <View style={styles.listBarWrapper}>
                    <View
                      style={[
                        styles.listBar,
                        { width: `${Math.min(100, (s.count / Math.max(1, topSymptoms[0].count)) * 100)}%` },
                      ]}
                    />
                  </View>
                  <ThemedText variant="caption" style={styles.listCount}>
                    {s.count}×
                  </ThemedText>
                </View>
              ))}
            </ThemedCard>
          </View>
        )}

        {/* Trigger Frequency */}
        {triggerFreq.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="section" style={styles.sectionTitle}>
              Trigger frequency
            </ThemedText>
            <ThemedCard style={styles.listCard}>
              {triggerFreq.map((t: any, i: number) => (
                <View key={t.trigger} style={[styles.listRow, i < triggerFreq.length - 1 && styles.listRowBorder]}>

                  <ThemedText variant="body" style={styles.listName} color={Colors.text}>
                    {t.trigger}
                  </ThemedText>
                  <View style={styles.listBarWrapper}>
                    <View
                      style={[
                        styles.listBar,
                        {
                          width: `${Math.min(100, (t.count / Math.max(1, triggerFreq[0].count)) * 100)}%`,
                          backgroundColor: Colors.amber,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText variant="caption" style={styles.listCount}>
                    {t.count}×
                  </ThemedText>
                </View>
              ))}
            </ThemedCard>
          </View>
        )}

        {/* Ask AI — Pro feature */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.askAIButton, !isPro && styles.askAIButtonLocked]}
            onPress={() => isPro ? setChatVisible(true) : Alert.alert('Pro', 'Upgrade to Pro to use Ask AI.')}
            activeOpacity={0.85}
          >
            <View style={styles.askAILeft}>
              <Ionicons name={isPro ? 'chatbubble-ellipses' : 'lock-closed'} size={20} color={isPro ? Colors.ai : Colors.textMuted} />
              <View>
                <ThemedText style={[styles.askAITitle, !isPro && { color: Colors.textMuted }]}>
                  Ask AI
                </ThemedText>
                <ThemedText style={styles.askAISub}>
                  {isPro ? 'Ask any question about your data' : 'Pro feature · €8.99/month'}
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isPro ? Colors.ai : Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Modal visible={chatVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setChatVisible(false)}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={{ flex: 1, backgroundColor: Colors.background }}
          >
            <SafeAreaView style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <ThemedText variant="section" style={{ color: Colors.ai }}>Ask AI</ThemedText>
                <TouchableOpacity onPress={() => setChatVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={messages}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={styles.chatList}
                renderItem={({ item }) => (
                  <View style={[styles.chatMsg, item.role === 'user' ? styles.chatMsgUser : styles.chatMsgAssistant]}>
                    <MarkdownText 
                      content={item.content} 
                      style={[styles.chatMsgText, item.role === 'user' && { color: '#fff' }]} 
                    />
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.chatEmpty}>
                    <Ionicons name="sparkles" size={40} color={Colors.ai + '40'} />
                    <ThemedText style={styles.chatEmptyText}>
                      "What was my most common symptom this week?" or "Does my caffeine intake correlate with nausea?"
                    </ThemedText>
                  </View>
                )}
                ListFooterComponent={() => isAsking ? <AIShimmer /> : null}
              />

              <View style={styles.chatInputWrapper}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ask a question..."
                  placeholderTextColor={Colors.textMuted}
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  multiline
                />
                <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat} disabled={isAsking}>
                  {isAsking ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const AIShimmer = () => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.chatMsg, styles.chatMsgAssistant, animatedStyle]}>
      <View style={{ gap: 8 }}>
        <View style={{ width: '80%', height: 12, backgroundColor: Colors.ai + '40', borderRadius: 6 }} />
        <View style={{ width: '60%', height: 12, backgroundColor: Colors.ai + '40', borderRadius: 6 }} />
        <View style={{ width: '40%', height: 12, backgroundColor: Colors.ai + '40', borderRadius: 6 }} />
      </View>
    </Animated.View>
  );
};

const MarkdownText = ({ content, style }: { content: string; style: any }) => {
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <ThemedText style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <ThemedText key={index} style={[style, { fontWeight: '700', color: Colors.text }]}>
              {part.slice(2, -2)}
            </ThemedText>
          );
        }
        return part;
      })}
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: { paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerSub: {
    marginTop: 4,
  },
  logsBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.aiLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ai,
    lineHeight: 22,
  },
  logsBadgeSub: {
    fontSize: 10,
    color: Colors.ai,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.aiLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ai,
  },
  sectionTitle: {
    marginBottom: 10,
    color: Colors.text,
  },
  symptomPicker: {
    marginTop: 8,
  },
  symptomPickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
  },
  symptomPickerChipActive: {
    backgroundColor: Colors.aiLight,
    borderColor: Colors.ai,
  },
  symptomPickerEmoji: {
    fontSize: 14,
  },
  symptomPickerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  symptomPickerLabelActive: {
    color: Colors.ai,
    fontWeight: '600',
  },
  chartCard: {
    padding: 16,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 8,
  },
  emptyChart: {
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  emptyTitle: {
    textAlign: 'center',
    color: Colors.text,
  },
  emptyBody: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.ai,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  proTeaser: {
    marginTop: 6,
  },
  proTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proTeaserText: {
    color: '#fff',
    flex: 1,
    fontWeight: '500',
    fontSize: 13,
  },
  proBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  proBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  listCard: {
    padding: 4,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listRank: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    width: 22,
  },
  listEmoji: {
    fontSize: 18,
  },
  listName: {
    flex: 1,
    fontWeight: '500',
  },
  listBarWrapper: {
    width: 80,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  listBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  listCount: {
    width: 28,
    textAlign: 'right',
  },
  askAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.aiLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.ai + '40',
  },
  askAIButtonLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  askAILeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askAITitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ai,
  },
  askAISub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatList: {
    padding: 20,
    paddingBottom: 40,
  },
  chatMsg: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  chatMsgUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  chatMsgAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatMsgText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  chatEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  chatEmptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    color: Colors.text,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInsightsCard: {
    padding: 24,
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  upgradeBtnMini: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  upgradeBtnMiniText: {
    color: Colors.ai,
    fontSize: 12,
    fontWeight: '700',
  },
});
