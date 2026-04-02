import { DailyLog } from '@/store/useLogStore';
import { SYMPTOMS, TRIGGERS } from '@/constants/Symptoms';

export interface Pattern {
  id: string;
  symptom: string;
  trigger: string;
  confidence: number; // 0–100
  level: 'strong' | 'possible' | 'weak';
  description: string;
}

// Simple Pearson-like correlation between a symptom's presence and a trigger's presence
function correlate(logs: DailyLog[], symptomId: string, triggerId: string): number {
  const n = logs.length;
  if (n < 1) return 0; // Lowered from 7 to 1 for instant patterns

  let both = 0, symptomOnly = 0, triggerOnly = 0, neither = 0;

  for (const log of logs) {
    const hasSymptom = log.symptoms.some((s) => s.symptomId === symptomId);
    const hasTrigger = log.triggers.includes(triggerId);

    if (hasSymptom && hasTrigger) both++;
    else if (hasSymptom) symptomOnly++;
    else if (hasTrigger) triggerOnly++;
    else neither++;
  }

  // Phi coefficient
  const a = both, b = symptomOnly, c = triggerOnly, d = neither;
  
  const num = a * d - b * c;
  const den = Math.sqrt((a + b) * (c + d) * (a + c) * (b + d));

  // High "Possible" for new users if co-occurrence exists
  if (n <= 3 && both > 0) {
    const raw = den === 0 ? 0 : (num / den + 1) / 2;
    return Math.max(0.6, raw); 
  }

  if (den === 0) return 0;
  return Math.max(0, Math.min(1, (num / den + 1) / 2));
}

export function formatLabel(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function computePatterns(logs: DailyLog[]): Pattern[] {
  const patterns: Pattern[] = [];

  for (const symptom of SYMPTOMS) {
    for (const trigger of TRIGGERS) {
      const correlation = correlate(logs, symptom.id, trigger.id);
      const confidence = Math.round(correlation * 100);

      if (confidence < 30) continue;

      const level: 'strong' | 'possible' | 'weak' =
        confidence > 75 ? 'strong' : confidence > 50 ? 'possible' : 'weak';

      const triggerLabel = trigger.label.toLowerCase();
      const symptomLabel = symptom.label.toLowerCase();
      const descriptions = {
        strong: `${symptom.label} appears significantly more often after ${triggerLabel}. This is a strong pattern worth discussing with your doctor.`,
        possible: `${symptom.label} seems to increase within 48 hours of ${triggerLabel}. There may be a link here.`,
        weak: `${symptom.label} is slightly higher on days with ${triggerLabel}. Keep logging to confirm.`,
      };

      patterns.push({
        id: `${symptom.id}_${trigger.id}`,
        symptom: symptom.label,
        trigger: trigger.label,
        confidence,
        level,
        description: descriptions[level],
      });
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

export function getTopSymptoms(logs: DailyLog[]): { symptom: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    for (const entry of log.symptoms) {
      counts[entry.symptomId] = (counts[entry.symptomId] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([symptomId, count]) => {
      const sym = SYMPTOMS.find((s) => s.id === symptomId);
      const name = sym?.label || formatLabel(symptomId);
      return { symptom: name, count };
    })
    .sort((a, b) => b.count - a.count);
}

export function getTriggerFrequency(logs: DailyLog[]): { trigger: string; count: number }[] {
  const counts: Record<string, number> = {};
  logs.forEach((log) => {
    log.triggers.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([triggerId, count]) => {
      const trig = TRIGGERS.find((t) => t.id === triggerId);
      const name = trig?.label || formatLabel(triggerId);
      return { trigger: name, count };
    })
    .sort((a, b) => b.count - a.count);
}

export function getSymptomTrend(logs: DailyLog[], symptomId: string): { date: string; severity: number }[] {
  return logs
    .filter((log) => log.symptoms.some((s) => s.symptomId === symptomId))
    .map((log) => ({
      date: log.date.slice(5), // MM-DD
      severity: log.symptoms.find((s) => s.symptomId === symptomId)?.severity || 0,
    }))
    .slice(-14); // last 14 days
}

export function getAverageScore(logs: DailyLog[]): number {
  if (!logs.length) return 0;
  let total = 0, count = 0;
  for (const log of logs) {
    for (const s of log.symptoms) {
      total += s.severity;
      count++;
    }
  }
  return count ? Math.round((total / count) * 10) / 10 : 0;
}

export function getBestWeek(logs: DailyLog[]): string {
  if (logs.length < 1) return 'Not enough data'; // Lowered from 7 to 1
  // Find week with lowest average severity
  let bestScore = Infinity, bestWeek = '';
  for (let i = 0; i <= logs.length - 7; i++) {
    const week = logs.slice(i, i + 7);
    let total = 0, count = 0;
    for (const log of week) {
      for (const s of log.symptoms) { total += s.severity; count++; }
    }
    const avg = count ? total / count : 0;
    if (avg < bestScore) {
      bestScore = avg;
      const start = week[0].date;
      bestWeek = `Week of ${start}`;
    }
  }
  return bestWeek;
}
