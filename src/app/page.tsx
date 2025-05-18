'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import CalendarView from '@/components/app/CalendarView';
import DailyContentView from '@/components/app/DailyContentView';
import MotivationalPromptView from '@/components/app/MotivationalPromptView';
import type { AppData, DailyData } from '@/lib/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';
import { Logo } from '@/components/icons/Logo';
import { Separator } from '@/components/ui/separator';

const APP_DATA_KEY = 'fitPlanCanvasData';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appData, setAppData] = useState<AppData>({});

  useEffect(() => {
    const loadedData = loadFromLocalStorage<AppData>(APP_DATA_KEY, {});
    setAppData(loadedData);
  }, []);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleDailyDataChange = (dateKey: string, newDailyData: DailyData) => {
    const updatedAppData = { ...appData, [dateKey]: newDailyData };
    setAppData(updatedAppData);
    saveToLocalStorage(APP_DATA_KEY, updatedAppData);
  };

  const currentData = selectedDate ? appData[format(selectedDate, 'yyyy-MM-dd')] : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          {/* Future: Add UserProfile/Auth button here */}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column: Calendar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              appData={appData}
            />
          </div>

          {/* Middle Column: Daily Content */}
          <div className="lg:col-span-1 flex flex-col gap-6 min-h-[600px] lg:min-h-0">
             <DailyContentView
              selectedDate={selectedDate}
              data={currentData}
              onDataChange={handleDailyDataChange}
            />
          </div>
          
          {/* Right Column: Motivational Prompt */}
          <div className="lg:col-span-1 flex flex-col gap-6 min-h-[600px] lg:min-h-0">
            <MotivationalPromptView currentJournalNotes={currentData?.notes} />
          </div>
        </div>
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
