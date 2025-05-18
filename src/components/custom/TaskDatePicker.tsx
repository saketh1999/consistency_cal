'use client';

import { FC, useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CalendarPlus, CalendarIcon } from 'lucide-react';

interface TaskDatePickerProps {
  onAddTask?: (text: string, date: Date) => void;
  onSelectDate?: (date: Date) => void;
  buttonLabel?: string;
  defaultDate?: Date;
}

const TaskDatePicker: FC<TaskDatePickerProps> = ({ 
  onAddTask, 
  onSelectDate,
  buttonLabel = "Add Task",
  defaultDate = new Date()
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [taskText, setTaskText] = useState('');

  const handleSelectDate = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    
    // If we're just selecting a date (for rescheduling)
    if (onSelectDate && selectedDate) {
      onSelectDate(selectedDate);
      setIsOpen(false);
    }
  };

  const handleAddTask = () => {
    if (taskText.trim() && date && onAddTask) {
      onAddTask(taskText.trim(), date);
      setTaskText('');
      setDate(defaultDate);
      setIsOpen(false);
    }
  };

  return onAddTask ? (
    // Full dialog with task input and date picker
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <CalendarPlus className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-medium">Task Description</Label>
            <Input
              id="task"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Enter task description"
              className="w-full"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Task Date</Label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-md" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleSelectDate}
                  initialFocus
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleAddTask} 
            disabled={!taskText.trim() || !date}
            className="bg-primary hover:bg-primary/90"
          >
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : (
    // Simple date picker for rescheduling
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-card hover:bg-muted">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-md" align="center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate}
          initialFocus
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
};

export default TaskDatePicker; 