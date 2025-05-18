// src/ai/flows/generate-motivational-prompt.ts
'use server';

/**
 * @fileOverview Generates a motivational message based on user's fitness goals and journal entries.
 *
 * - generateMotivationalPrompt - A function that generates a motivational message.
 * - GenerateMotivationalPromptInput - The input type for the generateMotivationalPrompt function.
 * - GenerateMotivationalPromptOutput - The return type for the generateMotivationalPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function generateMotivationalPrompt(
  input: GenerateMotivationalPromptInput
): Promise<GenerateMotivationalPromptOutput> {
  return generateMotivationalPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalPromptPrompt',
  input: {schema: GenerateMotivationalPromptInputSchema},
  output: {schema: GenerateMotivationalPromptOutputSchema},
  prompt: `You are a personal fitness motivation assistant. Based on the user's fitness goals and their journal entry for the day, generate a motivational message to keep them on track.

Fitness Goals: {{{fitnessGoals}}}
Journal Entry: {{{journalEntry}}}

Motivational Message:`,
});

const generateMotivationalPromptFlow = ai.defineFlow(
  {
    name: 'generateMotivationalPromptFlow',
    inputSchema: GenerateMotivationalPromptInputSchema,
    outputSchema: GenerateMotivationalPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
