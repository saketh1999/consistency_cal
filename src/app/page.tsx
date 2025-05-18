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

// --- React Grid Layout Imports ---
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
// --- End React Grid Layout Imports ---

const ResponsiveGridLayout = WidthProvider(Responsive);

const APP_DATA_KEY = 'consistencyAppData'; // Updated key
const GRID_LAYOUT_KEY = 'consistencyGridLayouts'; // Updated key
const GLOBAL_TODOS_KEY = 'consistencyGlobalTodos'; // New key for global todos

// Define initial layouts for different breakpoints
const initialLayouts: Layouts = {
  lg: [ // 12 columns
    { i: 'calendar', x: 0, y: 0, w: 7, h: 28, minW: 6, minH: 20, static: true },
    { i: 'daily', x: 7, y: 0, w: 5, h: 14, minW: 3, minH: 8, static: false },
    { i: 'global-todo', x: 7, y: 14, w: 5, h: 14, minW: 3, minH: 6, static: false },
    { i: 'google-calendar', x: 0, y: 28, w: 6, h: 14, minW: 3, minH: 6, static: false },
    { i: 'motivation', x: 6, y: 28, w: 6, h: 14, minW: 3, minH: 6, static: false },
  ],
  md: [ // 10 columns
    { i: 'calendar', x: 0, y: 0, w: 6, h: 28, minW: 5, minH: 18, static: true },
    { i: 'daily', x: 6, y: 0, w: 4, h: 14, minW: 3, minH: 7, static: false },
    { i: 'global-todo', x: 6, y: 14, w: 4, h: 14, minW: 3, minH: 6, static: false },
    { i: 'google-calendar', x: 0, y: 28, w: 5, h: 14, minW: 3, minH: 6, static: false },
    { i: 'motivation', x: 5, y: 28, w: 5, h: 14, minW: 3, minH: 5, static: false },
  ],
  sm: [ // 6 columns - Single stacked column
    { i: 'calendar', x: 0, y: 0, w: 6, h: 28, minW: 4, minH: 16, static: true },
    { i: 'daily', x: 0, y: 28, w: 6, h: 14, minW: 3, minH: 7, static: false },
    { i: 'global-todo', x: 0, y: 42, w: 6, h: 14, minW: 3, minH: 6, static: false },
    { i: 'google-calendar', x: 0, y: 56, w: 6, h: 14, minW: 3, minH: 6, static: false },
    { i: 'motivation', x: 0, y: 70, w: 6, h: 14, minW: 3, minH: 5, static: false },
  ],
  xs: [ // 4 columns - Single stacked column
    { i: 'calendar', x: 0, y: 0, w: 4, h: 28, minW: 3, minH: 15, static: true },
    { i: 'daily', x: 0, y: 28, w: 4, h: 14, minW: 3, minH: 6, static: false },
    { i: 'global-todo', x: 0, y: 42, w: 4, h: 14, minW: 3, minH: 6, static: false },
    { i: 'google-calendar', x: 0, y: 56, w: 4, h: 14, minW: 3, minH: 6, static: false },
    { i: 'motivation', x: 0, y: 70, w: 4, h: 14, minW: 3, minH: 5, static: false },
  ],
  xxs: [ // 2 columns - Single stacked column
    { i: 'calendar', x: 0, y: 0, w: 2, h: 28, minW: 2, minH: 15, static: true },
    { i: 'daily', x: 0, y: 28, w: 2, h: 14, minW: 2, minH: 6, static: false },
    { i: 'global-todo', x: 0, y: 42, w: 2, h: 14, minW: 2, minH: 6, static: false },
    { i: 'google-calendar', x: 0, y: 56, w: 2, h: 14, minW: 2, minH: 6, static: false },
    { i: 'motivation', x: 0, y: 70, w: 2, h: 14, minW: 2, minH: 5, static: false },
  ],
};


