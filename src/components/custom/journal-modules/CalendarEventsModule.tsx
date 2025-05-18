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
}

const CalendarEventsModule = ({ 
  events, 
  onEventsChange,
  defaultOpen = true,
  initialExpanded = false 
}: CalendarEventsModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const { toast } = useToast();

  const formatEventTime = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  const handleRemoveCalendarEvent = (id: string) => {
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
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <Label className="flex items-center gap-2 font-medium text-primary cursor-pointer">
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
        <div className="p-3">
          <ScrollArea className="h-60 rounded-md border border-border p-3 bg-background/30">
            <div className="space-y-2 pr-4">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="p-2 rounded-md border border-border bg-background/20 hover:bg-background/30 flex justify-between items-start"
                >
                  <div>
                    <h4 className="text-sm font-medium">{event.summary}</h4>
                    <p className="text-xs text-muted-foreground">{formatEventTime(event.startDateTime, event.endDateTime)}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.location}</p>
                    )}
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveCalendarEvent(event.id)}
                    className="text-destructive/70 hover:text-destructive h-7 w-7"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CalendarEventsModule; 