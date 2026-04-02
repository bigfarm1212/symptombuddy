import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Pattern } from '@/utils/ai';

export interface SymptomEntry {
  symptomId: string;
  severity: number; // 1–10
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  symptoms: SymptomEntry[];
  triggers: string[];
  notes: string;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  conditions: string;
  notificationTime: string;
  hasCompletedOnboarding: boolean;
  isPro: boolean;
}

interface LogStore {
  logs: DailyLog[];
  profile: UserProfile;
  streak: number;
  patterns: Pattern[];
  isGeneratingInsights: boolean;
  fetchDashboard: () => Promise<void>;
  addLog: (log: DailyLog) => Promise<void>;
  generateInsights: () => Promise<void>;
  updateLog: (date: string, log: Partial<DailyLog>) => void;
  getLogForDate: (date: string) => DailyLog | undefined;
  updateProfile: (profile: Partial<UserProfile>) => void;
  getStreak: () => number;
  getTotalLogs: () => number;
  askAI: (messages: {role: string, content: string}[]) => Promise<string>;
  reports: any[];
  fetchReports: () => Promise<void>;
  saveReport: (title: string, fileName: string) => Promise<void>;
  deleteProfile: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  name: '',
  age: '',
  gender: '',
  conditions: '',
  notificationTime: '08:00',
  hasCompletedOnboarding: false,
  isPro: false,
};

// Use expo-constants to dynamically find the host IP for the backend API
// This ensures physical devices can connect to the local server
const localhost = Constants.expoConfig?.hostUri?.split(`:`)[0];
const IP_ADDRESS = '192.168.212.156'; // Your computer's IP
const PROD_URL = 'https://symptombuddy-server.onrender.com/api'; // Update after Render deployment

const API_BASE = __DEV__ 
  ? (localhost ? `http://${localhost}:3000/api` : `http://${IP_ADDRESS}:3000/api`)
  : PROD_URL;

console.log('--- API CONFIG ---');
console.log('Host URI:', Constants.expoConfig?.hostUri);
console.log('Calculated API_BASE:', API_BASE);
console.log('------------------');

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      profile: defaultProfile,
      streak: 0,
      patterns: [],
      isGeneratingInsights: false,
      reports: [],

      fetchDashboard: async () => {
        try {
          // Wrap in try/catch to fallback to offline gracefully if server down
          const response = await fetch(`${API_BASE}/dashboard`);
          if (response.ok) {
            const data: any = await response.json();
            
            // Map backend objects back to frontend strings
            const formattedLogs = data.logs.map((log: any) => ({
              ...log,
              triggers: log.triggers.map((t: any) => t.triggerId)
            }));

            set({ logs: formattedLogs, streak: data.streak, reports: data.reports || [] });
            
            // Sync profile too
            const profileRes = await fetch(`${API_BASE}/profile`);
            if (profileRes.ok) {
            const profileData: any = await profileRes.json();
            set({ profile: { ...get().profile, ...profileData.profile } });
            }
          }
        } catch (error) {
          console.log(`API is unreachable at ${API_BASE}, using offline state.`);
        }
      },

      addLog: async (log) => {
        // Optimistic UI updates
        set((state) => {
          const existing = state.logs.findIndex((l) => l.date === log.date);
          if (existing >= 0) {
            const updated = [...state.logs];
            updated[existing] = log;
            return { logs: updated };
          }
          return { logs: [...state.logs, log] };
        });
        
        // Sync API
        try {
          await fetch(`${API_BASE}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
          });
          await get().fetchDashboard();
        } catch (error) {
          console.error(`Failed to sync log to server at ${API_BASE}`);
        }
      },

      generateInsights: async () => {
        set({ isGeneratingInsights: true });
        try {
          const res = await fetch(`${API_BASE}/insights/generate`, { method: 'POST' });
          if (res.ok) {
            const data: any = await res.json();
            set({ patterns: data.patterns });
          }
        } catch (error) {
          console.error('Failed to generate insights');
        } finally {
          set({ isGeneratingInsights: false });
        }
      },

      updateLog: (date, updates) =>
        set((state) => ({
          logs: state.logs.map((l) => (l.date === date ? { ...l, ...updates } : l)),
        })),

      getLogForDate: (date) => get().logs.find((l) => l.date === date),

      updateProfile: async (profileUpdates) => {
        try {
          set((state) => ({ profile: { ...state.profile, ...profileUpdates } }));
          
          await fetch(`${API_BASE}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(get().profile),
          });
        } catch (error) {
          console.error('Failed to sync profile to server');
        }
      },

      getStreak: () => {
        // We use state.streak initially or compute locally for instant feedback
        const logs = get().logs;
        return get().streak;
      },

      getTotalLogs: () => get().logs.length,

      fetchReports: async () => {
        try {
          const response = await fetch(`${API_BASE}/reports`);
          if (response.ok) {
            const data: any = await response.json();
            set({ reports: data.reports });
          }
        } catch (error) {
          console.error('Failed to fetch report history');
        }
      },

      saveReport: async (title, fileName) => {
        try {
          const response = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, fileName }),
          });
          if (response.ok) {
            await get().fetchReports();
          }
        } catch (error) {
          console.error('Failed to save report to history');
        }
      },



      askAI: async (messages) => {
        try {
          const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
          });
          if (response.ok) {
            const data: any = await response.json();
            return data.answer;
          }
          const errData: any = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to chat with AI');
        } catch (error: any) {
          console.error(`Chat error at ${API_BASE}:`, error.message);
          return `I'm having trouble connecting to the AI: ${error.message}`;
        }
      },
      
      deleteProfile: async () => {
        try {
          await fetch(`${API_BASE}/profile`, { method: 'DELETE' });
          // Wipe local state completely
          set({ 
            logs: [], 
            patterns: [], 
            streak: 0, 
            reports: [],
            profile: {
              name: '',
              age: '',
              gender: '',
              conditions: '',
              isPro: false,
              notificationTime: '08:00',
              hasCompletedOnboarding: false
            }
          });
        } catch (error) {
          console.error('Failed to delete account from server');
        }
      },
    }),
    {
      name: 'symptombuddy-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
