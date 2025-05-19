'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, GripVertical, Trash2Icon } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { GoogleCalendarEvent } from '@/lib/types';

interface CalendarEventsModuleProps {
  events: GoogleCalendarEvent[];
  onEventsChange: (events: GoogleCalendarEvent[]) => void;
  defaultOpen?: boolean;
  initialExpanded?: boolean;
  isReadOnly?: boolean;
}

const CalendarEventsModule = ({ 
  events, 
  onEventsChange,
  defaultOpen = true,
  initialExpanded = false,
  isReadOnly = false
}: CalendarEventsModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const { toast } = useToast();

  const formatEventTime = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  const handleRemoveCalendarEvent = (id: string) => {
    if (isReadOnly) {
      toast({
        title: "Read-Only",
        description: "Cannot remove calendar events from a past date.",
        variant: "default",
      });
      return;
    }
    const newEvents = events.filter(event => event.id !== id);
    onEventsChange(newEvents);
    toast({ 
      title: "Calendar Event Removed", 
      description: "The event has been removed. Save to confirm." 
    });
  };

  // If no events, don't show the component
  if (events.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          {!isReadOnly && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
          <Label htmlFor="calendarEventsTrigger" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
            <Calendar className="h-5 w-5" />
            Calendar Events ({events.length})
          </Label>
        </div>
        
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground">
            <span className="sr-only">Toggle</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="p-3 space-y-3">
          {!isReadOnly && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-accent border-accent hover:bg-accent/10"
              >
                <Calendar className="h-4 w-4 mr-1" /> Sync from Google Calendar
              </Button>
            </div>
          )}
          
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 rounded-md">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {isReadOnly 
                  ? "No calendar events for this date." 
                  : "No calendar events. Sync from Google Calendar to display your events."}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-60 pr-4">
              <div className="space-y-2">
                {events.map((event, index) => {
                  // Parse dates
                  const startDate = new Date(event.startDateTime);
                  const endDate = new Date(event.endDateTime);
                  const formattedStart = format(startDate, 'h:mm a');
                  const formattedEnd = format(endDate, 'h:mm a');
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`p-2 rounded-md border border-l-4 ${
                        event.colorId ? '' : 'border-border'
                      } bg-background/30`}
                      style={{
                        '--event-color-1': '#4285F4', // Blue
                        '--event-color-2': '#EA4335', // Red
                        '--event-color-3': '#FBBC05', // Yellow
                        '--event-color-4': '#34A853', // Green
                        '--event-color-5': '#8D6E63', // Brown
                        '--event-color-6': '#D50000', // Dark Red
                        '--event-color-7': '#039BE5', // Light Blue
                        '--event-color-8': '#7986CB', // Lavender
                        '--event-color-9': '#33B679', // Mint Green
                        '--event-color-10': '#E67C73', // Salmon
                        '--event-color-11': '#F6BF26', // Gold
                        // Apply border color directly through style
                        borderLeftColor: event.colorId ? `var(--event-color-${event.colorId})` : 'var(--border)'
                      } as React.CSSProperties}
                    >
                      <div className="mb-1">
                        <h4 className="text-sm font-medium">{event.summary}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formattedStart} - {formattedEnd}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      {event.description && (
                        <p className="text-xs text-foreground/80 whitespace-pre-line">
                          {event.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CalendarEventsModule; 