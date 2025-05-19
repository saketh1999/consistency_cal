'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QuoteIcon, ImageIcon, PlusCircleIcon, XCircleIcon, BookOpenIcon, CloudIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { format } from 'date-fns';
import type { MotivationalQuote } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserQuotes, saveQuote, updateQuote, deleteQuote, importQuotesToDatabase } from '@/lib/services/quotesService';

const QUOTES_STORAGE_KEY = 'userMotivationalQuotes';

interface MotivationalPromptViewProps {
  currentJournalNotes: string | undefined;
}

const MotivationalPromptView: FC<MotivationalPromptViewProps> = ({ currentJournalNotes }) => {
  const [quotes, setQuotes] = useState<MotivationalQuote[]>([]);
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<MotivationalQuote | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load stored quotes on mount
  useEffect(() => {
    async function loadQuotes() {
      setIsLoading(true);
      
      // First load from localStorage
      const storedQuotes = loadFromLocalStorage<MotivationalQuote[]>(QUOTES_STORAGE_KEY, []);
      
      try {
        // If user is authenticated, load from database
        if (user?.id) {
          const dbQuotes = await getUserQuotes(user.id);
          if (dbQuotes.length > 0) {
            setQuotes(dbQuotes);
            
            // If localStorage has quotes but database doesn't, offer to import
            if (storedQuotes.length > 0 && dbQuotes.length === 0) {
              toast({
                title: "Local quotes found",
                description: "You have quotes stored locally. Would you like to import them to your account?",
                action: (
                  <Button 
                    variant="outline"
                    onClick={() => handleImportLocalQuotes(storedQuotes)}
                  >
                    Import
                  </Button>
                )
              });
            }
            
            // Select a random quote if any exist
            if (dbQuotes.length > 0) {
              const randomIndex = Math.floor(Math.random() * dbQuotes.length);
              setSelectedQuote(dbQuotes[randomIndex]);
            }
          } else {
            // No DB quotes, use localStorage quotes
            setQuotes(storedQuotes);
            
            if (storedQuotes.length > 0) {
              const randomIndex = Math.floor(Math.random() * storedQuotes.length);
              setSelectedQuote(storedQuotes[randomIndex]);
            }
          }
        } else {
          // No user, use localStorage quotes
          setQuotes(storedQuotes);
          
          if (storedQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * storedQuotes.length);
            setSelectedQuote(storedQuotes[randomIndex]);
          }
        }
      } catch (error) {
        console.error("Error loading quotes:", error);
        // Fallback to localStorage
        setQuotes(storedQuotes);
        
        if (storedQuotes.length > 0) {
          const randomIndex = Math.floor(Math.random() * storedQuotes.length);
          setSelectedQuote(storedQuotes[randomIndex]);
        }
        
        toast({
          title: "Error",
          description: "Failed to load quotes from database. Using local data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
    }
    
    loadQuotes();
  }, [user?.id, toast]);

  // Import local quotes to database
  const handleImportLocalQuotes = async (localQuotes: MotivationalQuote[]) => {
    if (!user?.id || localQuotes.length === 0 || isImporting) return;
    
    setIsImporting(true);
    
    try {
      const importedQuotes = await importQuotesToDatabase(
        localQuotes,
        user.id,
        new Date() // Associate with today's date
      );
      
      if (importedQuotes.length > 0) {
        setQuotes(prev => [...prev, ...importedQuotes]);
        toast({
          title: "Import Successful",
          description: `${importedQuotes.length} quotes have been imported to your account.`
        });
        
        // Clear localStorage
        saveToLocalStorage(QUOTES_STORAGE_KEY, []);
      } else {
        throw new Error("No quotes were imported");
      }
    } catch (error) {
      console.error("Error importing quotes:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import quotes to database.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Save quotes to storage
  const saveQuotes = async (updatedQuotes: MotivationalQuote[]) => {
    setQuotes(updatedQuotes);
    
    if (user?.id) {
      // If authenticated, don't save to localStorage
      // Database operations happen in their individual handlers
    } else {
      // If not authenticated, save to localStorage
      saveToLocalStorage(QUOTES_STORAGE_KEY, updatedQuotes);
    }
  };

  // Handle adding a new quote
  const handleAddQuote = async () => {
    if (!quoteText.trim()) {
      toast({
        title: "Quote Required",
        description: "Please enter the quote text.",
        variant: "destructive",
      });
      return;
    }

    const newQuoteData = {
      text: quoteText,
      author: quoteAuthor.trim() || undefined,
      dateAdded: new Date().toISOString(),
    };

    if (user?.id) {
      try {
        // Save to database
        const savedQuote = await saveQuote(
          newQuoteData,
          user.id,
          new Date() // Associate with today's date
        );
        
        if (savedQuote) {
          setQuotes(prev => [savedQuote, ...prev]);
          setSelectedQuote(savedQuote);
          
          toast({
            title: "Quote Added",
            description: "Your quote has been saved to your account.",
          });
        } else {
          throw new Error("Failed to save quote");
        }
      } catch (error) {
        console.error("Error saving quote:", error);
        toast({
          title: "Save Failed",
          description: "Failed to save quote to database.",
          variant: "destructive"
        });
        
        // Fallback to localStorage
        const newQuote: MotivationalQuote = {
          id: crypto.randomUUID(),
          ...newQuoteData
        };
        
        const updatedQuotes = [...quotes, newQuote];
        saveToLocalStorage(QUOTES_STORAGE_KEY, updatedQuotes);
        setQuotes(updatedQuotes);
        setSelectedQuote(newQuote);
        
        toast({
          title: "Saved Locally",
          description: "Quote saved locally as fallback.",
        });
      }
    } else {
      // Not authenticated, save to localStorage
      const newQuote: MotivationalQuote = {
        id: crypto.randomUUID(),
        ...newQuoteData
      };
      
      const updatedQuotes = [...quotes, newQuote];
      await saveQuotes(updatedQuotes);
      setSelectedQuote(newQuote);
      
      toast({
        title: "Quote Added",
        description: "Your quote has been saved locally.",
      });
    }
    
    // Clear form and close it
    setQuoteText('');
    setQuoteAuthor('');
    setIsAddingQuote(false);
  };

  // Handle deleting a quote
  const handleDeleteQuote = async (id: string) => {
    if (user?.id) {
      try {
        // Delete from database
        const success = await deleteQuote(id, user.id);
        
        if (success) {
          const updatedQuotes = quotes.filter(quote => quote.id !== id);
          setQuotes(updatedQuotes);
          
          // Update selected quote if the deleted one was selected
          if (selectedQuote && selectedQuote.id === id) {
            setSelectedQuote(updatedQuotes.length > 0 ? updatedQuotes[0] : null);
          }
          
          toast({
            title: "Quote Deleted",
            description: "The quote has been removed from your account.",
          });
        } else {
          throw new Error("Failed to delete quote");
        }
      } catch (error) {
        console.error("Error deleting quote:", error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete quote from database.",
          variant: "destructive"
        });
      }
    } else {
      // Not authenticated, update localStorage
      const updatedQuotes = quotes.filter(quote => quote.id !== id);
      await saveQuotes(updatedQuotes);
      
      // Update selected quote if the deleted one was selected
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote(updatedQuotes.length > 0 ? updatedQuotes[0] : null);
      }
      
      toast({
        title: "Quote Deleted",
        description: "The quote has been removed.",
      });
    }
  };

  // Handle selecting a different quote to display
  const handleSelectQuote = (quote: MotivationalQuote) => {
    setSelectedQuote(quote);
  };

  // Handle image upload for a quote
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedQuote) {
      toast({
        title: "No Quote Selected",
        description: "Please select a quote first.",
        variant: "destructive",
      });
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;
    
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
    
    // Convert image to base64 for storage
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (typeof e.target?.result === 'string' && selectedQuote) {
        const imageUrl = e.target.result as string;
        
        if (user?.id) {
          try {
            // Update in database
            const updatedQuote = await updateQuote(
              selectedQuote.id,
              { imageUrl },
              user.id
            );
            
            if (updatedQuote) {
              // Update local state
              const updatedQuotes = quotes.map(quote => 
                quote.id === selectedQuote.id ? updatedQuote : quote
              );
              
              setQuotes(updatedQuotes);
              setSelectedQuote(updatedQuote);
              
              toast({
                title: "Image Added",
                description: "Image has been attached to the quote and saved to your account.",
              });
            } else {
              throw new Error("Failed to update quote with image");
            }
          } catch (error) {
            console.error("Error updating quote with image:", error);
            toast({
              title: "Update Failed",
              description: "Failed to update quote with image in database.",
              variant: "destructive"
            });
            
            // Fallback to localStorage
            updateQuoteLocally();
          }
        } else {
          // Not authenticated, update localStorage
          updateQuoteLocally();
        }
        
        function updateQuoteLocally() {
          // Update the quote with the image URL
          const updatedQuotes = quotes.map(quote => 
            quote.id === selectedQuote.id 
              ? { ...quote, imageUrl }
              : quote
          );
          
          saveQuotes(updatedQuotes);
          
          // Update selected quote
          const updatedQuote = updatedQuotes.find(q => q.id === selectedQuote.id);
          if (updatedQuote) {
            setSelectedQuote(updatedQuote);
          }
          
          toast({
            title: "Image Added",
            description: "Image has been attached to the quote.",
          });
        }
      }
    };
    
    reader.readAsDataURL(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!selectedQuote || !selectedQuote.imageUrl) return;
    
    if (user?.id) {
      try {
        // Update in database
        const updatedQuote = await updateQuote(
          selectedQuote.id,
          { imageUrl: undefined },
          user.id
        );
        
        if (updatedQuote) {
          // Update local state
          const updatedQuotes = quotes.map(quote => 
            quote.id === selectedQuote.id ? updatedQuote : quote
          );
          
          setQuotes(updatedQuotes);
          setSelectedQuote(updatedQuote);
          
          toast({
            title: "Image Removed",
            description: "Image has been removed from the quote.",
          });
        } else {
          throw new Error("Failed to remove image from quote");
        }
      } catch (error) {
        console.error("Error removing image:", error);
        toast({
          title: "Update Failed",
          description: "Failed to remove image in database.",
          variant: "destructive"
        });
        
        // Fallback to localStorage
        removeImageLocally();
      }
    } else {
      // Not authenticated, update localStorage
      removeImageLocally();
    }
    
    function removeImageLocally() {
      const updatedQuotes = quotes.map(quote => 
        quote.id === selectedQuote.id 
          ? { ...quote, imageUrl: undefined }
          : quote
      );
      
      saveQuotes(updatedQuotes);
      
      // Update selected quote
      const updatedQuote = updatedQuotes.find(q => q.id === selectedQuote.id);
      if (updatedQuote) {
        setSelectedQuote(updatedQuote);
      }
      
      toast({
        title: "Image Removed",
        description: "Image has been removed from the quote.",
      });
    }
  };

  // Select a random quote
  const handleRandomQuote = () => {
    if (quotes.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setSelectedQuote(quotes[randomIndex]);
    
    toast({
      title: "Quote Refreshed",
      description: "Showing a random quote for inspiration.",
    });
  };

  // If not mounted yet (server-side), render a simplified version
  if (!isMounted) {
    return (
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <QuoteIcon className="h-6 w-6 text-primary" />
            My Inspirational Quotes
          </CardTitle>
          <CardDescription>Keep track of meaningful quotes you encounter</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex flex-col items-center justify-center p-4 min-h-[140px] bg-primary/5 rounded-lg text-center">
            <p className="text-muted-foreground">Loading quotes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <QuoteIcon className="h-6 w-6 text-primary" />
          My Inspirational Quotes
        </CardTitle>
        <CardDescription>
          {user ? 'Your quotes are saved to your account' : 'Sign in to save quotes to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-4 min-h-[140px] bg-primary/5 rounded-lg text-center">
            <p className="text-muted-foreground">Loading quotes...</p>
          </div>
        ) : (
          <>
            {/* Quote Display */}
            {selectedQuote ? (
              <div className="flex flex-col items-center justify-center p-4 min-h-[140px] bg-primary/5 rounded-lg text-center">
                {selectedQuote.imageUrl && (
                  <div className="relative w-full h-40 mb-4">
                    <Image 
                      src={selectedQuote.imageUrl}
                      alt="Quote image"
                      fill
                      className="object-contain rounded-md"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!selectedQuote.imageUrl && (
                  <>
                    <p className="text-lg font-medium italic mb-2">&ldquo;{selectedQuote.text}&rdquo;</p>
                    {selectedQuote.author && (
                      <p className="text-sm text-muted-foreground">- {selectedQuote.author}</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 min-h-[140px] bg-primary/5 rounded-lg text-center">
                <p className="text-muted-foreground">No quotes added yet. Add your first motivational quote!</p>
              </div>
            )}
            
            {/* Quote Management */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddingQuote(!isAddingQuote)}
                className="flex-1"
              >
                {isAddingQuote ? 'Cancel' : (
                  <>
                    <PlusCircleIcon className="mr-1 h-4 w-4" />
                    Add Quote
                  </>
                )}
              </Button>
              
              {selectedQuote && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRandomQuote}
                    className="flex-1"
                    disabled={quotes.length <= 1}
                  >
                    <BookOpenIcon className="mr-1 h-4 w-4" />
                    Random Quote
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <ImageIcon className="mr-1 h-4 w-4" />
                    {selectedQuote?.imageUrl ? 'Change Image' : 'Add Image'}
                  </Button>
                  <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </>
              )}
            </div>
            
            {/* Quote Creation Form */}
            {isAddingQuote && (
              <div className="space-y-3 p-3 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="quoteText">Quote Text</Label>
                  <Textarea
                    id="quoteText"
                    placeholder="Enter the motivational quote here..."
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quoteAuthor">Author (Optional)</Label>
                  <Input
                    id="quoteAuthor"
                    placeholder="Who said or wrote this quote?"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddQuote} 
                  className="w-full"
                >
                  Save Quote
                </Button>
              </div>
            )}
            
            {/* Quote List - Only render the ScrollArea on client side */}
            {quotes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Your Quotes ({quotes.length})</h3>
                    {user && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CloudIcon className="h-3 w-3 mr-1" />
                        <span>Synced</span>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="h-32">
                    <div className="space-y-2 pr-4">
                      {quotes.map((quote) => (
                        <div 
                          key={quote.id} 
                          className={`
                            p-2 border rounded-md flex justify-between items-center cursor-pointer hover:bg-accent/50
                            ${selectedQuote?.id === quote.id ? 'bg-primary/10 border-primary' : ''}
                          `}
                          onClick={() => handleSelectQuote(quote)}
                        >
                          <div className="flex-1 truncate">
                            <p className="truncate text-sm font-medium">{quote.text}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {quote.author && `${quote.author} • `}
                              {format(new Date(quote.dateAdded), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 ml-2 opacity-0 hover:opacity-100 group-hover:opacity-100 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuote(quote.id);
                            }}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {user ? 'Your quotes are saved to your account' : 'Sign in to save your quotes across devices'}
        </p>
      </CardFooter>
    </Card>
  );
};

export default MotivationalPromptView;
