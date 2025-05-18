'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/hooks/useAuth';
import { DailyEntry } from '@/lib/supabase';
import { getDailyEntry, saveDailyEntry } from '@/lib/services/dailyEntriesService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Import modular components
import NotesModule from './journal-modules/NotesModule';
import ImageUploadModule from './journal-modules/ImageUploadModule';
import VideoModule from './journal-modules/VideoModule';
import TodoModule from './journal-modules/TodoModule';
import ImportantEventsModule from './journal-modules/ImportantEventsModule';
import CalendarEventsModule from './journal-modules/CalendarEventsModule';

import type { DailyData, TodoItem, GoogleCalendarEvent } from '@/lib/types';

interface DailyContentViewProps {
  selectedDate: Date | undefined;
  data: DailyData | undefined;
  onDataChange: (dateKey: string, newDailyData: DailyData) => void;
}

interface ModuleConfig {
  id: string;
  type: 'notes' | 'images' | 'videos' | 'todos' | 'important-events' | 'calendar-events';
  title: string;
  defaultOpen: boolean;
  initialExpanded?: boolean;
}

const DailyContentView: React.FC<DailyContentViewProps> = ({ selectedDate, data: initialData, onDataChange }) => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for all module data
  const [notes, setNotes] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [importantEvents, setImportantEvents] = useState('');
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([]);

  // Module configuration - this determines order and visibility
  const [modules, setModules] = useState<ModuleConfig[]>([
    { id: 'notes-module', type: 'notes', title: 'Notes', defaultOpen: true, initialExpanded: true },
    { id: 'images-module', type: 'images', title: 'Images', defaultOpen: true, initialExpanded: true },
    { id: 'videos-module', type: 'videos', title: 'YouTube Videos', defaultOpen: true, initialExpanded: false },
    { id: 'todos-module', type: 'todos', title: 'To-Do List', defaultOpen: true, initialExpanded: true },
    { id: 'important-events-module', type: 'important-events', title: 'Important Events', defaultOpen: true, initialExpanded: false },
    { id: 'calendar-events-module', type: 'calendar-events', title: 'Calendar Events', defaultOpen: true, initialExpanded: false },
  ]);

  // Initial data loading from Supabase
  useEffect(() => {
    async function loadData() {
      if (!selectedDate || !user?.id) return;
      
      setIsLoading(true);
      
      try {
        // Load daily entry
        const entry = await getDailyEntry(selectedDate, user.id);
        setDailyEntry(entry);
        
        if (entry) {
          setNotes(entry.notes || '');
          setVideoUrls(entry.video_urls || []);
          setImportantEvents(entry.important_events || '');
          
          // Load images for this entry is handled by the ImageUploadModule
          
          // The TodoModule will load tasks for the selected date
        } else {
          // Reset values if no entry exists
          setNotes('');
          setVideoUrls([]);
          setImportantEvents('');
          setImageUrls([]);
        }
      } catch (error) {
        console.error('Error loading daily data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load daily content',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [selectedDate, user?.id, toast]);

  const handleSave = async () => {
    if (!selectedDate || !user?.id) return;
    
    setIsSaving(true);
    
    try {
      const savedEntry = await saveDailyEntry(
        selectedDate, 
        user.id, 
        {
          notes,
          videoUrls,
          importantEvents,
        }
      );
      
      if (!savedEntry) {
        throw new Error('Failed to save entry');
      }
      
      setDailyEntry(savedEntry);
      
      // For backward compatibility, still call the original onDataChange
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      onDataChange(dateKey, {
        notes,
        imageUrls,
        videoUrls,
        todos,
        importantEvents,
        googleCalendarEvents
      });
      
      toast({ 
        title: "Journal Saved!", 
        description: "Your entries for the day have been saved." 
      });
    } catch (error) {
      console.error('Error saving daily entry:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your journal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle dragging and dropping modules to reorder
  const onDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) return;
    
    const items = Array.from(modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setModules(items);
  };

  if (authLoading) {
    return (
      <Card className="flex h-full items-center justify-center shadow-lg bg-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading authentication data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="flex h-full items-center justify-center shadow-lg bg-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please sign in to view and edit your journal.</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedDate) {
    return (
      <Card className="flex h-full items-center justify-center shadow-lg bg-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Select a date to view or add content.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg h-full flex flex-col bg-card text-card-foreground">
        <CardHeader>
          <div className="h-8 w-40 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-full mt-2 bg-muted animate-pulse rounded"></div>
        </CardHeader>
        <CardContent className="space-y-6 flex-grow p-4 md:p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-32 w-full bg-muted animate-pulse rounded"></div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t border-border pt-4 md:pt-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
        </CardFooter>
      </Card>
    );
  }

  const formattedDate = format(selectedDate, 'MMMM do, yyyy');

  return (
    <Card className="shadow-lg h-full flex flex-col bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">{formattedDate}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-grow overflow-y-auto p-4 md:p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <div
                className="space-y-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {modules.map((module, index) => (
                  <Draggable key={module.id} draggableId={module.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        {/* Render the appropriate module based on type */}
                        {module.type === 'notes' && (
                          <NotesModule
                            notes={notes}
                            onNotesChange={setNotes}
                            defaultOpen={module.defaultOpen}
                            initialExpanded={module.initialExpanded}
                          />
                        )}
                        
                        {module.type === 'images' && (
                          <ImageUploadModule
                            selectedDate={selectedDate}
                            dailyEntryId={dailyEntry?.id}
                            userId={user.id}
                            imageUrls={imageUrls}
                            setImageUrls={setImageUrls}
                            defaultOpen={module.defaultOpen}
                            initialExpanded={module.initialExpanded}
                          />
                        )}
                        
                        {module.type === 'videos' && (
                          <VideoModule
                            videoUrls={videoUrls}
                            onVideoUrlsChange={setVideoUrls}
                            defaultOpen={module.defaultOpen}
                            initialExpanded={module.initialExpanded}
                          />
                        )}
                        
                        {module.type === 'todos' && (
                          <TodoModule 
                            selectedDate={selectedDate}
                            userId={user.id}
                            todos={todos}
                            setTodos={setTodos}
                            defaultOpen={module.defaultOpen}
                            initialExpanded={module.initialExpanded}
                          />
                        )}
                        
                        {module.type === 'important-events' && (
                          <ImportantEventsModule
                            importantEvents={importantEvents}
                            onImportantEventsChange={setImportantEvents}
                            defaultOpen={module.defaultOpen}
                            initialExpanded={module.initialExpanded}
                          />
                        )}
                        
                        {module.type === 'calendar-events' && (
                          <CalendarEventsModule
                            events={googleCalendarEvents}
                            onEventsChange={setGoogleCalendarEvents}
                            defaultOpen={module.defaultOpen}
                            initialExpanded={module.initialExpanded}
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
      
      <CardFooter className="border-t border-border pt-4 md:pt-6">
        <Button
          onClick={handleSave}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Journal Entries"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyContentView;

    