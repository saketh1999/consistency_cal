
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyData {
  notes?: string;
  imageUrl?: string; // Will now store data URI for uploads
  videoUrls?: string[]; // Changed from videoUrl: string to videoUrls: string[]
  todos?: TodoItem[];
  importantEvents?: string;
}

export interface AppData {
  [dateKey: string]: DailyData;
}

export interface FitnessGoals {
  goals?: string;
}
