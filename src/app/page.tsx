'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, parse } from 'date-fns';
import CalendarView from '@/components/custom/CalendarView';
import DailyContentView from '@/components/custom/DailyContentView';
import MotivationalPromptView from '@/components/custom/MotivationalPromptView';
import GlobalTodoView from '@/components/custom/GlobalTodoView';
import GoogleCalendarView from '@/components/custom/GoogleCalendarView';
import type { AppData, DailyData, TodoItem, GoogleCalendarEvent } from '@/lib/types';
import type { DailyEntry } from '@/lib/supabase';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Move, Maximize, Minimize } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { saveDailyEntry } from '@/lib/services/dailyEntriesService';
import { useToast } from '@/hooks/use-toast';

const APP_DATA_KEY = 'consistencyAppData';
const GLOBAL_TODOS_KEY = 'consistencyGlobalTodos';
const LAYOUT_PREFERENCES_KEY = 'consistencyLayoutPrefs';

// Component size options
type ComponentSize = 'small' | 'medium' | 'large';

// Component position within the layout grid
interface ComponentPosition {
  row: number;
  column: number;
  size: ComponentSize;
}

// Layout preferences for customizable components
interface LayoutPreferences {
  globalTodo: ComponentPosition;
  motivation: ComponentPosition;
}

// Default layout preferences
const defaultLayoutPreferences: LayoutPreferences = {
  globalTodo: {
    row: 1,
    column: 2, // Second column on desktop
    size: 'medium'
  },
  motivation: {
    row: 2,
    column: 1, // Full width on desktop
    size: 'medium'
  }
};

