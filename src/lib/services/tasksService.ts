import { supabase, Task } from '../supabase';
import { format, isPast, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';

// Fetch all tasks for a user
export async function getAllTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
    
  if (error) {
    console.error('Error fetching all tasks:', error);
    return [];
  }
  
  return data as Task[];
}

// Get tasks for a specific date
export async function getTasksByDate(date: Date, userId: string): Promise<Task[]> {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  // Get specific date tasks and global tasks
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .or('date.eq.' + dateKey + ',is_global.eq.true')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching tasks for date:', error);
    return [];
  }
  
  return data as Task[];
}

// Create a new task
export async function createTask(
  taskData: {
    text: string;
    date: Date;
    isGlobal?: boolean;
  }, 
  userId: string
): Promise<Task | null> {
  const dateKey = format(taskData.date, 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      text: taskData.text,
      date: dateKey,
      completed: false,
      completed_at: null,
      is_global: taskData.isGlobal || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();
    
  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return data as Task;
}

// Update a task
export async function updateTask(
  taskId: string, 
  updates: Partial<Task>
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  
  return data as Task;
}

// Toggle completion status
export async function toggleTaskCompletion(taskId: string, completed: boolean): Promise<Task | null> {
  const completedAt = completed ? new Date().toISOString() : null;
  
  try {
    console.log(`Toggling task ${taskId} to ${completed ? 'completed' : 'not completed'}`);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed,
        completed_at: completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating task completion:', error);
      return null;
    }
    
    return data as Task;
  } catch (err) {
    console.error('Exception in toggleTaskCompletion:', err);
    return null;
  }
}

// Delete a task
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    console.log(`Deleting task ${taskId}`);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
      
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception in deleteTask:', err);
    return false;
  }
}

// Reschedule a task to a new date
export async function rescheduleTask(taskId: string, newDate: Date): Promise<Task | null> {
  const dateKey = format(newDate, 'yyyy-MM-dd');
  
  return await updateTask(taskId, { date: dateKey });
}

// Mark a task as global (recurring daily)
export async function setTaskGlobal(taskId: string, isGlobal: boolean): Promise<Task | null> {
  return await updateTask(taskId, { is_global: isGlobal });
}

// Get filtered tasks organized by category
export async function getOrganizedTasks(userId: string): Promise<{
  missed: Task[];
  today: Task[];
  tomorrow: Task[];
  completed: Task[];
}> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching tasks for organization:', error);
    return {
      missed: [],
      today: [],
      tomorrow: [],
      completed: []
    };
  }
  
  const tasks = data as Task[];
  const today = new Date();
  
  // For global tasks, we need to handle them specially
  const globalTasks = tasks.filter(task => task.is_global);
  
  // Create synthetic instances of global tasks for today and tomorrow if they don't exist
  const globalTasksForToday = globalTasks.map(task => ({
    ...task,
    date: format(today, 'yyyy-MM-dd')
  }));
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const globalTasksForTomorrow = globalTasks.map(task => ({
    ...task,
    date: format(tomorrow, 'yyyy-MM-dd')
  }));
  
  // Combine normal tasks with global tasks
  const allTasks = [
    ...tasks.filter(task => !task.is_global),
    ...globalTasksForToday,
    ...globalTasksForTomorrow
  ];
  
  // Filter tasks into categories
  return {
    missed: allTasks.filter(task => 
      !task.completed && 
      isPast(parseISO(task.date)) && 
      !isToday(parseISO(task.date))
    ),
    today: allTasks.filter(task => 
      !task.completed && 
      isToday(parseISO(task.date))
    ),
    tomorrow: allTasks.filter(task => 
      !task.completed && 
      isTomorrow(parseISO(task.date))
    ),
    completed: allTasks.filter(task => 
      task.completed
    )
  };
} 