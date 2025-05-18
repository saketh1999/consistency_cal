'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListChecksIcon, GripVertical, Trash2Icon, PlusCircleIcon, Calendar } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { TodoItem } from '@/lib/types';
import { getTasksByDate, createTask, toggleTaskCompletion as apiToggleTaskCompletion, deleteTask as apiDeleteTask, setTaskGlobal } from '@/lib/services/tasksService';
import { Task } from '@/lib/supabase';

interface TodoModuleProps {
  selectedDate: Date;
  userId: string;
  todos: TodoItem[];
  setTodos: (todos: TodoItem[]) => void;
  defaultOpen?: boolean;
  initialExpanded?: boolean;
}

const TodoModule = ({ 
  selectedDate,
  userId,
  todos,
  setTodos,
  defaultOpen = true,
  initialExpanded = true 
}: TodoModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const [newTodoText, setNewTodoText] = useState('');
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load tasks when component mounts or when date/user changes
  const loadTasks = useCallback(async () => {
    if (!selectedDate || !userId) return;
    
    setIsLoading(true);
    
    try {
      const tasks = await getTasksByDate(selectedDate, userId);
      console.log("Loaded tasks:", tasks); // Debug
      setDailyTasks(tasks);
      
      // Convert to legacy format for compatibility
      const legacyTodos: TodoItem[] = tasks.map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed
      }));
      
      setTodos(legacyTodos);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks for this date',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, userId, setTodos, toast]);
  
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTodo = async () => {
    if (!selectedDate || !userId || !newTodoText.trim()) return;
    
    try {
      const newTask = await createTask(
        {
          text: newTodoText,
          date: selectedDate,
        },
        userId
      );
      
      if (!newTask) {
        throw new Error('Failed to create task');
      }
      
      // Update local state
      setDailyTasks(prev => [...prev, newTask]);
      
      // Update legacy todos
      const newTodo: TodoItem = {
        id: newTask.id,
        text: newTask.text,
        completed: newTask.completed
      };
      setTodos(prev => [...prev, newTodo]);
      
      setNewTodoText('');
      
      toast({
        title: "Task Added",
        description: "Your task has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Task Creation Failed",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTodo = async (id: string) => {
    const task = dailyTasks.find(t => t.id === id);
    if (!task) {
      console.error("Task not found for toggle:", id);
      return;
    }
    
    try {
      const updatedTask = await apiToggleTaskCompletion(id, !task.completed);
      
      if (!updatedTask) {
        console.warn("No updated task returned from toggle operation");
        // Proceed anyway with optimistic update
        const optimisticUpdatedTask = { ...task, completed: !task.completed };
        
        // Update local state
        setDailyTasks(prev => prev.map(t => t.id === id ? optimisticUpdatedTask : t));
        
        // Update legacy todos
        setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
        
        return;
      }
      
      // Update local state
      setDailyTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      // Update legacy todos
      setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTodo = async (id: string) => {
    try {
      await apiDeleteTask(id);
      
      // Update local state (optimistically)
      setDailyTasks(prev => prev.filter(t => t.id !== id));
      
      // Update legacy todos (optimistically)
      setTodos(prev => prev.filter(todo => todo.id !== id));
      
      toast({
        title: "Task Deleted",
        description: "Task has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      
      // Refresh to ensure state is correct
      loadTasks();
    }
  };

  const handleToggleGlobalTask = async (id: string) => {
    const task = dailyTasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      const updatedTask = await setTaskGlobal(id, !task.is_global);
      
      if (!updatedTask) {
        toast({
          title: "Warning",
          description: "Task may not have been updated correctly",
          variant: "default",
        });
        return;
      }
      
      // Update local state
      setDailyTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      toast({
        title: updatedTask.is_global ? "Task Set as Global" : "Task Unset as Global",
        description: updatedTask.is_global 
          ? "This task will now appear daily" 
          : "This task will no longer appear daily",
      });
    } catch (error) {
      console.error('Error toggling global task setting:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <Label htmlFor="todoInput" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
            <ListChecksIcon className="h-5 w-5" />
            To-Do List ({todos.filter(t => !t.completed).length} remaining)
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
            <Button 
              onClick={handleAddTodo} 
              variant="outline" 
              size="icon" 
              aria-label="Add todo" 
              className="border-primary text-primary hover:bg-primary/10"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {todos.length > 0 ? (
            <ScrollArea className="max-h-40 rounded-md border border-border p-3 bg-background/30">
              <div className="space-y-2 pr-4">
                {todos.map((todo) => {
                  const task = dailyTasks.find(t => t.id === todo.id);
                  const isGlobal = task?.is_global || false;
                  
                  return (
                    <div key={todo.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted/20 rounded transition-colors">
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
                          className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'} cursor-pointer flex items-center`}
                        >
                          {todo.text}
                          {isGlobal && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">
                              daily
                            </span>
                          )}
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleGlobalTask(todo.id)} 
                          className="h-6 w-6 hover:bg-accent/10"
                          title={isGlobal ? "Remove from daily tasks" : "Make a daily task"}
                        >
                          <Calendar className="h-3.5 w-3.5 text-accent/80 hover:text-accent" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveTodo(todo.id)} 
                          className="h-6 w-6"
                          aria-label="Remove todo"
                        >
                          <Trash2Icon className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center bg-muted/20 rounded-md">
              <ListChecksIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No tasks yet. Add some!</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TodoModule; 