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
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  // State for all module data
  const [notes, setNotes] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [importantEvents, setImportantEvents] = useState('');
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isUpdatingFromProps, setIsUpdatingFromProps] = useState(false);
  const [lastSyncedData, setLastSyncedData] = useState<string>('');

  // Module configuration - this determines order and visibility
  const [modules, setModules] = useState<ModuleConfig[]>([
    { id: 'notes-module', type: 'notes', title: 'Notes', defaultOpen: true, initialExpanded: true },
    { id: 'images-module', type: 'images', title: 'Images', defaultOpen: true, initialExpanded: true },
    { id: 'videos-module', type: 'videos', title: 'YouTube Videos', defaultOpen: true, initialExpanded: false },
    { id: 'todos-module', type: 'todos', title: 'To-Do List', defaultOpen: true, initialExpanded: true },
    { id: 'important-events-module', type: 'important-events', title: 'Important Events', defaultOpen: true, initialExpanded: false },
    { id: 'calendar-events-module', type: 'calendar-events', title: 'Calendar Events', defaultOpen: true, initialExpanded: false },
  ]);

  useEffect(() => {
    setIsComponentMounted(true);
    return () => setIsComponentMounted(false);
  }, []);

  // Helper to serialize data for comparison
  const serializeData = (data: any) => {
    return JSON.stringify({
      notes: data.notes || '',
      imageUrls: data.imageUrls || [],
      featuredImageUrl: data.featuredImageUrl,
      videoUrls: data.videoUrls || [],
      todos: data.todos || [],
      importantEvents: data.importantEvents || '',
      googleCalendarEvents: data.googleCalendarEvents || []
    });
  };

  // Effect to initialize/reset local state when initialData (from props) or selectedDate changes
  useEffect(() => {
    if (!selectedDate) {
      // Reset all fields if no date is selected
      setNotes('');
      setImageUrls([]);
      setFeaturedImageUrl(undefined);
      setVideoUrls([]);
      setTodos([]);
      setImportantEvents('');
      setGoogleCalendarEvents([]);
      return;
    }
    
    // Only update if we have initialData and it's different from our current state
    if (initialData) {
      const newDataSerialized = serializeData(initialData);
      if (newDataSerialized !== lastSyncedData) {
        console.log('DailyContentView: Updating from props', initialData);
        setIsUpdatingFromProps(true);
        
        // Update all the local state values from props
        setNotes(initialData.notes || '');
        setImageUrls(initialData.imageUrls || []);
        setFeaturedImageUrl(initialData.featuredImageUrl);
        setVideoUrls(initialData.videoUrls || []);
        setTodos(initialData.todos || []);
        setImportantEvents(initialData.importantEvents || '');
        setGoogleCalendarEvents(initialData.googleCalendarEvents || []);
        
        // Remember what we've synced
        setLastSyncedData(newDataSerialized);
        
        // Reset the flag after all state updates are processed
        setTimeout(() => setIsUpdatingFromProps(false), 0);
      }
    }
  }, [initialData, selectedDate, lastSyncedData]);

  // Effect to load data from Supabase when date or user changes
  useEffect(() => {
    async function loadDataFromDB() {
      if (!selectedDate || !user?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const entry = await getDailyEntry(selectedDate, user.id);
        setDailyEntry(entry);
        if (entry) {
          // Don't trigger update chain when loading from DB
          setIsUpdatingFromProps(true);
          
          // Update local state from DB
          setNotes(entry.notes || '');
          setVideoUrls(entry.video_urls || []);
          setImportantEvents(entry.important_events || '');
          setFeaturedImageUrl(entry.featured_image_url || undefined);
          
          // Reset the flag after all state updates are processed
          setTimeout(() => setIsUpdatingFromProps(false), 0);
        }
      } catch (error) {
        console.error('Error loading daily data from DB:', error);
        toast({ title: 'Error', description: 'Failed to load daily content from database', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (isComponentMounted) {
      loadDataFromDB();
    }
  }, [selectedDate, user?.id, toast, isComponentMounted]);

  // Effect to synchronize local daily data state with HomePage via onDataChange
  useEffect(() => {
    // Skip sync when component is not ready or we're updating from props
    if (!isComponentMounted || !selectedDate || !onDataChange || isUpdatingFromProps) {
      return;
    }

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentDailyData: DailyData = {
      notes,
      imageUrls,
      featuredImageUrl,
      videoUrls,
      todos,
      importantEvents,
      googleCalendarEvents,
    };
    
    // Only sync if data has changed from last sync
    const currentSerialized = serializeData(currentDailyData);
    if (currentSerialized !== lastSyncedData) {
      console.log('DailyContentView: Calling onDataChange for', dateKey, currentDailyData);
      setLastSyncedData(currentSerialized);
      onDataChange(dateKey, currentDailyData);
    }
  }, [
    notes, imageUrls, featuredImageUrl, videoUrls, todos, importantEvents, googleCalendarEvents,
    selectedDate, onDataChange, isComponentMounted, isUpdatingFromProps, lastSyncedData
  ]);

  const handleSave = async () => {
    if (!selectedDate || !user?.id) return;
    
    setIsSaving(true);
    try {
      const dataToSave: Partial<DailyEntry> = {
        notes,
        video_urls: videoUrls,
        important_events: importantEvents,
        featured_image_url: featuredImageUrl, // Ensure featured image is part of the save payload
      };

      const savedEntry = await saveDailyEntry(selectedDate, user.id, dataToSave );      
      if (!savedEntry) throw new Error('Failed to save entry');
      setDailyEntry(savedEntry);
      
      // onDataChange is now handled by the useEffect, but ensure data is up-to-date for it
      // The local state updates (setNotes, etc.) will trigger the sync useEffect.
      toast({ title: "Journal Saved!", description: "Your entries for the day have been saved." });
    } catch (error) {
      console.error('Error saving daily entry:', error);
      toast({ title: "Save Failed", description: "Failed to save your journal. Please try again.", variant: "destructive" });
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

  if (isLoading && !isComponentMounted) {
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
                            featuredImageUrl={featuredImageUrl}
                            setFeaturedImageUrl={setFeaturedImageUrl}
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

    