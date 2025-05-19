export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  colorId?: string;
  location?: string;
}

export interface DailyData {
  notes?: string;
  imageUrls?: string[]; // Changed from imageUrl: string to imageUrls: string[]
  featuredImageUrl?: string; // Added to mark a specific image as featured for calendar display
  videoUrls?: string[];
  todos?: TodoItem[];
  importantEvents?: string;
  googleCalendarEvents?: GoogleCalendarEvent[]; // Added for Google Calendar integration
}

export interface AppData {
  [dateKey: string]: DailyData;
  globalTodos?: TodoItem[]; // Add global todos that are shared across all dates
}

export interface FitnessGoals {
  goals?: string;
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  imageUrl?: string;
  dateAdded: string;
}
