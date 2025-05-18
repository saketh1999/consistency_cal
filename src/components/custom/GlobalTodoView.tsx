'use client';

import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecksIcon, Trash2Icon, PlusCircleIcon } from 'lucide-react';
import { type TodoItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface GlobalTodoViewProps {
  todos: TodoItem[];
  onTodosChange: (todos: TodoItem[]) => void;
}

const GlobalTodoView: FC<GlobalTodoViewProps> = ({ todos, onTodosChange }) => {
  const [newTodoText, setNewTodoText] = useState('');
  const { toast } = useToast();

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const updatedTodos = [...todos, { id: Date.now().toString(), text: newTodoText, completed: false }];
      onTodosChange(updatedTodos);
      setNewTodoText('');
      toast({ title: "Global Todo Added", description: "Your global todo has been added." });
    }
  };

  const handleToggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    onTodosChange(updatedTodos);
  };

  const handleRemoveTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    onTodosChange(updatedTodos);
    toast({ title: "Global Todo Removed", description: "The global todo has been removed." });
  };

  // Count completed and remaining todos
  const completedCount = todos.filter(t => t.completed).length;
  const remainingCount = todos.length - completedCount;

  return (
    <Card className="shadow-lg h-full flex flex-col bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <ListChecksIcon className="h-5 w-5 mr-2" />
          Global Todo List
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow overflow-hidden p-4">
        <Label htmlFor="globalTodoInput" className="flex items-center gap-2 font-medium text-primary">
          <span>Always Available Todos</span>
          <div className="flex text-xs space-x-2">
            <span className="text-green-500">{completedCount} completed</span>
            <span>•</span>
            <span className={remainingCount > 0 ? "text-amber-500" : "text-muted-foreground"}>
              {remainingCount} remaining
            </span>
          </div>
        </Label>
        
        <div className="flex gap-2">
          <Input
            id="globalTodoInput"
            type="text"
            placeholder="Add a new global task..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            className="flex-grow bg-input text-foreground placeholder-muted-foreground"
          />
          <Button 
            onClick={handleAddTodo} 
            variant="outline" 
            size="icon" 
            aria-label="Add global todo"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <PlusCircleIcon className="h-5 w-5" />
          </Button>
        </div>
        
        <Separator className="my-2" />
        
        {todos.length > 0 ? (
          <ScrollArea className="h-[calc(100%-60px)] rounded-md border border-border p-3 bg-background/30">
            <div className="space-y-2 pr-4">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted/20 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`global-todo-${todo.id}`}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      aria-label={todo.text}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <label
                      htmlFor={`global-todo-${todo.id}`}
                      className={cn(
                        "text-sm cursor-pointer",
                        todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {todo.text}
                    </label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveTodo(todo.id)} 
                    aria-label="Remove global todo"
                  >
                    <Trash2Icon className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListChecksIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No global tasks yet. Add some!</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground w-full text-center">
          Global todos will appear across all calendar days
        </p>
      </CardFooter>
    </Card>
  );
};

export default GlobalTodoView; 