export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appData, setAppData] = useState<AppData>({});
  const [globalTodos, setGlobalTodos] = useState<TodoItem[]>([]);
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const loadedAppData = loadFromLocalStorage<AppData>(APP_DATA_KEY, {});
    setAppData(loadedAppData);

    // Load global todos from localStorage
    const loadedGlobalTodos = loadFromLocalStorage<TodoItem[]>(GLOBAL_TODOS_KEY, []);
    setGlobalTodos(loadedGlobalTodos);

    const savedLayouts = localStorage.getItem(GRID_LAYOUT_KEY);
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (typeof parsedLayouts === 'object' && parsedLayouts !== null) {
          const breakpoints = Object.keys(initialLayouts);
          const isValidLayoutStructure = breakpoints.every(bp => 
            parsedLayouts.hasOwnProperty(bp) && Array.isArray(parsedLayouts[bp])
          );

          if (isValidLayoutStructure) {
            const reconciledLayouts = {...initialLayouts};
            for (const bp of breakpoints) {
                const initialBpLayout = initialLayouts[bp];
                const savedBpLayout = parsedLayouts[bp] || [];
                const savedItemsMap = new Map(savedBpLayout.map((item: Layout) => [item.i, item]));
                
                reconciledLayouts[bp] = initialBpLayout.map(initialItem => {
                    const savedItem = savedItemsMap.get(initialItem.i);
                    // If initial item is static, force its properties from initialLayouts
                    if (initialItem.static) {
                        return initialItem;
                    }
                    return savedItem ? {...initialItem, ...savedItem} : initialItem;
                });
            }
            setLayouts(reconciledLayouts);
          } else {
            console.warn("Saved layout structure is invalid or incomplete, resetting to default.");
            localStorage.removeItem(GRID_LAYOUT_KEY); 
            setLayouts(initialLayouts); 
          }
        } else {
           localStorage.removeItem(GRID_LAYOUT_KEY); 
           setLayouts(initialLayouts); 
        }
      } catch (e) {
        console.error("Failed to parse saved layouts, resetting to default.", e);
        localStorage.removeItem(GRID_LAYOUT_KEY); 
        setLayouts(initialLayouts); 
      }
    } else {
      setLayouts(initialLayouts);
    }
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

  const onLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    if (isMounted) { 
      if (Object.keys(allLayouts).length > 0 && Object.values(allLayouts).every(arr => arr.length > 0)) {
        // Filter out static items before saving, so their potentially user-modified state isn't saved
        const layoutsToSave: Layouts = {};
        for (const breakpoint in allLayouts) {
          layoutsToSave[breakpoint] = allLayouts[breakpoint].filter(item => {
            const initialItemDef = initialLayouts[breakpoint]?.find(initItem => initItem.i === item.i);
            return !initialItemDef?.static; // Only save if not defined as static in initialLayouts
          });
        }
        // Merge with static items from initialLayouts to ensure they are present for rendering
        const fullLayoutsToSet = {...initialLayouts};
         for (const breakpoint in allLayouts) {
            const savedNonStatic = layoutsToSave[breakpoint] || [];
            const staticItems = initialLayouts[breakpoint]?.filter(item => item.static) || [];
            const combined = [...staticItems];
            savedNonStatic.forEach(snsItem => {
                if (!combined.find(cItem => cItem.i === snsItem.i)) {
                    combined.push(snsItem);
                }
            });
            fullLayoutsToSet[breakpoint] = combined;
        }

        setLayouts(fullLayoutsToSet);
        // Save only the non-static items' layouts
        const nonStaticLayoutsForStorage: Layouts = {};
        Object.keys(allLayouts).forEach(bp => {
            nonStaticLayoutsForStorage[bp] = allLayouts[bp].filter(item => {
                const initialBpLayout = initialLayouts[bp as keyof Layouts];
                const initialItem = initialBpLayout?.find(l => l.i === item.i);
                return !initialItem?.static;
            });
        });
        localStorage.setItem(GRID_LAYOUT_KEY, JSON.stringify(nonStaticLayoutsForStorage));
      }
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          {/* Future: Add UserProfile/Auth button here */}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-2 md:p-3 lg:p-4">
        <ResponsiveGridLayout
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30} 
          compactType="vertical" 
          onLayoutChange={onLayoutChange}
          isDraggable={true} // Default, individual items can override with `static: true`
          isResizable={true} // Default, individual items can override with `static: true`
          className="min-h-full"
          // draggableHandle=".drag-handle" // Optional: If you want specific drag handles
        >
          <div key="calendar" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              appData={appData}
            />
          </div>

          <div key="daily" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            <DailyContentView
              selectedDate={selectedDate}
              data={currentData}
              onDataChange={handleDailyDataChange}
            />
          </div>

          <div key="global-todo" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            <GlobalTodoView
              todos={globalTodos}
              onTodosChange={handleGlobalTodosChange}
            />
          </div>

          {/* <div key="google-calendar" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            <GoogleCalendarView
              selectedDate={selectedDate}
              onSyncEvents={handleSyncGoogleCalendarEvents}
            />
          </div> */}

          <div key="motivation" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            <MotivationalPromptView currentJournalNotes={currentData?.notes} />
          </div>
        </ResponsiveGridLayout>
      </main>

      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ for your journey towards consistency. &copy; {new Date().getFullYear()} Consistency.
          </p>
        </div>
      </footer>
    </div>
  );
}
