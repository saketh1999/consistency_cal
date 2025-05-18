export interface DailyData {
  notes?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface AppData {
  [dateKey: string]: DailyData;
}

export interface FitnessGoals {
  goals?: string;
}
