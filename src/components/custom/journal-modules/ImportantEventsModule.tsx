'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangleIcon, GripVertical } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';

interface ImportantEventsModuleProps {
  importantEvents: string;
  onImportantEventsChange: (events: string) => void;
  defaultOpen?: boolean;
  initialExpanded?: boolean;
  isReadOnly?: boolean;
}

const ImportantEventsModule = ({ 
  importantEvents, 
  onImportantEventsChange,
  defaultOpen = true,
  initialExpanded = false,
  isReadOnly = false
}: ImportantEventsModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          {!isReadOnly && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
          <Label htmlFor="importantEventsTrigger" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
            <AlertTriangleIcon className="h-5 w-5" />
            Important Events
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
          <Textarea
            id="importantEventsTrigger"
            value={importantEvents}
            onChange={(e) => !isReadOnly && onImportantEventsChange(e.target.value)}
            placeholder={isReadOnly 
              ? "No important events noted for this day." 
              : "Note any significant milestones, achievements, or events that happened today..."}
            className="w-full min-h-[120px] resize-y rounded-md border border-input bg-transparent p-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isReadOnly}
            readOnly={isReadOnly}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ImportantEventsModule; 