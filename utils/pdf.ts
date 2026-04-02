import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DailyLog, UserProfile, useLogStore } from '@/store/useLogStore';
import { getAverageScore, getBestWeek, getTopSymptoms, getTriggerFrequency, Pattern, formatLabel } from './ai';

export async function generateAndShareReport(
  profile: UserProfile,
  logs: DailyLog[],
  patterns: Pattern[]
) {
  const topSymptoms = getTopSymptoms(logs);
  const triggerFreq = getTriggerFrequency(logs);
  const avgScore = getAverageScore(logs);
  const bestWeek = getBestWeek(logs);

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 40px; }
          h1 { color: #534AB7; font-size: 28px; margin-bottom: 5px; }
          h2 { color: #1D9E75; font-size: 22px; margin-top: 30px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px;}
          p { font-size: 16px; line-height: 1.5; color: #4a4a4a; }
          .patient-info { background: #f9f8f5; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
          .stat-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eaeaea; flex: 1; min-width: 150px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #534AB7; }
          .stat-label { font-size: 14px; color: #7f7f7f; margin-top: 4px; }
          .pattern { margin-bottom: 15px; }
          ul { padding-left: 20px; }
          li { font-size: 16px; color: #4a4a4a; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>SymptomBuddy Medical Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        
        <div class="patient-info">
          <strong>Patient:</strong> ${profile.name || 'Not provided'} <br/>
          <strong>Age / Gender:</strong> ${profile.age || 'N/A'} / ${profile.gender || 'N/A'} <br/>
          <strong>Known Conditions:</strong> ${profile.conditions || 'None'} <br/>
        </div>

        <h2>Executive Summary</h2>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${logs.length} Days</div>
            <div class="stat-label">Total Data Points</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${avgScore}/10</div>
            <div class="stat-label">Avg Severity</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${topSymptoms[0]?.symptom || 'N/A'}</div>
            <div class="stat-label">Top Symptom</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${bestWeek}</div>
            <div class="stat-label">Lowest Symptoms</div>
          </div>
        </div>

        <h2>Top Symptoms</h2>
        <ul>
          ${topSymptoms.map(s => `<li><strong>${s.symptom}:</strong> Logged ${s.count} times</li>`).join('')}
        </ul>

        <h2>Most Frequent Triggers</h2>
        <ul>
          ${triggerFreq.slice(0, 5).map(t => `<li><strong>${t.trigger}:</strong> ${t.count} days</li>`).join('')}
        </ul>

        <h2>AI-Detected Patterns</h2>
        ${patterns.length === 0 ? '<p>No significant patterns detected yet. Ensure you have tracked consistently for at least 7 days.</p>' : 
          patterns.map(p => `
            <div class="pattern">
              <strong>${formatLabel(p.symptom)} ↔ ${formatLabel(p.trigger)}</strong> (${p.level} link, ${p.confidence}% confidence)<br/>
              <span style="color:#7f7f7f; font-size: 14px;">${p.description}</span>
            </div>
          `).join('')
        }
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Share Symptom Report'
    });
  } catch (error) {
    console.error('Error generating or sharing PDF:', error);
  }
}
