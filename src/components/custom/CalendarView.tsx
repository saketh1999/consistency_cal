'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { AppData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { NotebookTextIcon, VideoIcon, ListChecksIcon, AlertTriangleIcon, ImageIcon, StarIcon, XCircleIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  appData: AppData;
  onSetFeaturedImage: (dateKey: string, imageUrl: string | undefined) => void;
  onDeleteImage: (dateKey: string, imageUrl: string) => void;
}

interface MyCustomDayContentProps {
  date: Date;
  displayMonth: Date;
  appData: AppData;
  selectedDateUI: Date | undefined;
  onSetFeaturedImage: (dateKey: string, imageUrl: string | undefined) => void;
  onDeleteImage: (dateKey: string, imageUrl: string) => void;
}

const MyCustomDayContent: FC<MyCustomDayContentProps> = ({ date, displayMonth, appData, selectedDateUI, onSetFeaturedImage, onDeleteImage }) => {
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
  const hasImages = dayData?.imageUrls && dayData.imageUrls.length > 0;
  const hasFeaturedImage = dayData?.featuredImageUrl && dayData.featuredImageUrl.length > 0;
  
  // Select the image to display in calendar - prefer featured image if available
  const displayImageUrl = hasFeaturedImage 
    ? dayData!.featuredImageUrl 
    : (hasImages ? dayData!.imageUrls![0] : undefined);

  const allImageUrls = dayData?.imageUrls || [];
  const isCurrentlyFeatured = displayImageUrl === dayData?.featuredImageUrl;

  const handleSetFeatured = () => {
    if (!displayImageUrl) return;

    if (isCurrentlyFeatured) {
      // If current is featured, and other images exist, make the next one featured
      const currentIndex = allImageUrls.findIndex(url => url === displayImageUrl);
      if (allImageUrls.length > 1) {
        const nextIndex = (currentIndex + 1) % allImageUrls.length;
        onSetFeaturedImage(dateKey, allImageUrls[nextIndex]);
      } else {
        // Only one image, and it's featured. Unset it.
         onSetFeaturedImage(dateKey, undefined);
      }
    } else {
      // If current is not featured, make it featured
      onSetFeaturedImage(dateKey, displayImageUrl);
    }
  };

  const handleDeleteImage = () => {
    if (displayImageUrl) {
      onDeleteImage(dateKey, displayImageUrl);
    }
  };

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
      {displayImageUrl ? (
        <div className="relative w-full h-16 sm:h-18 md:h-20 lg:h-24 my-0.5 overflow-hidden rounded shadow-sm border border-border/50 group">
          <Image
            src={displayImageUrl} 
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
          
          {/* Featured image indicator */}
          {hasFeaturedImage && (
            <div className="absolute top-1 right-1 bg-yellow-500/80 text-black text-[10px] px-1 py-0.5 rounded-sm flex items-center">
              <StarIcon className="w-2 h-2 mr-0.5" />
            </div>
          )}
          
          {/* Multiple images indicator */}
          {dayData!.imageUrls! && dayData!.imageUrls!.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-sm flex items-center">
              <ImageIcon size={10} className="mr-0.5" /> +{dayData!.imageUrls!.length - 1}
            </div>
          )}
          
          {/* Image management icons - shown on hover of the image container */}
          {displayImageUrl && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); handleSetFeatured(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleSetFeatured(); } }}
                title={isCurrentlyFeatured ? (allImageUrls.length > 1 ? "Cycle Featured" : "Unset Featured") : "Set as Featured"}
                className="p-1.5 bg-black/70 rounded-full text-white hover:bg-yellow-500 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
                aria-disabled={allImageUrls.length === 0}
              >
                <StarIcon className={`w-4 h-4 ${isCurrentlyFeatured ? "text-yellow-400 fill-yellow-400" : "text-white"} ${allImageUrls.length === 0 ? "opacity-50" : ""}`} />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); handleDeleteImage(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleDeleteImage(); } }}
                title="Delete Image"
                className="p-1.5 bg-black/70 rounded-full text-white hover:bg-red-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <XCircleIcon className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      ) : (
         <div className="relative w-full h-16 sm:h-18 md:h-20 lg:h-24 my-0.5 overflow-hidden rounded flex items-center justify-center bg-muted/20 group">
            <span className="text-muted-foreground/50 text-[10px]">No image</span>
         </div>
      )}

      {/* Bottom part: Icons and Notes snippet */}
      <div className="w-full mt-auto pt-0.5">
        <div className="flex items-center justify-start flex-wrap gap-1.5 mb-0.5">
            {dayData?.notes && <NotebookTextIcon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground/70" : "text-primary/70")} aria-label="Notes" />}
            {hasVideos && <VideoIcon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground/70" : "text-primary/70")} aria-label="Video" />}
            {hasTodos && <ListChecksIcon className={cn("h-3.5 w-3.5", hasIncompleteTodos ? "text-orange-400" : "text-green-400", isSelected && (hasIncompleteTodos ? "text-orange-300" : "text-green-300"))} aria-label="To-Do List" />}
            {dayData?.importantEvents && <AlertTriangleIcon className={cn("h-3.5 w-3.5", isSelected ? "text-red-400" : "text-red-500")} aria-label="Important Event" />}
            {/* Icon for images already handled by showing the image itself, or badge for multiple */}
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


const CalendarView: FC<CalendarViewProps> = ({ selectedDate, onDateChange, appData, onSetFeaturedImage, onDeleteImage }) => {
  return (
    <Card className="shadow-lg w-full h-full bg-card text-card-foreground flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">My daily calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3 flex-grow">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          className="rounded-md border-0 w-full h-full" 
          disabled={(date) => date < new Date(new Date().setFullYear(new Date().getFullYear() - 5))}
          components={{
            DayContent: (dayProps) => (
              <MyCustomDayContent
                date={dayProps.date}
                displayMonth={dayProps.displayMonth}
                appData={appData}
                selectedDateUI={selectedDate}
                onSetFeaturedImage={onSetFeaturedImage}
                onDeleteImage={onDeleteImage}
              />
            ),
          }}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 h-full",
            month: "space-y-2 w-full flex flex-col h-full", 
            caption: "flex justify-center pt-1 relative items-center text-card-foreground",
            caption_label: "text-lg font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-8 w-8 bg-transparent p-0 opacity-75 hover:opacity-100 border-primary text-primary hover:bg-primary/10"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse flex-grow flex flex-col", 
            head_row: "flex w-full mb-1",
            head_cell: "text-muted-foreground rounded-md w-[14.2857%] font-normal text-xs md:text-sm justify-center flex p-1",
            row: "flex w-full mt-0 flex-grow", 
            cell: cn(
              "w-[14.2857%] text-center text-sm p-0.5 relative flex", 
              "border border-border/50", 
              "h-32 sm:h-36 md:h-40 lg:h-44" // Slightly increased default height to accommodate image previews better
            ),
            day: cn(
              "h-full w-full p-0 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
            ),
            day_selected: "", 
            day_today: "", 
            day_outside: "text-muted-foreground/30 opacity-70",
            day_disabled: "text-muted-foreground/50 opacity-50",
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarView;
