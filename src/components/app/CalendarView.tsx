'use client';

import type { FC } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppData } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  appData: AppData;
}

const CalendarView: FC<CalendarViewProps> = ({ selectedDate, onDateChange, appData }) => {
  const markedDays = Object.keys(appData)
    .filter(dateKey => {
      const data = appData[dateKey];
      return data && (data.notes || data.imageUrl || data.videoUrl);
    })
    .map(dateKey => parseISO(dateKey));
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">My FitPlan</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          className="rounded-md border"
          modifiers={{
            marked: markedDays,
          }}
          modifiersStyles={{
            marked: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: 'hsl(var(--accent))',
              textDecorationThickness: '2px',
            }
          }}
          disabled={(date) => date > new Date()} // Optional: Disable future dates
        />
      </CardContent>
    </Card>
  );
};

export default CalendarView;
