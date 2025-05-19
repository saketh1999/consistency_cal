'use server';

/**
 * @fileOverview Legacy compatibility layer for motivational prompt generation.
 * 
 * This file is kept for compatibility with existing code but no longer 
 * generates AI-powered motivational messages. The functionality has been 
 * replaced with user-managed quotes.
 */

import {z} from 'genkit';

// Keep the input/output types for compatibility
const GenerateMotivationalPromptInputSchema = z.object({
  fitnessGoals: z
    .string()
    .describe('The user\s fitness goals, e.g., lose weight, gain muscle, improve endurance.'),
  journalEntry: z
    .string()
    .describe('The user\s journal entry for the day, including exercises, diet, and feelings.'),
});

export type GenerateMotivationalPromptInput = z.infer<
  typeof GenerateMotivationalPromptInputSchema
>;

const GenerateMotivationalPromptOutputSchema = z.object({
  motivationalMessage: z
    .string()
    .describe('A motivational message based on the user\s fitness goals and journal entry.'),
});

export type GenerateMotivationalPromptOutput = z.infer<
  typeof GenerateMotivationalPromptOutputSchema
>;

// Provide a compatibility implementation that returns a fixed message
export async function generateMotivationalPrompt(
  _input: GenerateMotivationalPromptInput
): Promise<GenerateMotivationalPromptOutput> {
  return {
    motivationalMessage: "This feature has been replaced with user-managed quotes. Please use the new quote management system instead."
  };
} 