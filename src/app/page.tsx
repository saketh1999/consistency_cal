
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import CalendarView from '@/components/app/CalendarView';
import DailyContentView from '@/components/app/DailyContentView';
import MotivationalPromptView from '@/components/app/MotivationalPromptView';
import type { AppData, DailyData } from '@/lib/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';
import { Logo } from '@/components/icons/Logo';

// --- React Grid Layout Imports ---
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
// --- End React Grid Layout Imports ---

const ResponsiveGridLayout = WidthProvider(Responsive);

const APP_DATA_KEY = 'fitPlanCanvasData';
const GRID_LAYOUT_KEY = 'fitPlanCanvasGridLayouts';

// Define initial layouts for different breakpoints
const initialLayouts: Layouts = {
  lg: [ // 12 columns - Two equal columns
    { i: 'calendar', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: 'daily', x: 6, y: 0, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'motivation', x: 6, y: 7, w: 6, h: 5, minW: 4, minH: 4 },
  ],
  md: [ // 10 columns - Two equal columns
    { i: 'calendar', x: 0, y: 0, w: 5, h: 12, minW: 4, minH: 8 },
    { i: 'daily', x: 5, y: 0, w: 5, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 5, y: 7, w: 5, h: 5, minW: 3, minH: 4 },
  ],
  sm: [ // 6 columns - Single stacked column
    { i: 'calendar', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'daily', x: 0, y: 8, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 0, y: 15, w: 6, h: 5, minW: 3, minH: 4 },
  ],
  xs: [ // 4 columns - Single stacked column
    { i: 'calendar', x: 0, y: 0, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'daily', x: 0, y: 7, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 0, y: 14, w: 4, h: 5, minW: 3, minH: 4 },
  ],
  xxs: [ // 2 columns - Single stacked column
    { i: 'calendar', x: 0, y: 0, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'daily', x: 0, y: 7, w: 2, h: 7, minW: 2, minH: 5 },
    { i: 'motivation', x: 0, y: 14, w: 2, h: 5, minW: 2, minH: 4 },
  ],
};


export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appData, setAppData] = useState<AppData>({});
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const loadedAppData = loadFromLocalStorage<AppData>(APP_DATA_KEY, {});
    setAppData(loadedAppData);

    const savedLayouts = localStorage.getItem(GRID_LAYOUT_KEY);
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (typeof parsedLayouts === 'object' && parsedLayouts !== null) {
          // Basic validation: ensure parsedLayouts has keys that match initialLayouts (lg, md, etc.)
          // and that each key points to an array. This is a simple check.
          const breakpoints = Object.keys(initialLayouts);
          const isValidLayoutStructure = breakpoints.every(bp => 
            parsedLayouts.hasOwnProperty(bp) && Array.isArray(parsedLayouts[bp])
          );

          if (isValidLayoutStructure) {
            setLayouts(parsedLayouts);
          } else {
            console.warn("Saved layout structure is invalid, resetting to default.");
            localStorage.removeItem(GRID_LAYOUT_KEY); // Clear invalid data
            setLayouts(initialLayouts); // Explicitly set to default
          }
        } else {
           localStorage.removeItem(GRID_LAYOUT_KEY); // Clear invalid data
           setLayouts(initialLayouts); // Explicitly set to default
        }
      } catch (e) {
        console.error("Failed to parse saved layouts, resetting to default.", e);
        localStorage.removeItem(GRID_LAYOUT_KEY); // Clear invalid data
        setLayouts(initialLayouts); // Explicitly set to default
      }
    } else {
      // If no saved layouts, ensure initialLayouts is set
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

  const onLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    if (isMounted) {
      setLayouts(allLayouts);
      localStorage.setItem(GRID_LAYOUT_KEY, JSON.stringify(allLayouts));
    }
  };

  const currentData = selectedDate ? appData[format(selectedDate, 'yyyy-MM-dd')] : undefined;

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
          isDraggable={true}
          isResizable={true}
          className="min-h-full"
          // To prevent content selection issues while dragging
          // onTouchStart={(e) => e.stopPropagation()}
          // onMouseDown={(e) => e.stopPropagation()}
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

          <div key="motivation" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            <MotivationalPromptView currentJournalNotes={currentData?.notes} />
          </div>
        </ResponsiveGridLayout>
      </main>

      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ for your fitness journey. &copy; {new Date().getFullYear()} FitPlan Canvas.
          </p>
        </div>
      </footer>
    </div>
  );
}
