'use client';

import { useState, useEffect } from 'react';
import { format, isPast, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskColumn from '@/components/custom/TaskColumn';
import TaskDatePicker from '@/components/custom/TaskDatePicker';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

// Define task type
export interface Task {
  id: string;
  text: string;
  date: string; // ISO string format
  completed: boolean;
}

const TASKS_KEY = 'consistencyTasks';

// Task column types for drag and drop
export type ColumnType = 'missed' | 'today' | 'tomorrow' | 'completed';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const { toast } = useToast();

  // Load tasks from local storage
  useEffect(() => {
    const savedTasks = loadFromLocalStorage<Task[]>(TASKS_KEY, []);
    setTasks(savedTasks);
  }, []);

  // Save tasks to local storage
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    saveToLocalStorage(TASKS_KEY, updatedTasks);
  };

  // Add a new task
  const addTask = (text: string, date: Date) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      date: date.toISOString(),
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    saveTasks(updatedTasks);
    toast({
      title: 'Task Added',
      description: `New task scheduled for ${format(date, 'PP')}`,
    });
  };

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
    toast({
      title: 'Task Deleted',
      description: 'Task has been removed',
    });
  };

  // Start rescheduling a task
  const startReschedule = (taskId: string) => {
    setIsRescheduling(taskId);
  };

  // Complete rescheduling a task
  const completeReschedule = (date: Date) => {
    if (!isRescheduling) return;
    
    const updatedTasks = tasks.map(task => 
      task.id === isRescheduling ? { ...task, date: date.toISOString() } : task
    );
    saveTasks(updatedTasks);
    setIsRescheduling(null);
    toast({
      title: 'Task Rescheduled',
      description: `Task moved to ${format(date, 'PP')}`,
    });
  };

  // Cancel rescheduling
  const cancelReschedule = () => {
    setIsRescheduling(null);
  };

  // Handle drag start
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  // Handle dropping a task into a column
  const handleDrop = (columnType: ColumnType) => {
    if (!draggedTask) return;
    
    let newDate: Date;
    let shouldComplete = false;
    
    switch (columnType) {
      case 'missed':
        newDate = addDays(new Date(), -1); // Yesterday
        break;
      case 'today':
        newDate = new Date(); // Today
        break;
      case 'tomorrow':
        newDate = addDays(new Date(), 1); // Tomorrow
        break;
      case 'completed':
        shouldComplete = true;
        newDate = new Date(); // Keep current date
        break;
    }
    
    const updatedTasks = tasks.map(task => {
      if (task.id === draggedTask) {
        if (shouldComplete) {
          return { ...task, completed: true };
        } else {
          return { 
            ...task, 
            date: newDate.toISOString(),
            completed: false 
          };
        }
      }
      return task;
    });
    
    saveTasks(updatedTasks);
    setDraggedTask(null);
    
    const task = tasks.find(t => t.id === draggedTask);
    if (task) {
      toast({
        title: shouldComplete ? 'Task Completed' : 'Task Moved',
        description: shouldComplete 
          ? `"${task.text}" marked as completed` 
          : `"${task.text}" moved to ${format(newDate, 'PP')}`,
      });
    }
  };

  // Filter tasks into the four categories
  const missedTasks = tasks.filter(task => 
    !task.completed && isPast(parseISO(task.date)) && !isToday(parseISO(task.date))
  );
  
  const todayTasks = tasks.filter(task => 
    !task.completed && isToday(parseISO(task.date))
  );
  
  const tomorrowTasks = tasks.filter(task => 
    !task.completed && isTomorrow(parseISO(task.date))
  );

  const completedTasks = tasks.filter(task => 
    task.completed
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center space-x-4">
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Calendar
            </a>
            <a href="/tasks" className="text-sm font-medium">
              Tasks
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 container py-6 flex flex-col items-center">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <TaskDatePicker onAddTask={addTask} />
          </div>

          {isRescheduling && (
            <Card className="mb-8 border-primary w-full">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                    <span>Select a new date for this task:</span>
                  </div>
                  <div className="flex space-x-2">
                    <TaskDatePicker 
                      onSelectDate={completeReschedule}
                      buttonLabel="Reschedule"
                      defaultDate={addDays(new Date(), 1)}
                    />
                    <button 
                      onClick={cancelReschedule}
                      className="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
            <TaskColumn 
              title="Missed Tasks" 
              tasks={missedTasks} 
              onToggleComplete={toggleTaskCompletion}
              onDeleteTask={deleteTask}
              onRescheduleTask={startReschedule}
              color="destructive"
              columnType="missed"
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
            
            <TaskColumn 
              title="Today's Tasks" 
              tasks={todayTasks}
              onToggleComplete={toggleTaskCompletion}
              onDeleteTask={deleteTask}
              onRescheduleTask={startReschedule}
              color="primary"
              columnType="today"
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
            
            <TaskColumn 
              title="Tomorrow's Tasks" 
              tasks={tomorrowTasks}
              onToggleComplete={toggleTaskCompletion}
              onDeleteTask={deleteTask}
              onRescheduleTask={startReschedule}
              color="accent"
              columnType="tomorrow"
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />

            <TaskColumn 
              title="Completed Tasks" 
              tasks={completedTasks}
              onToggleComplete={toggleTaskCompletion}
              onDeleteTask={deleteTask}
              onRescheduleTask={startReschedule}
              color="success"
              columnType="completed"
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
        </div>
      </main>

      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ for your journey towards consistency. &copy; {new Date().getFullYear()} Consistency.
          </p>
        </div>
      </footer>
    </div>
  );
} 