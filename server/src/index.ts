import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './db';



const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());



// Mock user for MVP
const MOCK_USER_ID = 'user_123';

// Initialize mock user recursively if it doesn't exist
const ensureUser = async () => {
  const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: MOCK_USER_ID,
        name: 'Alex',
        age: '30',
        gender: 'Male',
        conditions: 'IBS, Asthma',
      },
    });
    console.log('Mock user initialized');
  }
};

// --- API ROUTES ---

// Helper to calculate streak
const calculateStreak = async (userId: string) => {
  const logs = await prisma.log.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (logs.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < logs.length; i++) {
    const logDate = new Date(logs[i].date);
    const diffTime = Math.abs(today.getTime() - logDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (i === 0 && (diffDays === 0 || diffDays === 1)) {
        streak = 1;
    } else if (i > 0) {
        const prevDate = new Date(logs[i-1].date);
        const diffBetweenLogs = Math.ceil(Math.abs(prevDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffBetweenLogs === 1) {
            streak++;
        } else {
            break;
        }
    } else {
        break; // First log is more than 1 day old
    }
  }

  return streak;
};

// Get Dashboard Data (Logs & Streak)
app.get('/api/dashboard', async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      where: { userId: MOCK_USER_ID },
      include: {
        symptoms: true,
        triggers: true,
      },
      orderBy: { date: 'desc' },
    });
    
    const streak = await calculateStreak(MOCK_USER_ID);
    const reports = await prisma.report.findMany({
      where: { userId: MOCK_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({ logs, streak, reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get User Profile
app.get('/api/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
    res.json({ profile: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
app.post('/api/profile', async (req, res) => {
  try {
    const { name, age, gender, conditions, notificationTime, isPro } = req.body;
    const user = await prisma.user.update({
      where: { id: MOCK_USER_ID },
      data: { name, age, gender, conditions, notificationTime, isPro }
    });
    res.json({ profile: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/profile', async (req, res) => {
  try {
    // Delete every associated record for this user
    await prisma.logSymptom.deleteMany({ where: { log: { userId: MOCK_USER_ID } } });
    await prisma.logTrigger.deleteMany({ where: { log: { userId: MOCK_USER_ID } } });
    await prisma.report.deleteMany({ where: { userId: MOCK_USER_ID } });
    await prisma.log.deleteMany({ where: { userId: MOCK_USER_ID } });
    
    // Reset user profile to default empty states
    await prisma.user.update({
      where: { id: MOCK_USER_ID },
      data: {
        name: 'New User',
        age: null,
        conditions: null,
        isPro: false,
        hasCompletedOnboarding: false,
        notificationTime: '08:00'
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Add a new Daily Log
app.post('/api/logs', async (req, res) => {
  try {
    const { date, symptoms, triggers, notes } = req.body;
    
    // UPSERT log by date and user
    // First, check if a log exists for this date
    let log = await prisma.log.findUnique({
      where: {
        userId_date: {
          userId: MOCK_USER_ID,
          date: date,
        }
      }
    });

    if (log) {
       // Delete associated symptoms and triggers to recreate them
       await prisma.logSymptom.deleteMany({ where: { logId: log.id }});
       await prisma.logTrigger.deleteMany({ where: { logId: log.id }});
       
       log = await prisma.log.update({
         where: { id: log.id },
         data: { notes }
       });
    } else {
      log = await prisma.log.create({
        data: {
          userId: MOCK_USER_ID,
          date,
          notes,
        },
      });
    }

    // Insert symptoms and triggers
    if (symptoms && symptoms.length > 0) {
      await prisma.logSymptom.createMany({
        data: symptoms.map((s: any) => ({
          logId: log.id,
          symptomId: s.symptomId,
          severity: s.severity,
        })),
      });
    }

    if (triggers && triggers.length > 0) {
      await prisma.logTrigger.createMany({
        data: triggers.map((triggerId: string) => ({
          logId: log.id,
          triggerId,
        })),
      });
    }

    res.json({ success: true, logId: log.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// Generate AI Insights via Claude
app.post('/api/insights/generate', async (req, res) => {
  try {
    // 1. Fetch user context & recent logs
    const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID }});
    const logs = await prisma.log.findMany({
      where: { userId: MOCK_USER_ID },
      include: { symptoms: true, triggers: true },
      orderBy: { date: 'desc' },
      take: 30, // Last 30 logs
    });
    
    if (logs.length < 1) { // Lowered from 3 to 1 for quick testing
      return res.json({ patterns: [] });
    }
    
    if (process.env.OPENROUTER_API_KEY?.includes('your-openrouter-api-key')) {
      return res.json({ 
        patterns: [{
          id: 'placeholder',
          symptom: 'Demo Pattern',
          trigger: 'Add API Key',
          level: 'possible',
          confidence: 100,
          description: 'This is a mock pattern appearing because you are using a placeholder API key. Connect a real key to see AI analysis!'
        }]
      });
    }
    
    // 2. Request insights from OpenRouter
    const prompt = `Analyze this symptom tracking data for a user with the following medical context: ${user?.conditions || 'None specified'}.
    
    Data:
    ${JSON.stringify(logs)}
    
    Return a JSON array of discovered patterns. Each pattern should have:
    - id (unique string)
    - symptom (the main symptom being analyzed, e.g. "Fatigue")
    - trigger (the likely trigger, e.g. "Caffeine")
    - level ("strong", "possible", or "weak")
    - confidence (0-100)
    - description (1-2 sentences explaining why this pattern was found)
    
    Respond with ONLY the JSON array, no markdown wrappers and no explanation outside the JSON. Use human-readable, title-cased symptom and trigger names (e.g., "Poor Concentration" instead of "poor_concentration").`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "SymptomBuddy",
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-small-3.2-24b-instruct",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '[]';
    
    try {
      // Clean up markdown code blocks if the model provided them
      const cleanedJson = responseText.replace(/```json|```/g, '').trim();
      const patterns = JSON.parse(cleanedJson);
      res.json({ patterns });
    } catch (parseError) {
      console.error("Failed to parse Claude response:", responseText);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Chat with AI about health data
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (process.env.OPENROUTER_API_KEY?.includes('your-openrouter-api-key')) {
      return res.json({ answer: "I'm successfully connected to your backend! To enable real AI brainpower, please replace the placeholder key in your server/.env file with a real OpenRouter API key." });
    }
    
    // 1. Fetch user context & recent logs
    const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID }});
    const logs = await prisma.log.findMany({
      where: { userId: MOCK_USER_ID },
      include: { symptoms: true, triggers: true },
      orderBy: { date: 'desc' },
      take: 20, // Last 20 logs for chat context
    });

    const contextString = logs.map((l: any) => 
      `${l.date}: Symptoms: ${l.symptoms.map((s: any) => s.symptomId).join(', ')}, Triggers: ${l.triggers.map((t: any) => t.triggerId).join(', ')}. Notes: ${l.notes || 'N/A'}`
    ).join('\n');

    const systemPrompt = `You are SymptomBuddy AI, a personal health assistant. 
    User Profile: ${user?.name}, Age: ${user?.age}, Conditions: ${user?.conditions}.
    
    User's Recent Tracking Data:
    ${contextString}
    
    Instructions:
    - Answer the user's questions strictly based on their data when possible.
    - Be professional, empathetic, and concise.
    - If you see a potential medical emergency, advise they contact a doctor.
    - Do NOT diagnose, only identify trends and patterns.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "SymptomBuddy",
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-small-3.2-24b-instruct",
        "messages": [
          { "role": "system", "content": systemPrompt },
          ...(messages || [])
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter Error:', errorData);
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
    
    res.json({ answer });
  } catch (error: any) {
    console.error('CHAT ENDPOINT ERROR:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Failed to chat with AI' });
  }
});

// Get Report History
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: MOCK_USER_ID },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Save a generated report to history
app.post('/api/reports', async (req, res) => {
  try {
    const { title, fileName } = req.body;
    const report = await (prisma as any).report.create({
      data: {
        userId: MOCK_USER_ID,
        title,
        fileName
      }
    });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

const HOST = '0.0.0.0';

app.listen(Number(port), HOST, async () => {
  console.log(`Server running on http://${HOST}:${port}`);
  await ensureUser();
});
