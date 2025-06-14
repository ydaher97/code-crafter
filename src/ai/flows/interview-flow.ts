// src/ai/flows/interview-flow.ts
'use server';
/**
 * @fileOverview An AI flow for conducting an interview.
 *
 * - conductInterviewTurn - A function that handles one turn of the interview.
 * - InterviewTurnInput - The input type for the conductInterviewTurn function.
 * - InterviewTurnOutput - The return type for the conductInterviewTurn function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe("The role of the speaker, 'user' for the interviewee, 'model' for the AI interviewer."),
  parts: z.array(z.object({ text: z.string() })).describe("The content of the message."),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

const InterviewTurnInputSchema = z.object({
  topic: z.string().describe('The topic of the interview.'),
  difficulty: z
    .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .describe('The difficulty level of the interview.'),
  conversationHistory: z
    .array(ConversationMessageSchema)
    .describe(
      'The history of the conversation so far. The AI will use this to ask relevant follow-up questions or new questions.'
    ),
});
export type InterviewTurnInput = z.infer<typeof InterviewTurnInputSchema>;

const InterviewTurnOutputSchema = z.object({
  aiResponseText: z
    .string()
    .describe("The AI interviewer's next question or statement."),
  // We can add isEndOfInterview: z.boolean().optional() later
});
export type InterviewTurnOutput = z.infer<typeof InterviewTurnOutputSchema>;

export async function conductInterviewTurn(
  input: InterviewTurnInput
): Promise<InterviewTurnOutput> {
  return interviewTurnFlow(input);
}

const interviewTurnPrompt = ai.definePrompt({
  name: 'interviewTurnPrompt',
  input: {schema: InterviewTurnInputSchema},
  output: {schema: InterviewTurnOutputSchema},
  prompt: `You are an expert AI interviewer conducting an interview on the topic: {{{topic}}} at the {{{difficulty}}} level.
Your goal is to assess the candidate's knowledge and problem-solving skills.
Ask one clear and concise question at a time.
If the conversation history is empty, start with an appropriate opening question for the given topic and difficulty.
Based on the candidate's previous answer (if any, from the conversation history), ask a relevant follow-up question or a new question.
Keep the interview flowing naturally. Do not greet again if conversation history is present.
Do not provide feedback on the answers during the interview itself, just ask the next question.
Focus on assessing the candidate.

Conversation History:
{{#if conversationHistory.length}}
  {{#each conversationHistory}}
    {{#if (eq this.role "model")}}Interviewer: {{this.parts.0.text}}{{/if}}
    {{#if (eq this.role "user")}}Candidate: {{this.parts.0.text}}{{/if}}
  {{/each}}
{{else}}
(No conversation history yet. This is the start of the interview.)
{{/if}}

Based on the above, what is your next question for the candidate?
`,
});

const interviewTurnFlow = ai.defineFlow(
  {
    name: 'interviewTurnFlow',
    inputSchema: InterviewTurnInputSchema,
    outputSchema: InterviewTurnOutputSchema,
  },
  async input => {
    const {output} = await interviewTurnPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate an interview question.');
    }
    return output;
  }
);