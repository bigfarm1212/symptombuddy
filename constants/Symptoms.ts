export type SymptomCategory = 'Physical' | 'Mental' | 'Digestive' | 'Sleep';

export interface Symptom {
  id: string;
  label: string;
  category: SymptomCategory;
}

export const SYMPTOMS: Symptom[] = [
  // Physical
  { id: 'fatigue', label: 'Fatigue', category: 'Physical' },
  { id: 'headache', label: 'Headache', category: 'Physical' },
  { id: 'muscle_aches', label: 'Muscle aches', category: 'Physical' },
  { id: 'joint_pain', label: 'Joint pain', category: 'Physical' },
  { id: 'dizziness', label: 'Dizziness', category: 'Physical' },
  { id: 'shortness_breath', label: 'Shortness of breath', category: 'Physical' },

  // Mental
  { id: 'anxiety', label: 'Anxiety', category: 'Mental' },
  { id: 'brain_fog', label: 'Brain fog', category: 'Mental' },
  { id: 'low_mood', label: 'Low mood', category: 'Mental' },
  { id: 'irritability', label: 'Irritability', category: 'Mental' },
  { id: 'poor_concentration', label: 'Difficulty concentrating', category: 'Mental' },

  // Digestive
  { id: 'bloating', label: 'Bloating', category: 'Digestive' },
  { id: 'nausea', label: 'Nausea', category: 'Digestive' },
  { id: 'stomach_pain', label: 'Stomach pain', category: 'Digestive' },
  { id: 'constipation', label: 'Constipation', category: 'Digestive' },
  { id: 'diarrhoea', label: 'Diarrhoea', category: 'Digestive' },
  { id: 'reflux', label: 'Reflux', category: 'Digestive' },

  // Sleep
  { id: 'insomnia', label: 'Insomnia', category: 'Sleep' },
  { id: 'woke_early', label: 'Woke early', category: 'Sleep' },
  { id: 'unrefreshed', label: 'Unrefreshed', category: 'Sleep' },
  { id: 'hypersomnia', label: 'Hypersomnia', category: 'Sleep' },
];

export const SYMPTOM_CATEGORIES: SymptomCategory[] = ['Physical', 'Mental', 'Digestive', 'Sleep'];

export const TRIGGERS = [
  { id: 'poor_sleep', label: 'Poor sleep' },
  { id: 'stress', label: 'Stress' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'caffeine', label: 'Caffeine' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'hormones', label: 'Hormones' },
];


export const getSymptomsByCategory = (category: SymptomCategory): Symptom[] =>
  SYMPTOMS.filter((s) => s.category === category);
