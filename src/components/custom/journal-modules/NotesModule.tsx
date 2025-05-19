'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NotebookTextIcon, GripVertical } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';

interface NotesModuleProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  defaultOpen?: boolean;
  initialExpanded?: boolean;
  isReadOnly?: boolean;
}

const NotesModule = ({ 
  notes, 
  onNotesChange,
  defaultOpen = true,
  initialExpanded = true,
  isReadOnly = false
}: NotesModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <Label htmlFor="notes" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
            <NotebookTextIcon className="h-5 w-5" />
            Notes
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
            id="notes"
            placeholder="How was your day? What did you achieve?"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[120px] resize-none bg-input text-foreground placeholder-muted-foreground"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NotesModule; 