
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
// IMPORTANT: Ensure these paths are correct after installing react-grid-layout.
// These imports might need to be adjusted based on your project structure or bundler.
// If using Next.js App Router and CSS isn't picked up here, consider importing in globals.css or layout.tsx
// However, for component-specific CSS, direct import is often preferred.
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
  lg: [ // 12 columns
    { i: 'calendar', x: 0, y: 0, w: 8, h: 12, minW: 6, minH: 8 },
    { i: 'daily', x: 8, y: 0, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 8, y: 7, w: 4, h: 5, minW: 3, minH: 4 },
  ],
  md: [ // 10 columns
    { i: 'calendar', x: 0, y: 0, w: 6, h: 12, minW: 5, minH: 8 },
    { i: 'daily', x: 6, y: 0, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 6, y: 7, w: 4, h: 5, minW: 3, minH: 4 },
  ],
  sm: [ // 6 columns
    { i: 'calendar', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'daily', x: 0, y: 8, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 0, y: 15, w: 6, h: 5, minW: 3, minH: 4 },
  ],
  xs: [ // 4 columns
    { i: 'calendar', x: 0, y: 0, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'daily', x: 0, y: 7, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'motivation', x: 0, y: 14, w: 4, h: 5, minW: 3, minH: 4 },
  ],
  xxs: [ // 2 columns
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
        // Basic validation: ensure it's an object (Layouts)
        if (typeof parsedLayouts === 'object' && parsedLayouts !== null) {
          setLayouts(parsedLayouts);
        } else {
           localStorage.removeItem(GRID_LAYOUT_KEY); // Clear invalid data
        }
      } catch (e) {
        console.error("Failed to parse saved layouts, resetting to default.", e);
        localStorage.removeItem(GRID_LAYOUT_KEY); // Clear invalid data
      }
    }
    setIsMounted(true); // Indicate that component has mounted and localStorage has been checked
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
    // Only save layouts after the component has mounted and initial layouts are set
    if (isMounted) {
      setLayouts(allLayouts);
      localStorage.setItem(GRID_LAYOUT_KEY, JSON.stringify(allLayouts));
    }
  };

  const currentData = selectedDate ? appData[format(selectedDate, 'yyyy-MM-dd')] : undefined;

  // Prevent rendering RGL on server or before layouts are loaded from localStorage to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Logo />
        <p className="mt-4 text-lg">Loading Your Personalized Workspace...</p>
        {/* You could add a spinner here */}
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

      {/* The main content area will now be managed by React Grid Layout */}
      {/* Add some padding to the main container to prevent RGL items from touching edges */}
      <main className="flex-1 container mx-auto p-2 md:p-3 lg:p-4">
        <ResponsiveGridLayout
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30} // Adjust this value to control the height of one grid unit
          compactType="vertical" // Or "horizontal", or null
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          // To make items draggable only by a handle, add a class like "drag-handle"
          // to an element within each grid item (e.g., the CardHeader) and set:
          // draggableHandle=".drag-handle"
          // For now, the whole item is draggable.
          className="min-h-full" // Ensure the grid layout takes up available space
        >
          <div key="calendar" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            {/* The CalendarView component should be flexible enough to fill this div */}
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              appData={appData}
            />
          </div>

          <div key="daily" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            {/* The DailyContentView should be flexible */}
            <DailyContentView
              selectedDate={selectedDate}
              data={currentData}
              onDataChange={handleDailyDataChange}
            />
          </div>

          <div key="motivation" className="bg-card text-card-foreground rounded-lg shadow-md flex flex-col overflow-hidden">
            {/* The MotivationalPromptView should be flexible */}
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