// Map component size to CSS grid classes
const sizeToClasses = {
  small: {
    globalTodo: 'md:col-span-5 lg:col-span-4 md:row-span-1',
    motivation: 'md:col-span-6 lg:col-span-6 md:row-span-1'
  },
  medium: {
    globalTodo: 'md:col-span-5 lg:col-span-5 md:row-span-2',
    motivation: 'md:col-span-12 lg:col-span-12 md:row-span-1'
  },
  large: {
    globalTodo: 'md:col-span-5 lg:col-span-6 md:row-span-3',
    motivation: 'md:col-span-12 lg:col-span-12 md:row-span-2'
  }
};

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appData, setAppData] = useState<AppData>({});
  const [globalTodos, setGlobalTodos] = useState<TodoItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [layoutPrefs, setLayoutPrefs] = useState<LayoutPreferences>(defaultLayoutPreferences);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadedAppData = loadFromLocalStorage<AppData>(APP_DATA_KEY, {});
    setAppData(loadedAppData);

    // Load global todos from localStorage
    const loadedGlobalTodos = loadFromLocalStorage<TodoItem[]>(GLOBAL_TODOS_KEY, []);
    setGlobalTodos(loadedGlobalTodos);
    
    // Load layout preferences
    const savedLayoutPrefs = loadFromLocalStorage<LayoutPreferences>(LAYOUT_PREFERENCES_KEY, defaultLayoutPreferences);
    setLayoutPrefs(savedLayoutPrefs);
    
    setIsMounted(true); 
  }, []);

  // Save layout preferences
  const saveLayoutPreferences = (newPrefs: LayoutPreferences) => {
    setLayoutPrefs(newPrefs);
    saveToLocalStorage(LAYOUT_PREFERENCES_KEY, newPrefs);
  };

  // Handle component size change
  const handleSizeChange = (component: keyof LayoutPreferences, size: ComponentSize) => {
    const newPrefs = {
      ...layoutPrefs,
      [component]: {
        ...layoutPrefs[component],
        size
      }
    };
    saveLayoutPreferences(newPrefs);
  };

  // Handle component order change
  const handleMoveComponent = (component: keyof LayoutPreferences, direction: 'up' | 'down') => {
    const currentRow = layoutPrefs[component].row;
    const newRow = direction === 'up' ? Math.max(1, currentRow - 1) : currentRow + 1;
    
    // Update rows for all components to maintain unique row values
    const newPrefs = { ...layoutPrefs };
    newPrefs[component] = { ...newPrefs[component], row: newRow };
    
    // If another component has the same row, swap their positions
    Object.keys(newPrefs).forEach(key => {
      const compKey = key as keyof LayoutPreferences;
      if (compKey !== component && newPrefs[compKey].row === newRow) {
        newPrefs[compKey] = { ...newPrefs[compKey], row: currentRow };
      }
    });
    
    saveLayoutPreferences(newPrefs);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleDailyDataChange = useCallback((dateKey: string, newDailyData: DailyData) => {
    console.log('Updating appData for date (HomePage):', dateKey, newDailyData);
    setAppData(prevAppData => {
        const updatedAppData = { ...prevAppData, [dateKey]: newDailyData };
        saveToLocalStorage(APP_DATA_KEY, updatedAppData); // Save to localStorage
        return updatedAppData;
    });
  }, [setAppData]);

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
    
    // Show toast notification using the hook
    if (calendarEvents.length > 0) {
      toast({
        title: "Google Calendar Sync",
        description: `Successfully imported ${calendarEvents.length} events for ${format(date, 'MMMM d')}`,
      });
    }
  };

  const currentData = selectedDate ? appData[format(selectedDate, 'yyyy-MM-dd')] : undefined;
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Sort components by row
  const sortedComponents = () => {
    return Object.entries(layoutPrefs)
      .sort(([, a], [, b]) => a.row - b.row)
      .map(([key]) => key as keyof LayoutPreferences);
  };

  const handleSetFeaturedImage = useCallback(async (dateKey: string, newFeaturedUrl: string | undefined) => {
    let finalPayloadForDB: Partial<DailyEntry> | null = null;
    let dateObjectForDB: Date | null = null;

    setAppData(prevAppData => {
      const updatedAppData = { ...prevAppData };
      // Ensure entry exists or create a basic one for appData
      const dayData = updatedAppData[dateKey] ? { ...updatedAppData[dateKey] } : 
        { notes: '', imageUrls: [], videoUrls: [], todos: [], importantEvents: '', googleCalendarEvents: [] };

      dayData.featuredImageUrl = newFeaturedUrl;

      // If setting a new featured image, ensure it's in the imageUrls array
      if (newFeaturedUrl && !(dayData.imageUrls || []).includes(newFeaturedUrl)) {
        dayData.imageUrls = [...(dayData.imageUrls || []), newFeaturedUrl];
      }
      
      updatedAppData[dateKey] = dayData;

      // Prepare payload for DB
      dateObjectForDB = parse(dateKey, 'yyyy-MM-dd', new Date());
      finalPayloadForDB = { // Assuming DailyEntry structure from services
          notes: dayData.notes,
          video_urls: dayData.videoUrls || [],
          important_events: dayData.importantEvents || null,
          featured_image_url: dayData.featuredImageUrl || null,
          // todos and googleCalendarEvents are typically handled by their own services/tables
      };
      return updatedAppData;
    });

    if (user && user.id && finalPayloadForDB && dateObjectForDB) {
      try {
        await saveDailyEntry(dateObjectForDB, user.id, finalPayloadForDB);
        toast({ title: "Featured Image Updated", description: "Change saved to database." });
      } catch (error) {
        console.error("Error saving featured image update to DB:", error);
        toast({ title: "Database Error", description: "Could not save featured image change.", variant: "destructive" });
      }
    } else if (finalPayloadForDB) { // If payload exists but user doesn't, it's a local-only change
        toast({ title: "Featured Image Updated (Locally)", description: "Sign in to save changes to the cloud."});
    }
  }, [setAppData, user, toast]);

  const handleDeleteImageFromCalendar = useCallback(async (dateKey: string, imageUrlToRemove: string) => {
    let finalPayloadForDB: Partial<DailyEntry> | null = null;
    let dateObjectForDB: Date | null = null;

    setAppData(prevAppData => {
      const updatedAppData = { ...prevAppData };
      if (!updatedAppData[dateKey]) {
        // This case should ideally not happen if we are deleting an image that was displayed
        console.warn("Attempting to delete image for a dateKey that doesn't exist in appData:", dateKey);
        return prevAppData; 
      }

      const dayData = { ...updatedAppData[dateKey] };
      dayData.imageUrls = dayData.imageUrls?.filter(url => url !== imageUrlToRemove) || [];

      if (dayData.featuredImageUrl === imageUrlToRemove) {
        dayData.featuredImageUrl = dayData.imageUrls.length > 0 ? dayData.imageUrls[0] : undefined;
      }
      updatedAppData[dateKey] = dayData;

      // Prepare for DB
      dateObjectForDB = parse(dateKey, 'yyyy-MM-dd', new Date());
      finalPayloadForDB = { // Assuming DailyEntry structure from services
          notes: dayData.notes,
          video_urls: dayData.videoUrls || [],
          important_events: dayData.importantEvents || null,
          featured_image_url: dayData.featuredImageUrl || null,
      };
      return updatedAppData;
    });
    
    if (user && user.id && finalPayloadForDB && dateObjectForDB) {
      try {
        await saveDailyEntry(dateObjectForDB, user.id, finalPayloadForDB);
        toast({ title: "Image Deleted", description: "Change saved to database." });
      } catch (error) {
        console.error("Error saving image deletion to DB:", error);
        toast({ title: "Database Error", description: "Could not save image deletion.", variant: "destructive" });
      }
    } else if (finalPayloadForDB) { // If payload exists but user doesn't, it's a local-only change
        toast({ title: "Image Deleted (Locally)", description: "Sign in to save changes to the cloud."});
    }
  }, [setAppData, user, toast]);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Logo />
        <p className="mt-4 text-lg">Loading Your Personalized Workspace...</p>
      </div>
    );
  }

  // Component size controls
  const SizeControls = ({ component }: { component: keyof LayoutPreferences }) => {
    if (!isEditMode) return null;
    
    return (
      <div className="absolute top-0 right-0 p-1 flex gap-1 bg-card/80 rounded-bl-md z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => handleSizeChange(component, 'small')}
          title="Small size"
        >
          <Minimize className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => handleSizeChange(component, 'medium')}
          title="Medium size"
        >
          <div className="h-3 w-3 border border-current"></div>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => handleSizeChange(component, 'large')}
          title="Large size"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Component order controls
  const OrderControls = ({ component }: { component: keyof LayoutPreferences }) => {
    if (!isEditMode) return null;
    
    return (
      <div className="absolute top-0 left-0 p-1 flex gap-1 bg-card/80 rounded-br-md z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => handleMoveComponent(component, 'up')}
          title="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => handleMoveComponent(component, 'down')}
          title="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 cursor-move"
          title="Drag to rearrange"
          disabled={true}
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <main className="container mx-auto p-2 md:p-3 lg:p-4">
      <div className="flex justify-end mb-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={toggleEditMode}
          className="text-xs"
        >
          {isEditMode ? 'Done Customizing' : 'Customize Layout'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[calc(100vh-10rem)]">
        {/* Calendar (fixed position) */}
        <div className="md:col-span-7 lg:col-span-7 md:row-span-2 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <CalendarView
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            appData={appData}
            onSetFeaturedImage={handleSetFeaturedImage}
            onDeleteImage={handleDeleteImageFromCalendar}
          />
        </div>
        
        {/* Daily Content (fixed position) */}
        <div className="md:col-span-5 lg:col-span-5 bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
          <DailyContentView
            selectedDate={selectedDate}
            data={currentData}
            onDataChange={handleDailyDataChange}
          />
        </div>
        
        {/* Global Todo (customizable) */}
        <div className={`relative ${sizeToClasses[layoutPrefs.globalTodo.size].globalTodo} bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden`} 
             style={{ order: layoutPrefs.globalTodo.row }}>
          <SizeControls component="globalTodo" />
          <OrderControls component="globalTodo" />
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
        
        {/* Motivational Prompt (customizable) */}
        <div className={`relative ${sizeToClasses[layoutPrefs.motivation.size].motivation} bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden`}
             style={{ order: layoutPrefs.motivation.row }}>
          <SizeControls component="motivation" />
          <OrderControls component="motivation" />
          <MotivationalPromptView currentJournalNotes={currentData?.notes} />
        </div>
      </div>
    </main>
  );
}
