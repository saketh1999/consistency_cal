
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
import { ImageIcon, VideoIcon, NotebookTextIcon, ListChecksIcon, AlertTriangleIcon, Trash2Icon, PlusCircleIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface DailyContentViewProps {
  selectedDate: Date | undefined;
  data: DailyData | undefined;
  onDataChange: (dateKey: string, newDailyData: DailyData) => void;
}

const DailyContentView: FC<DailyContentViewProps> = ({ selectedDate, data, onDataChange }) => {
  const [notes, setNotes] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | undefined>(undefined); // For uploaded image
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeEmbedId, setYoutubeEmbedId] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [importantEvents, setImportantEvents] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(data?.notes || '');
    setImageDataUri(data?.imageUrl || undefined); // imageUrl from data is now a data URI
    setVideoUrl(data?.videoUrl || '');
    setTodos(data?.todos || []);
    setImportantEvents(data?.importantEvents || '');
    setNewTodoText('');

    if (data?.videoUrl) {
      extractYoutubeEmbedId(data.videoUrl);
    } else {
      setYoutubeEmbedId(null);
    }
  }, [data, selectedDate]);

  const extractYoutubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    setYoutubeEmbedId((match && match[2].length === 11) ? match[2] : null);
  };

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
          fileInputRef.current.value = ""; // Reset file input
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
        videoUrl, 
        todos, 
        importantEvents 
      });
      toast({ title: "Journal Saved!", description: "Your entries for the day have been saved." });
    }
  };
  
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setVideoUrl(newUrl);
    extractYoutubeEmbedId(newUrl);
  }

  if (!selectedDate) {
    return (
      <Card className="flex h-full items-center justify-center shadow-lg">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Select a date to view or add content.</p>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = format(selectedDate, 'MMMM do, yyyy');

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Journal for {formattedDate}</CardTitle>
        <CardDescription>Log your activities, meals, and thoughts for the day.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow overflow-y-auto p-4 md:p-6">
        {/* Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2 font-medium">
            <NotebookTextIcon className="h-5 w-5 text-primary" />
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="How was your day? What did you achieve?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="imageUpload" className="flex items-center gap-2 font-medium">
            <ImageIcon className="h-5 w-5 text-primary" />
            Upload Image
          </Label>
          <Input
            id="imageUpload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          {imageDataUri && (
            <div className="mt-2 overflow-hidden rounded-lg border shadow-sm">
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
          )}
          {!imageDataUri && (
             <div className="mt-2 overflow-hidden rounded-lg border shadow-sm flex items-center justify-center bg-muted/30 aspect-[3/2]">
                <Image
                    src={`https://placehold.co/600x400.png`}
                    alt="Placeholder for image"
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-cover opacity-50"
                    data-ai-hint="placeholder fitness"
                />
                <span className="absolute text-muted-foreground">Upload an image</span>
            </div>
           )}
        </div>

        {/* YouTube Video Section */}
        <div className="space-y-2">
          <Label htmlFor="videoUrl" className="flex items-center gap-2 font-medium">
             <VideoIcon className="h-5 w-5 text-primary" />
            YouTube Video URL
          </Label>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=your_video_id"
            value={videoUrl}
            onChange={handleVideoUrlChange}
          />
          {youtubeEmbedId && (
            <div className="mt-2">
              <YoutubeEmbed embedId={youtubeEmbedId} />
            </div>
          )}
        </div>

        {/* Todo List Section */}
        <div className="space-y-3">
          <Label htmlFor="todoInput" className="flex items-center gap-2 font-medium">
            <ListChecksIcon className="h-5 w-5 text-primary" />
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
              className="flex-grow"
            />
            <Button onClick={handleAddTodo} variant="outline" size="icon" aria-label="Add todo">
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
          {todos.length > 0 && (
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto rounded-md border p-3">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`todo-${todo.id}`}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      aria-label={todo.text}
                    />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
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
          <Label htmlFor="importantEvents" className="flex items-center gap-2 font-medium">
            <AlertTriangleIcon className="h-5 w-5 text-primary" />
            Important Events
          </Label>
          <Textarea
            id="importantEvents"
            placeholder="e.g., Doctor's appointment at 3 PM, Project deadline"
            value={importantEvents}
            onChange={(e) => setImportantEvents(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 md:pt-6">
        <Button onClick={handleSave} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Save Journal Entries
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyContentView;
