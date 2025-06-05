// Implements the code grading flow.

'use server';

/**
 * @fileOverview A code grading AI agent.
 *
 * - gradeCode - A function that handles the code grading process.
 * - GradeCodeInput - The input type for the gradeCode function.
 * - GradeCodeOutput - The return type for the gradeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GradeCodeInputSchema = z.object({
  code: z.string().describe('The code to be graded.'),
  topic: z.string().describe('The topic of the code.'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The difficulty level of the topic.'),
  expectedOutput: z.string().optional().describe('The expected output of the code, if applicable.'),
});
export type GradeCodeInput = z.infer<typeof GradeCodeInputSchema>;

const GradeCodeOutputSchema = z.object({
  score: z.number().describe('The score of the code, out of 100.'),
  feedback: z.string().describe('Constructive feedback on the code.'),
  passed: z.boolean().describe('Whether the code passed or failed.'),
});
export type GradeCodeOutput = z.infer<typeof GradeCodeOutputSchema>;

export async function gradeCode(input: GradeCodeInput): Promise<GradeCodeOutput> {
  return gradeCodeFlow(input);
}

const gradeCodePrompt = ai.definePrompt({
  name: 'gradeCodePrompt',
  input: {schema: GradeCodeInputSchema},
  output: {schema: GradeCodeOutputSchema},
  prompt: `You are an AI code reviewer. Grade the following code based on correctness, efficiency, and style.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Code:
\`\`\`
{{{code}}}
\`\`\`

{% if expectedOutput %}Expected Output:
\`\`\`
{{{expectedOutput}}}
\`\`\`
{% endif %}

Provide a score out of 100, feedback, and a pass/fail status.
Ensure the feedback is constructive and helps the user improve their coding skills.

Consider edge cases, error handling, and overall code quality.

Output the score, feedback, and passed status as a JSON object.
`,
});

const gradeCodeFlow = ai.defineFlow(
  {
    name: 'gradeCodeFlow',
    inputSchema: GradeCodeInputSchema,
    outputSchema: GradeCodeOutputSchema,
  },
  async input => {
    const {output} = await gradeCodePrompt(input);
    return output!;
  }
);
