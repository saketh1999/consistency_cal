
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarProps as DayPickerCalendarProps } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { NotebookTextIcon, VideoIcon, ListChecksIcon, AlertTriangleIcon } from 'lucide-react';

interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  appData: AppData;
}

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
        <span className="text-muted-foreground/50 text-sm font-medium">{format(date, 'd')}</span>
      </div>
    );
  }

  const dateKey = format(date, 'yyyy-MM-dd');
  const dayData = appData[dateKey];
  const isSelected = selectedDateUI && format(selectedDateUI, 'yyyy-MM-dd') === dateKey;
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
  const hasTodos = dayData?.todos && dayData.todos.length > 0;
  const hasIncompleteTodos = dayData?.todos?.some(todo => !todo.completed);
  const hasVideos = dayData?.videoUrls && dayData.videoUrls.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full items-start p-1.5 text-xs justify-between rounded-sm transition-colors duration-150",
        isSelected && "bg-primary text-primary-foreground",
        isToday && !isSelected && "ring-2 ring-accent",
        !isSelected && !isToday && "hover:bg-muted/10"
      )}
    >
      {/* Top part: Day number */}
      <div className={cn(
          "self-end font-semibold text-sm mb-0.5", 
          isSelected && "text-primary-foreground",
          isToday && !isSelected && "text-accent"
        )}
      >
        {format(date, 'd')}
      </div>

      {/* Middle part: Image */}
      {dayData?.imageUrl && (
        <div className="relative w-full h-16 md:h-20 lg:h-24 my-0.5 overflow-hidden rounded shadow-sm border border-border/50">
          <Image
            src={dayData.imageUrl} 
            alt={`Content for ${format(date, 'yyyy-MM-dd')}`}
            layout="fill"
            objectFit="cover"
            className="rounded"
            data-ai-hint="diary event"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target) {
                target.src = `https://placehold.co/150x100.png?text=Error`;
                target.alt = 'Error loading image';
              }
            }}
          />
        </div>
      )}
      {!dayData?.imageUrl && (
         <div className="relative w-full h-16 md:h-20 lg:h-24 my-0.5 overflow-hidden rounded flex items-center justify-center bg-muted/20">
            <span className="text-muted-foreground/50 text-[10px]">No image</span>
         </div>
      )}

      {/* Bottom part: Icons and Notes snippet */}
      <div className="w-full mt-auto pt-0.5">
        <div className="flex items-center justify-start flex-wrap gap-1.5 mb-0.5">
            {dayData?.notes && <NotebookTextIcon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground/70" : "text-primary/70")} title="Notes" />}
            {hasVideos && <VideoIcon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground/70" : "text-primary/70")} title="Video" />}
            {hasTodos && <ListChecksIcon className={cn("h-3.5 w-3.5", hasIncompleteTodos ? "text-orange-400" : "text-green-400", isSelected && (hasIncompleteTodos ? "text-orange-300" : "text-green-300"))} title="To-Do List" />}
            {dayData?.importantEvents && <AlertTriangleIcon className={cn("h-3.5 w-3.5", isSelected ? "text-red-400" : "text-red-500")} title="Important Event" />}
        </div>
        {dayData?.notes && (
           <p className={cn("text-[10px] w-full text-left overflow-hidden self-end truncate", isSelected ? "text-primary-foreground/80" : "text-muted-foreground/90")}>
             {dayData.notes}
           </p>
        )}
      </div>
    </div>
  );
};


const CalendarView: FC<CalendarViewProps> = ({ selectedDate, onDateChange, appData }) => {
  return (
    <Card className="shadow-lg w-full bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">My daily calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          className="rounded-md border-0 w-full"
          disabled={(date) => date > new Date() || date < new Date(new Date().setFullYear(new Date().getFullYear() - 5))} 
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
            caption: "flex justify-center pt-1 relative items-center text-card-foreground",
            caption_label: "text-lg font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-8 w-8 bg-transparent p-0 opacity-75 hover:opacity-100 border-primary text-primary hover:bg-primary/10"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex w-full mb-1",
            head_cell: "text-muted-foreground rounded-md w-[14.2857%] font-normal text-xs md:text-sm justify-center flex p-1",
            row: "flex w-full mt-0",
            cell: cn(
              "h-36 md:h-44 lg:h-52 w-[14.2857%] text-center text-sm p-0.5 relative", 
              "border border-border/50", 
            ),
            day: cn(
              "h-full w-full p-0 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              // "aria-selected:bg-primary aria-selected:text-primary-foreground" // Handled by MyCustomDayContent
            ),
            day_selected: "", // Custom styling is now in MyCustomDayContent
            day_today: "", // Custom styling is now in MyCustomDayContent
            day_outside: "text-muted-foreground/30 opacity-70", // Make outside days more distinct
            day_disabled: "text-muted-foreground/50 opacity-50",
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarView;
