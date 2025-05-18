'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageIcon, GripVertical, XCircleIcon, UploadCloudIcon, Loader2 } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { uploadImage, getDailyImages, deleteImage, saveDailyEntry } from '@/lib/services/dailyEntriesService';

interface ImageUploadModuleProps {
  selectedDate: Date;
  userId: string;
  dailyEntryId?: string;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  defaultOpen?: boolean;
  initialExpanded?: boolean;
}

const ImageUploadModule = ({ 
  selectedDate,
  userId,
  dailyEntryId,
  imageUrls,
  setImageUrls,
  defaultOpen = true,
  initialExpanded = true
}: ImageUploadModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [images, setImages] = useState<Array<{ id: string, url: string }>>([]);

  // Load images when component mounts or dailyEntryId changes
  useEffect(() => {
    async function fetchImages() {
      if (!dailyEntryId) return;

      try {
        const loadedImages = await getDailyImages(dailyEntryId);
        setImages(loadedImages.map(img => ({ id: img.id, url: img.url })));
        setImageUrls(loadedImages.map(img => img.url));
      } catch (error) {
        console.error('Error loading images:', error);
        toast({
          title: "Error",
          description: "Failed to load images. Please refresh and try again.",
          variant: "destructive",
        });
      }
    }
    
    fetchImages();
  }, [dailyEntryId, setImageUrls, toast]);

  // Process and upload image file
  const processImageFile = useCallback(async (file: File) => {
    if (!file || !selectedDate || !userId) return;
    
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
    
    setIsProcessingImages(true);
    
    try {
      // If no daily entry exists yet, create one
      let entryId = dailyEntryId;
      
      if (!entryId) {
        const newEntry = await saveDailyEntry(
          selectedDate, 
          userId, 
          {
            notes: '',
            videoUrls: [],
            importantEvents: '',
          }
        );
        
        if (!newEntry) {
          throw new Error('Failed to create entry');
        }
        
        entryId = newEntry.id;
      }
      
      // Upload the image
      const imageEntry = await uploadImage(file, entryId, userId);
      
      if (!imageEntry) {
        throw new Error('Failed to upload image');
      }
      
      // Update the UI
      setImages([...images, { id: imageEntry.id, url: imageEntry.url }]);
      setImageUrls([...imageUrls, imageEntry.url]);
      
      toast({
        title: "Image Uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImages(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [selectedDate, userId, dailyEntryId, images, imageUrls, setImageUrls, toast]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset the input value to allow uploading the same file again
    if (event.target && event.target.value) {
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToDelete = images[index];
    if (!imageToDelete) return;
    
    try {
      const success = await deleteImage(imageToDelete.id);
      
      if (success) {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
        
        const newUrls = [...imageUrls];
        newUrls.splice(index, 1);
        setImageUrls(newUrls);
        
        toast({ 
          title: "Image Removed", 
          description: "The image has been deleted successfully." 
        });
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type.startsWith('image/')) {
        processImageFile(files[0]);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please drop an image file.",
          variant: "destructive",
        });
      }
      e.dataTransfer.clearData();
    }
  };

  const handleDropzoneClick = () => {
    if (fileInputRef.current && !isProcessingImages) {
      fileInputRef.current.click();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <Label htmlFor="imageUploadTrigger" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
            <ImageIcon className="h-5 w-5" />
            Images ({imageUrls.length})
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
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-border shadow-sm flex flex-col items-center justify-center bg-muted/30 p-4 transition-all duration-200",
              isDraggingOver && "border-primary ring-2 ring-primary shadow-lg",
              "min-h-[150px] cursor-pointer hover:bg-muted/50 hover:border-primary/60"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleDropzoneClick}
            role="button"
            tabIndex={0}
            aria-label="Upload image by clicking or dragging and dropping"
          >
            {isProcessingImages ? (
              <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                <Loader2 className="h-12 w-12 mb-2 text-primary animate-spin" />
                <p className="text-sm font-medium text-primary">Processing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                <UploadCloudIcon className={cn("h-12 w-12 mb-2", isDraggingOver ? "text-primary" : "text-muted-foreground/70")} />
                <p className={cn("text-sm font-medium", isDraggingOver ? "text-primary" : "text-muted-foreground/90")}>
                  {isDraggingOver ? "Drop image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground/70">Max 5MB per image</p>
              </div>
            )}
          </div>
          
          <Input
            id="imageUpload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            disabled={isProcessingImages}
          />
          
          <Button
            id="imageUploadTrigger"
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            disabled={isProcessingImages}
          >
            <ImageIcon className="mr-2 h-4 w-4" /> Add Image
          </Button>

          {imageUrls.length > 0 && (
            <ScrollArea className="max-h-60">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-[3/2]">
                    <Image
                      src={url}
                      alt={`Uploaded content ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="rounded-md border border-border object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://placehold.co/150x100.png?text=Invalid`;
                        toast({title: "Image Load Error", description: "Could not display an uploaded image.", variant: "destructive"})
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-destructive/80 border-destructive/50"
                      disabled={isProcessingImages}
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ImageUploadModule; 