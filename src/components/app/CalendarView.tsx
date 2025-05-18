
'use client';

import type { FC } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarProps as DayPickerCalendarProps } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { NotebookTextIcon, ImageIcon, VideoIcon } from 'lucide-react';

interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  appData: AppData;
}

// Define props for our custom day content renderer
// Includes props from DayPicker's DayContent component (date, displayMonth)
// plus custom props (appData, selectedDateUI)
interface MyCustomDayContentProps {
  date: Date;
  displayMonth: Date; 
  appData: AppData;
  selectedDateUI: Date | undefined;
}

const MyCustomDayContent: FC<MyCustomDayContentProps> = ({ date, displayMonth, appData, selectedDateUI }) => {
  const isOutsideDay = date.getMonth() !== displayMonth.getMonth();

  if (isOutsideDay) {
    return (
      <div className="flex h-full w-full items-center justify-end p-1.5">
        <span className="text-muted-foreground/30 text-sm font-medium">{format(date, 'd')}</span>
      </div>
    );
  }

  const dateKey = format(date, 'yyyy-MM-dd');
  const dayData = appData[dateKey];
  const isSelected = selectedDateUI && format(selectedDateUI, 'yyyy-MM-dd') === dateKey;
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full items-start p-1.5 text-xs justify-between rounded-sm",
        isSelected && "bg-primary/20 ring-2 ring-primary",
        isToday && !isSelected && "bg-accent/10"
      )}
    >
      {/* Top part: Day number and icons */}
      <div>
        <div className={cn(
            "self-end font-semibold text-sm mb-1",
            isSelected && "text-primary",
            isToday && !isSelected && "text-accent"
          )}
        >
          {format(date, 'd')}
        </div>
        {dayData && (
          <div className="flex flex-wrap gap-1.5">
            {dayData.notes && <NotebookTextIcon className="h-3.5 w-3.5 text-primary/70" title="Notes" />}
            {dayData.imageUrl && <ImageIcon className="h-3.5 w-3.5 text-primary/70" title="Image" />}
            {dayData.videoUrl && <VideoIcon className="h-3.5 w-3.5 text-primary/70" title="Video" />}
          </div>
        )}
      </div>

      {/* Bottom part: Notes snippet */}
      {dayData?.notes && (
         <p className="text-[10px] w-full text-left text-muted-foreground/90 truncate overflow-hidden self-end">
           {dayData.notes}
         </p>
      )}
    </div>
  );
};


const CalendarView: FC<CalendarViewProps> = ({ selectedDate, onDateChange, appData }) => {
  // markedDays might not be strictly necessary if CustomDayContent provides enough visual cues.
  // Kept for potential future use or if a simpler marking style is desired alongside custom content.
  const markedDays = Object.keys(appData)
    .filter(dateKey => {
        const data = appData[dateKey];
        return data && (data.notes || data.imageUrl || data.videoUrl);
    })
    .map(dateKey => parseISO(dateKey));
  
  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">My FitPlan Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          className="rounded-md border-0 w-full" 
          disabled={(date) => date > new Date()} // Optional: Disable future dates
          components={{
            DayContent: (dayProps: React.ComponentProps<typeof Calendar>['components']['DayContent'] extends ((props: infer P) => any) ? P : never) => (
              <MyCustomDayContent
                date={dayProps.date}
                displayMonth={dayProps.displayMonth}
                appData={appData}
                selectedDateUI={selectedDate}
              />
            ),
          }}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-2 w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-lg font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-8 w-8 bg-transparent p-0 opacity-75 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex w-full mb-1",
            head_cell: "text-muted-foreground rounded-md w-[14.2857%] font-normal text-xs md:text-sm justify-center flex p-1",
            row: "flex w-full mt-0",
            cell: cn(
              "h-28 md:h-32 lg:h-40 w-[14.2857%] text-center text-sm p-0.5 relative", 
              "border border-border/30",
            ),
            day: cn( 
              "h-full w-full p-0 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              "aria-selected:bg-transparent aria-selected:text-foreground", 
            ),
            day_selected: "", 
            day_today: "", 
            day_outside: "text-muted-foreground/30", // Minimal style as MyCustomDayContent handles outside day rendering
            day_disabled: "text-muted-foreground/50 opacity-50",
            // modifiersStyles.marked is not used as MyCustomDayContent provides richer visuals
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarView;
