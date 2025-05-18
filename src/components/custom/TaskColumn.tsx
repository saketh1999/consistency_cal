'use client';

import { FC, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarIcon, 
  MoreHorizontal, 
  CheckCircle, 
  Trash2Icon,
  CalendarDays,
  MoveIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, ColumnType } from '@/app/tasks/page';
import { cn } from '@/lib/utils';

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  color?: "primary" | "accent" | "destructive" | "success" | "default";
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onRescheduleTask: (taskId: string) => void;
  columnType: ColumnType;
  onDragStart: (taskId: string) => void;
  onDrop: (columnType: ColumnType) => void;
}

const TaskColumn: FC<TaskColumnProps> = ({ 
  title, 
  tasks, 
  color = "default",
  onToggleComplete,
  onDeleteTask,
  onRescheduleTask,
  columnType,
  onDragStart,
  onDrop
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Color mappings for different task types
  const colorClasses = {
    primary: "border-primary/40 bg-primary/5",
    accent: "border-accent/40 bg-accent/5",
    destructive: "border-destructive/40 bg-destructive/5",
    success: "border-green-600/40 bg-green-50 dark:bg-green-950/20",
    default: "border-border bg-card"
  };

  const titleColorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
    success: "text-green-600 dark:text-green-500",
    default: "text-foreground"
  };

  const dragOverClasses = {
    primary: "ring-2 ring-primary shadow-md",
    accent: "ring-2 ring-accent shadow-md",
    destructive: "ring-2 ring-destructive shadow-md",
    success: "ring-2 ring-success shadow-md",
    default: "ring-2 ring-foreground shadow-md"
  };

  // Handle drag over to prevent default behavior
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(columnType);
  };

  return (
    <Card 
      className={cn(
        "shadow-md h-full flex flex-col transition-all", 
        colorClasses[color],
        isDragOver && dragOverClasses[color]
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-lg font-semibold flex justify-between items-center", titleColorClasses[color])}>
          <span>{title}</span>
          <span className="text-sm font-normal bg-background/90 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-2">
        {tasks.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "p-3 rounded-md transition-colors",
                    "border border-border/50 bg-card",
                    "hover:bg-muted/10",
                    "cursor-grab active:cursor-grabbing"
                  )}
                  draggable
                  onDragStart={() => onDragStart(task.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => onToggleComplete(task.id)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <p className={cn(
                          "text-sm font-medium",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.text}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>{format(parseISO(task.date), 'PP')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MoveIcon className="h-4 w-4 mr-1 text-muted-foreground opacity-50" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Task actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onToggleComplete(task.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as {task.completed ? 'incomplete' : 'complete'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRescheduleTask(task.id)}>
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteTask(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2Icon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
            <p>No tasks</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskColumn; 