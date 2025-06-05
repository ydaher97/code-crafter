// src/ai/flows/answer-grading.ts
'use server';

/**
 * @fileOverview An AI agent for grading textual answers to conceptual questions.
 *
 * - gradeAnswer - A function that handles the conceptual answer grading process.
 * - AnswerGradingInput - The input type for the gradeAnswer function.
 * - AnswerGradingOutput - The return type for the gradeAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerGradingInputSchema = z.object({
  question: z.string().describe('The conceptual question that was asked.'),
  userAnswer: z.string().describe("The user's textual answer to the question."),
  topic: z.string().describe('The topic of the question.'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The difficulty level of the topic.'),
});
export type AnswerGradingInput = z.infer<typeof AnswerGradingInputSchema>;

// Reusing the same output structure as code grading for consistency
const AnswerGradingOutputSchema = z.object({
  score: z.number().describe('The score of the answer, out of 100.'),
  feedback: z.string().describe('Constructive feedback on the answer.'),
  passed: z.boolean().describe('Whether the answer met the passing criteria (e.g., score >= 60).'),
});
export type AnswerGradingOutput = z.infer<typeof AnswerGradingOutputSchema>;

export async function gradeAnswer(input: AnswerGradingInput): Promise<AnswerGradingOutput> {
  return gradeAnswerFlow(input);
}

const gradeAnswerPrompt = ai.definePrompt({
  name: 'gradeAnswerPrompt',
  input: {schema: AnswerGradingInputSchema},
  output: {schema: AnswerGradingOutputSchema},
  prompt: `You are an AI teaching assistant. Evaluate the user's answer to the following conceptual question.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Question:
{{{question}}}

User's Answer:
{{{userAnswer}}}

Provide a score out of 100 based on correctness, clarity, and completeness.
Also, provide constructive feedback to help the user understand the topic better.
Consider a passing score to be 60 or above and set the 'passed' field accordingly.

Output the score, feedback, and passed status as a JSON object.
`,
});

const gradeAnswerFlow = ai.defineFlow(
  {
    name: 'gradeAnswerFlow',
    inputSchema: AnswerGradingInputSchema,
    outputSchema: AnswerGradingOutputSchema,
  },
  async input => {
    const {output} = await gradeAnswerPrompt(input);
    return output!;
  }
);
