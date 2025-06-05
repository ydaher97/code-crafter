
'use server';
/**
 * @fileOverview Generates a solution and explanation for a given challenge.
 *
 * - generateSolution - A function that generates a solution.
 * - SolutionGenerationInput - The input type for the generateSolution function.
 * - SolutionGenerationOutput - The return type for the generateSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolutionGenerationInputSchema = z.object({
  topic: z.string().describe('The topic of the challenge.'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The difficulty level of the challenge.'),
  question: z.string().describe('The question that was asked.'),
  questionType: z.enum(['coding', 'conceptual']).describe('The type of question (coding or conceptual).'),
});
export type SolutionGenerationInput = z.infer<typeof SolutionGenerationInputSchema>;

const SolutionGenerationOutputSchema = z.object({
  solution: z.string().describe('The well-explained solution to the question. For coding questions, this should be runnable code. For conceptual questions, this should be a detailed explanation.'),
  explanation: z.string().describe('A brief explanation of the key concepts or steps in the solution.'),
});
export type SolutionGenerationOutput = z.infer<typeof SolutionGenerationOutputSchema>;

export async function generateSolution(input: SolutionGenerationInput): Promise<SolutionGenerationOutput> {
  return solutionGenerationFlow(input);
}

const solutionGenerationPrompt = ai.definePrompt({
  name: 'solutionGenerationPrompt',
  input: {schema: SolutionGenerationInputSchema},
  output: {schema: SolutionGenerationOutputSchema},
  prompt: `You are an expert programming tutor. Provide a clear, correct, and well-explained solution for the following challenge.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Question Type: {{{questionType}}}
Question:
{{{question}}}

Instructions:
- If the questionType is "coding":
  - Provide runnable code that correctly solves the problem.
  - The code should follow best practices for the given topic and difficulty.
  - The 'solution' field in the output should contain only the code.
  - The 'explanation' field should contain a brief explanation of the code's logic and key concepts.
- If the questionType is "conceptual":
  - Provide a comprehensive and accurate textual explanation that answers the question thoroughly in the 'solution' field.
  - Break down complex ideas into understandable parts.
  - The 'explanation' field should summarize the main points or provide context.

Structure your response according to the output schema.
`,
});

const solutionGenerationFlow = ai.defineFlow(
  {
    name: 'solutionGenerationFlow',
    inputSchema: SolutionGenerationInputSchema,
    outputSchema: SolutionGenerationOutputSchema,
  },
  async input => {
    const {output} = await solutionGenerationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a solution.');
    }
    return output;
  }
);
