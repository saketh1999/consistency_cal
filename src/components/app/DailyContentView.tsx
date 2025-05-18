
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { DailyData, TodoItem } from '@/lib/types';
import YoutubeEmbed from './YoutubeEmbed';
import { format } from 'date-fns';
import { ImageIcon, VideoIcon, NotebookTextIcon, ListChecksIcon, AlertTriangleIcon, Trash2Icon, PlusCircleIcon, XCircleIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface DailyContentViewProps {
  selectedDate: Date | undefined;
  data: DailyData | undefined;
  onDataChange: (dateKey: string, newDailyData: DailyData) => void;
}

const DailyContentView: FC<DailyContentViewProps> = ({ selectedDate, data, onDataChange }) => {
  const [notes, setNotes] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | undefined>(undefined);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentVideoUrlInput, setCurrentVideoUrlInput] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [importantEvents, setImportantEvents] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractYoutubeEmbedId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    setNotes(data?.notes || '');
    setImageDataUri(data?.imageUrl || undefined);
    setVideoUrls(data?.videoUrls || []);
    setCurrentVideoUrlInput('');
    setTodos(data?.todos || []);
    setImportantEvents(data?.importantEvents || '');
    setNewTodoText('');
  }, [data, selectedDate]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        setImageDataUri(reader.result as string);
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
  };

  const handleRemoveImage = () => {
    setImageDataUri(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
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
        imageUrl: imageDataUri, 
        videoUrls, 
        todos, 
        importantEvents 
      });
      toast({ title: "Journal Saved!", description: "Your entries for the day have been saved." });
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
        <CardDescription className="text-muted-foreground">Log your activities, meals, and thoughts. All fields are editable.</CardDescription>
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

        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="imageUpload" className="flex items-center gap-2 font-medium text-primary">
            <ImageIcon className="h-5 w-5" />
            Image
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="imageUpload"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 bg-input text-foreground"
            />
            {imageDataUri && (
              <Button variant="outline" size="icon" onClick={handleRemoveImage} aria-label="Remove image" className="border-destructive text-destructive hover:bg-destructive/10">
                <XCircleIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
          {imageDataUri ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-border shadow-sm">
              <Image
                src={imageDataUri}
                alt="User uploaded content"
                width={600}
                height={400}
                className="aspect-[3/2] w-full object-cover"
                data-ai-hint="journal entry"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/600x400.png?text=Invalid+Image`;
                  toast({title: "Image Load Error", description: "Could not display the uploaded image.", variant: "destructive"})
                }}
              />
            </div>
          ) : (
             <div className="mt-2 overflow-hidden rounded-lg border border-border shadow-sm flex items-center justify-center bg-muted/30 aspect-[3/2]">
                <Image
                    src={`https://placehold.co/600x400.png`}
                    alt="Placeholder for image"
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-cover opacity-50"
                    data-ai-hint="placeholder fitness"
                />
                <span className="absolute text-muted-foreground/70">Upload an image</span>
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
