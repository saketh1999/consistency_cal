
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { DailyData, TodoItem } from '@/lib/types';
import YoutubeEmbed from './YoutubeEmbed';
import { format } from 'date-fns';
import { ImageIcon, VideoIcon, NotebookTextIcon, ListChecksIcon, AlertTriangleIcon, Trash2Icon, PlusCircleIcon, XCircleIcon, UploadCloudIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DailyContentViewProps {
  selectedDate: Date | undefined;
  data: DailyData | undefined;
  onDataChange: (dateKey: string, newDailyData: DailyData) => void;
}

const DailyContentView: FC<DailyContentViewProps> = ({ selectedDate, data, onDataChange }) => {
  const [notes, setNotes] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Changed from imageDataUri
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentVideoUrlInput, setCurrentVideoUrlInput] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [importantEvents, setImportantEvents] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const extractYoutubeEmbedId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    setNotes(data?.notes || '');
    setImageUrls(data?.imageUrls || []); // Changed from data?.imageUrl
    setVideoUrls(data?.videoUrls || []);
    setCurrentVideoUrlInput('');
    setTodos(data?.todos || []);
    setImportantEvents(data?.importantEvents || '');
    setNewTodoText('');
  }, [data, selectedDate]);

  const processImageFile = useCallback((file: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrls(prevUrls => [...prevUrls, reader.result as string]); // Add to array
      };
      reader.onerror = () => {
        toast({
          title: "Error Reading File",
          description: "Could not read the selected image. Please try again.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
    if (fileInputRef.current) {
      // If all images are removed, reset the file input, though it's less critical with multiple files.
      if (imageUrls.length === 1) fileInputRef.current.value = "";
    }
    toast({ title: "Image Removed", description: "The image has been cleared. Save to confirm." });
  };

  const handleAddVideoUrl = () => {
    if (currentVideoUrlInput.trim()) {
      if (extractYoutubeEmbedId(currentVideoUrlInput.trim())) {
        setVideoUrls([...videoUrls, currentVideoUrlInput.trim()]);
        setCurrentVideoUrlInput('');
      } else {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube video URL.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTodoText, completed: false }]);
      setNewTodoText('');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const handleRemoveTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleSave = () => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      onDataChange(dateKey, {
        notes,
        imageUrls, // Save array of image URLs
        videoUrls,
        todos,
        importantEvents
      });
      toast({ title: "Journal Saved!", description: "Your entries for the day have been saved." });
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type.startsWith('image/')) {
        processImageFile(files[0]); // Will add to the array
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please drop an image file.",
          variant: "destructive",
        });
      }
      e.dataTransfer.clearData();
    }
  };


  if (!selectedDate) {
    return (
      <Card className="flex h-full items-center justify-center shadow-lg bg-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Select a date to view or add content.</p>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = format(selectedDate, 'MMMM do, yyyy');

  return (
    <Card className="shadow-lg h-full flex flex-col bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">{formattedDate}</CardTitle>
        <CardDescription className="text-muted-foreground">Log your activities, meals, and thoughts for the day. All fields are editable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow overflow-y-auto p-4 md:p-6">
        {/* Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2 font-medium text-primary">
            <NotebookTextIcon className="h-5 w-5" />
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="How was your day? What did you achieve?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] resize-none bg-input text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Image Upload Section - Updated for multiple images */}
        <div className="space-y-2">
          <Label htmlFor="imageUpload" className="flex items-center gap-2 font-medium text-primary">
            <ImageIcon className="h-5 w-5" />
            Images ({imageUrls.length})
          </Label>
          <div
            className={cn(
              "relative mt-2 overflow-hidden rounded-lg border border-border shadow-sm flex flex-col items-center justify-center bg-muted/30 p-4 transition-all duration-200",
              isDraggingOver && "border-primary ring-2 ring-primary shadow-lg",
              imageUrls.length > 0 && "border-transparent", 
              imageUrls.length === 0 && "min-h-[150px]" // Ensure drop zone has some height when empty
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => imageUrls.length === 0 && fileInputRef.current?.click()} // Allow click on empty area
          >
            {imageUrls.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                <UploadCloudIcon className={cn("h-12 w-12 mb-2", isDraggingOver ? "text-primary" : "text-muted-foreground/70")} />
                <p className={cn("text-sm font-medium", isDraggingOver ? "text-primary" : "text-muted-foreground/90")}>
                  {isDraggingOver ? "Drop image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground/70">Max 5MB per image</p>
              </div>
            )}
          </div>
          {/* Hidden file input */}
          <Input
            id="imageUpload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="sr-only"
            onClick={(event) => { (event.target as HTMLInputElement).value = '' }}
          />
           {/* Button to trigger file input, shown below the drop zone */}
          <Button 
              variant="outline" 
              className="w-full mt-2 border-primary text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Add Image
          </Button>

          {imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group aspect-[3/2]">
                  <Image
                    src={url}
                    alt={`Uploaded content ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md border border-border"
                    data-ai-hint="journal entry"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/150x100.png?text=Invalid`;
                      toast({title: "Image Load Error", description: "Could not display an uploaded image.", variant: "destructive"})
                    }}
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => handleRemoveImage(index)} 
                    aria-label={`Remove image ${index + 1}`}
                    className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-destructive/80 border-destructive/50"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* YouTube Video Section */}
        <div className="space-y-2">
          <Label htmlFor="videoUrlInput" className="flex items-center gap-2 font-medium text-primary">
             <VideoIcon className="h-5 w-5" />
            YouTube Videos
          </Label>
          <div className="flex gap-2">
            <Input
              id="videoUrlInput"
              type="url"
              placeholder="Add YouTube video URL..."
              value={currentVideoUrlInput}
              onChange={(e) => setCurrentVideoUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddVideoUrl()}
              className="flex-grow bg-input text-foreground placeholder-muted-foreground"
            />
            <Button onClick={handleAddVideoUrl} variant="outline" size="icon" aria-label="Add video URL" className="border-primary text-primary hover:bg-primary/10">
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
          {videoUrls.length > 0 && (
            <div className="space-y-3 mt-2">
              {videoUrls.map((url, index) => {
                const embedId = extractYoutubeEmbedId(url);
                return (
                  <div key={index} className="p-2 rounded-md border border-border bg-background/30">
                    <div className="flex justify-between items-center mb-1.5">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate" title={url}>
                        {url}
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveVideoUrl(index)} aria-label="Remove video URL" className="text-destructive/70 hover:text-destructive">
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                    {embedId && <YoutubeEmbed embedId={embedId} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Todo List Section */}
        <div className="space-y-3">
          <Label htmlFor="todoInput" className="flex items-center gap-2 font-medium text-primary">
            <ListChecksIcon className="h-5 w-5" />
            To-Do List
          </Label>
          <div className="flex gap-2">
            <Input
              id="todoInput"
              type="text"
              placeholder="Add a new task..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="flex-grow bg-input text-foreground placeholder-muted-foreground"
            />
            <Button onClick={handleAddTodo} variant="outline" size="icon" aria-label="Add todo" className="border-primary text-primary hover:bg-primary/10">
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
          {todos.length > 0 && (
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto rounded-md border border-border p-3 bg-background/30">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted/20 rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`todo-${todo.id}`}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      aria-label={todo.text}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'} cursor-pointer`}
                    >
                      {todo.text}
                    </label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveTodo(todo.id)} aria-label="Remove todo">
                    <Trash2Icon className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
           {todos.length === 0 && (
             <p className="text-sm text-muted-foreground text-center py-2">No tasks yet. Add some!</p>
           )}
        </div>

        {/* Important Events Section */}
        <div className="space-y-2">
          <Label htmlFor="importantEvents" className="flex items-center gap-2 font-medium text-primary">
            <AlertTriangleIcon className="h-5 w-5" />
            Important Events
          </Label>
          <Textarea
            id="importantEvents"
            placeholder="e.g., Doctor's appointment at 3 PM, Project deadline"
            value={importantEvents}
            onChange={(e) => setImportantEvents(e.target.value)}
            className="min-h-[80px] resize-none bg-input text-foreground placeholder-muted-foreground"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4 md:pt-6">
        <Button onClick={handleSave} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Save Journal Entries
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyContentView;
