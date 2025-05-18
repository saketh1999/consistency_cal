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
}

const ImportantEventsModule = ({ 
  importantEvents, 
  onImportantEventsChange,
  defaultOpen = true,
  initialExpanded = false 
}: ImportantEventsModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <Label htmlFor="importantEvents" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
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
            id="importantEvents"
            placeholder="e.g., Doctor's appointment at 3 PM, Project deadline"
            value={importantEvents}
            onChange={(e) => onImportantEventsChange(e.target.value)}
            className="min-h-[80px] resize-none bg-input text-foreground placeholder-muted-foreground"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ImportantEventsModule; 