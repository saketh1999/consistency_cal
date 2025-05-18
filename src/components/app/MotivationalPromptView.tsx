'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SparklesIcon, BrainIcon } from 'lucide-react';
import { generateMotivationalPrompt } from '@/ai/flows/generate-motivational-prompt';
import type { FitnessGoals } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorageUtils';

const FITNESS_GOALS_KEY = 'fitPlanCanvasGoals';

interface MotivationalPromptViewProps {
  currentJournalNotes: string | undefined;
}

const MotivationalPromptView: FC<MotivationalPromptViewProps> = ({ currentJournalNotes }) => {
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedGoals = loadFromLocalStorage<FitnessGoals>(FITNESS_GOALS_KEY, {});
    if (storedGoals.goals) {
      setFitnessGoals(storedGoals.goals);
    }
  }, []);

  const handleSaveGoals = () => {
    saveToLocalStorage<FitnessGoals>(FITNESS_GOALS_KEY, { goals: fitnessGoals });
    toast({ title: "Goals Saved!", description: "Your fitness goals have been updated." });
  };

  const handleGeneratePrompt = async () => {
    if (!fitnessGoals.trim()) {
      toast({
        title: "Goals Missing",
        description: "Please set your fitness goals first.",
        variant: "destructive",
      });
      return;
    }
    if (!currentJournalNotes?.trim()) {
      toast({
        title: "Journal Empty",
        description: "Please add some notes to your journal for today.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setMotivationalMessage('');
    try {
      const result = await generateMotivationalPrompt({
        fitnessGoals,
        journalEntry: currentJournalNotes,
      });
      setMotivationalMessage(result.motivationalMessage);
      toast({ title: "Motivation Served!", description: "Here's a fresh dose of inspiration." });
    } catch (error) {
      console.error('Error generating motivational prompt:', error);
      setMotivationalMessage('Sorry, I couldn\'t generate a prompt right now. Please try again.');
      toast({
        title: "Error",
        description: "Failed to generate motivational prompt.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <BrainIcon className="h-6 w-6 text-primary" />
          Dynamic Inspiration Engine
        </CardTitle>
        <CardDescription>Set your goals and get AI-powered motivation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow overflow-y-auto p-4 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="fitnessGoals" className="font-medium">Your Fitness Goals</Label>
          <Textarea
            id="fitnessGoals"
            placeholder="e.g., Lose 10 pounds, run a 5k, build muscle"
            value={fitnessGoals}
            onChange={(e) => setFitnessGoals(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button onClick={handleSaveGoals} variant="outline" size="sm" className="mt-2">Save Goals</Button>
        </div>
        
        <Button onClick={handleGeneratePrompt} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
          <SparklesIcon className="mr-2 h-5 w-5" />
          {isLoading ? 'Generating...' : 'Get Today\'s Motivation'}
        </Button>

        {motivationalMessage && (
          <Card className="bg-primary/10 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Your Daily Boost!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{motivationalMessage}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Motivation is based on your set goals and today's journal entry.
        </p>
      </CardFooter>
    </Card>
  );
};

export default MotivationalPromptView;
