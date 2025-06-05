// src/ai/flows/topic-generation.ts
'use server';
/**
 * @fileOverview A flow that generates a programming topic based on the user's chosen difficulty level.
 *
 * - generateTopic - A function that generates a programming topic.
 * - TopicGenerationInput - The input type for the generateTopic function.
 * - TopicGenerationOutput - The return type for the generateTopic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TopicGenerationInputSchema = z.object({
  difficulty: z
    .enum(['Beginner', 'Intermediate', 'Advanced'])
    .describe('The difficulty level chosen by the user.'),
});
export type TopicGenerationInput = z.infer<typeof TopicGenerationInputSchema>;

const TopicGenerationOutputSchema = z.object({
  topic: z.string().describe('A relevant programming topic for the chosen difficulty level.'),
});
export type TopicGenerationOutput = z.infer<typeof TopicGenerationOutputSchema>;

export async function generateTopic(input: TopicGenerationInput): Promise<TopicGenerationOutput> {
  return generateTopicFlow(input);
}

const topicPrompt = ai.definePrompt({
  name: 'topicPrompt',
  input: {schema: TopicGenerationInputSchema},
  output: {schema: TopicGenerationOutputSchema},
  prompt: `You are a programming tutor. Suggest a relevant and specific programming topic suitable for a user with the following difficulty level: {{{difficulty}}}. 
The topic should be something that the user can learn and practice with coding or conceptual questions. 
Focus on a single, concrete topic. For example, for 'Beginner' JavaScript, suggest 'JavaScript Array Methods like .map() or .filter()' rather than just 'JavaScript Arrays'.
For 'Intermediate' Python, suggest 'Python Decorators' or 'Working with JSON in Python' rather than just 'Python Functions'.

Topic:`,
});

const generateTopicFlow = ai.defineFlow(
  {
    name: 'generateTopicFlow',
    inputSchema: TopicGenerationInputSchema,
    outputSchema: TopicGenerationOutputSchema,
  },
  async input => {
    const {output} = await topicPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a topic.');
    }
    return output;
  }
);
