'use client';

import { useState, useEffect, useRef } from 'react';
import { Tag, XIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const TagInput = ({
  tags,
  onTagsChange,
  placeholder = 'Add tags...',
  disabled = false,
  className
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputBlur = () => {
    if (inputValue) {
      addTag(inputValue);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2 p-2 border rounded-md bg-background', className)}>
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium"
        >
          <Tag className="w-3 h-3" />
          <span>{tag}</span>
          {!disabled && (
            <button
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove tag ${tag}`}
            >
              <XIcon className="w-3 h-3" />
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <div className="flex items-center">
          <div className="flex-grow">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className="h-7 min-w-[120px] border-0 p-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {inputValue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => addTag(inputValue)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TagInput; 