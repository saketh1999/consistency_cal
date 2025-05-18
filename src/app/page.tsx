'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import CalendarView from '@/components/custom/CalendarView';
import DailyContentView from '@/components/custom/DailyContentView';
import MotivationalPromptView from '@/components/custom/MotivationalPromptView';
import GlobalTodoView from '@/components/custom/GlobalTodoView';
import GoogleCalendarView from '@/components/custom/GoogleCalendarView';
import type { AppData, DailyData, TodoItem, GoogleCalendarEvent } from '@/lib/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';
import { Logo } from '@/components/icons/Logo';

const APP_DATA_KEY = 'consistencyAppData';
const GLOBAL_TODOS_KEY = 'consistencyGlobalTodos';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appData, setAppData] = useState<AppData>({});
  const [globalTodos, setGlobalTodos] = useState<TodoItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const loadedAppData = loadFromLocalStorage<AppData>(APP_DATA_KEY, {});
    setAppData(loadedAppData);

    // Load global todos from localStorage
    const loadedGlobalTodos = loadFromLocalStorage<TodoItem[]>(GLOBAL_TODOS_KEY, []);
    setGlobalTodos(loadedGlobalTodos);
    
    setIsMounted(true); 
  }, []);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleDailyDataChange = (dateKey: string, newDailyData: DailyData) => {
    const updatedAppData = { ...appData, [dateKey]: newDailyData };
    setAppData(updatedAppData);
    saveToLocalStorage(APP_DATA_KEY, updatedAppData);
  };

  const handleGlobalTodosChange = (newGlobalTodos: TodoItem[]) => {
    setGlobalTodos(newGlobalTodos);
    saveToLocalStorage(GLOBAL_TODOS_KEY, newGlobalTodos);
  };

  const handleSyncGoogleCalendarEvents = (date: Date, calendarEvents: any[]) => {
    if (!date) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const currentData = appData[dateKey] || {};
    
    // Map Google Calendar events to our format
    const googleCalendarEvents: GoogleCalendarEvent[] = calendarEvents.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      startDateTime: event.start.dateTime,
      endDateTime: event.end.dateTime,
      colorId: event.colorId,
      location: event.location
    }));
    
    // Merge with existing data
    const updatedDailyData: DailyData = {
      ...currentData,
      googleCalendarEvents
    };
    
    // Update app data
    handleDailyDataChange(dateKey, updatedDailyData);
    
    // Show toast notification
    if (calendarEvents.length > 0) {
      toast({
        title: "Google Calendar Sync",
        description: `Successfully imported ${calendarEvents.length} events for ${format(date, 'MMMM d')}`,
      });
    }
  };

  const currentData = selectedDate ? appData[format(selectedDate, 'yyyy-MM-dd')] : undefined;
  
  // Add toast notification functionality
  const toast = ({ title, description }: { title: string; description: string }) => {
    console.log(`${title}: ${description}`);
    // In a real app, we would use a toast notification library
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Logo />
        <p className="mt-4 text-lg">Loading Your Personalized Workspace...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-2 md:p-3 lg:p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[calc(100vh-10rem)]">
        {/* Calendar (spans left half on desktop, full width on mobile) */}
        <div className="md:col-span-7 lg:col-span-7 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <CalendarView
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            appData={appData}
          />
        </div>
        
        {/* Daily Content (spans right top on desktop, below calendar on mobile) */}
        <div className="md:col-span-5 lg:col-span-5 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <DailyContentView
            selectedDate={selectedDate}
            data={currentData}
            onDataChange={handleDailyDataChange}
          />
        </div>
        
        {/* Global Todo (spans right bottom on desktop, below daily content on mobile) */}
        <div className="md:col-span-5 lg:col-span-5 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <GlobalTodoView
            todos={globalTodos}
            onTodosChange={handleGlobalTodosChange}
          />
        </div>
        
        {/* Google Calendar - commented out for now
        <div className="md:col-span-6 lg:col-span-6 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <GoogleCalendarView
            selectedDate={selectedDate}
            onSyncEvents={handleSyncGoogleCalendarEvents}
          />
        </div> */}
        
        {/* Motivational Prompt (full width at bottom) */}
        <div className="md:col-span-12 lg:col-span-12 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <MotivationalPromptView currentJournalNotes={currentData?.notes} />
        </div>
      </div>
    </main>
  );
}
