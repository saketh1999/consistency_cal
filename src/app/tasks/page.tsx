'use client';

import { useState, useEffect } from 'react';
import { format, isPast, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskColumn from '../../components/custom/TaskColumn';
import TaskDatePicker from '../../components/custom/TaskDatePicker';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  createTask, 
  deleteTask as deleteTaskService, 
  getOrganizedTasks, 
  rescheduleTask, 
  toggleTaskCompletion as toggleTaskCompletionService 
} from '@/lib/services/tasksService';
import { Task } from '@/lib/supabase';

// Task column types for drag and drop
export type ColumnType = 'missed' | 'today' | 'tomorrow' | 'completed';

export default function TasksPage() {
  const [missedTasks, setMissedTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Load tasks from Supabase
  useEffect(() => {
    async function loadTasks() {
      if (!user?.id) return;
      
      setIsLoading(true);
      
      try {
        const organizedTasks = await getOrganizedTasks(user.id);
        
        setMissedTasks(organizedTasks.missed);
        setTodayTasks(organizedTasks.today);
        setTomorrowTasks(organizedTasks.tomorrow);
        setCompletedTasks(organizedTasks.completed);
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tasks',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTasks();
  }, [user?.id, toast]);

  // Add a new task
  const addTask = async (text: string, date: Date) => {
    if (!user?.id) return;
    
    try {
      const newTask = await createTask(
        {
          text,
          date,
        },
        user.id
      );
      
      if (!newTask) {
        throw new Error('Failed to create task');
      }
      
      // Update the correct list based on the date
      if (isToday(date)) {
        setTodayTasks([...todayTasks, newTask]);
      } else if (isTomorrow(date)) {
        setTomorrowTasks([...tomorrowTasks, newTask]);
      }
      
      toast({
        title: 'Task Added',
        description: `New task scheduled for ${format(date, 'PP')}`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Task Creation Failed',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Toggle task completion
  const handleToggleTaskCompletion = async (taskId: string) => {
    // Find the task in any of the columns
    const task = 
      missedTasks.find(t => t.id === taskId) ||
      todayTasks.find(t => t.id === taskId) ||
      tomorrowTasks.find(t => t.id === taskId) ||
      completedTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    try {
      const updatedTask = await toggleTaskCompletionService(taskId, !task.completed);
      
      if (!updatedTask) {
        console.warn('Task update returned null but did not throw an error');
      }
      
      // Refresh all tasks to ensure proper categorization
      if (user?.id) {
        const organizedTasks = await getOrganizedTasks(user.id);
        
        setMissedTasks(organizedTasks.missed);
        setTodayTasks(organizedTasks.today);
        setTomorrowTasks(organizedTasks.tomorrow);
        setCompletedTasks(organizedTasks.completed);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const success = await deleteTaskService(taskId);
      
      if (success === false) {
        console.warn('Task deletion may have failed');
      }
      
      // Remove from all lists
      setMissedTasks(missedTasks.filter(task => task.id !== taskId));
      setTodayTasks(todayTasks.filter(task => task.id !== taskId));
      setTomorrowTasks(tomorrowTasks.filter(task => task.id !== taskId));
      setCompletedTasks(completedTasks.filter(task => task.id !== taskId));
      
      toast({
        title: 'Task Deleted',
        description: 'Task has been removed',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Start rescheduling a task
  const startReschedule = (taskId: string) => {
    setIsRescheduling(taskId);
  };

  // Complete rescheduling a task
  const completeReschedule = async (date: Date) => {
    if (!isRescheduling || !user?.id) return;
    
    try {
      const updatedTask = await rescheduleTask(isRescheduling, date);
      
      if (!updatedTask) {
        throw new Error('Failed to reschedule task');
      }
      
      // Refresh all tasks to ensure proper categorization
      const organizedTasks = await getOrganizedTasks(user.id);
      
      setMissedTasks(organizedTasks.missed);
      setTodayTasks(organizedTasks.today);
      setTomorrowTasks(organizedTasks.tomorrow);
      setCompletedTasks(organizedTasks.completed);
      
      setIsRescheduling(null);
      
      toast({
        title: 'Task Rescheduled',
        description: `Task moved to ${format(date, 'PP')}`,
      });
    } catch (error) {
      console.error('Error rescheduling task:', error);
      toast({
        title: 'Reschedule Failed',
        description: 'Failed to reschedule task. Please try again.',
        variant: 'destructive'
      });
    }
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
  const handleDrop = async (columnType: ColumnType) => {
    if (!draggedTask || !user?.id) return;
    
    let task: Task | undefined;
    let newDate: Date;
    let shouldComplete = false;
    
    // Find the task in any of the columns
    task = 
      missedTasks.find(t => t.id === draggedTask) ||
      todayTasks.find(t => t.id === draggedTask) ||
      tomorrowTasks.find(t => t.id === draggedTask) ||
      completedTasks.find(t => t.id === draggedTask);
    
    if (!task) return;
    
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
        newDate = new Date(task.date); // Keep current date
        break;
      default:
        newDate = new Date(); // Default to today
    }
    
    try {
      let success = false;
      
      if (shouldComplete) {
        // Toggle completion status
        const updatedTask = await toggleTaskCompletionService(draggedTask, true);
        success = !!updatedTask;
      } else {
        // Reschedule task
        const updatedTask = await rescheduleTask(draggedTask, newDate);
        success = !!updatedTask;
      }
      
      if (!success) {
        throw new Error('Failed to update task');
      }
      
      // Refresh all tasks
      const organizedTasks = await getOrganizedTasks(user.id);
      
      setMissedTasks(organizedTasks.missed);
      setTodayTasks(organizedTasks.today);
      setTomorrowTasks(organizedTasks.tomorrow);
      setCompletedTasks(organizedTasks.completed);
      
      setDraggedTask(null);
      
      toast({
        title: shouldComplete ? 'Task Completed' : 'Task Moved',
        description: shouldComplete 
          ? `"${task.text}" marked as completed` 
          : `"${task.text}" moved to ${format(newDate, 'PP')}`,
      });
    } catch (error) {
      console.error('Error handling task drop:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <main className="flex-1 py-8 flex flex-col items-center bg-background">
        <div className="max-w-[872px] w-full px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="shadow-md h-[400px] flex flex-col">
                <CardHeader className="pb-2">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden p-2">
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse mb-2"></div>
                    <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 py-8 flex flex-col items-center bg-background">
        <div className="max-w-[872px] w-full px-4">
          <div className="flex items-center justify-center h-[500px]">
            <p className="text-muted-foreground text-lg">
              Please sign in to manage your tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8 flex flex-col items-center bg-background">
      <div className="max-w-[872px] w-full px-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <TaskColumn 
            title="Missed Tasks" 
            tasks={missedTasks} 
            onToggleComplete={handleToggleTaskCompletion}
            onDeleteTask={handleDeleteTask}
            onRescheduleTask={startReschedule}
            color="destructive"
            columnType="missed"
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
          
          <TaskColumn 
            title="Today's Tasks" 
            tasks={todayTasks}
            onToggleComplete={handleToggleTaskCompletion}
            onDeleteTask={handleDeleteTask}
            onRescheduleTask={startReschedule}
            color="primary"
            columnType="today"
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
          
          <TaskColumn 
            title="Tomorrow's Tasks" 
            tasks={tomorrowTasks}
            onToggleComplete={handleToggleTaskCompletion}
            onDeleteTask={handleDeleteTask}
            onRescheduleTask={startReschedule}
            color="accent"
            columnType="tomorrow"
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />

          <TaskColumn 
            title="Completed Tasks" 
            tasks={completedTasks}
            onToggleComplete={handleToggleTaskCompletion}
            onDeleteTask={handleDeleteTask}
            onRescheduleTask={startReschedule}
            color="success"
            columnType="completed"
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
      </div>
    </main>
  );
} 