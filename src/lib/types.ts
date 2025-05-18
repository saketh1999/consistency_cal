
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyData {
  notes?: string;
  imageUrls?: string[]; // Changed from imageUrl: string to imageUrls: string[]
  videoUrls?: string[];
  todos?: TodoItem[];
  importantEvents?: string;
}

export interface AppData {
  [dateKey: string]: DailyData;
}

export interface FitnessGoals {
  goals?: string;
}
