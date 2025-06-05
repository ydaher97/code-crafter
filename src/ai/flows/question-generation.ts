
'use server';

/**
 * @fileOverview Question generation flow.
 *
 * This file defines a Genkit flow that generates coding or conceptual questions (or both)
 * and corresponding hints based on a specified topic, difficulty, and preferred question type.
 * It exports the QuestionGenerationInput and QuestionGenerationOutput types, as well as the
 * generateQuestion function to call the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestionGenerationInputSchema = z.object({
  topic: z.string().describe('The coding topic for which to generate a question.'),
  difficulty: z
    .enum(['Beginner', 'Intermediate', 'Advanced'])
    .describe('The difficulty level of the question.'),
  preferredQuestionType: z.enum(["coding", "conceptual", "any"]).describe("The user's preferred type of question. 'any' means both types should be generated.")
});
export type QuestionGenerationInput = z.infer<typeof QuestionGenerationInputSchema>;

const QuestionGenerationOutputSchema = z.object({
  codingQuestion: z.string().optional().describe('The coding question, if generated.'),
  codingHint: z.string().optional().describe('Hint for the coding question, if generated.'),
  conceptualQuestion: z.string().optional().describe('The conceptual question, if generated.'),
  conceptualHint: z.string().optional().describe('Hint for the conceptual question, if generated.'),
  questionTypeGenerated: z.enum(['coding', 'conceptual', 'both']).describe('Specifies if a coding, conceptual, or both types of questions were successfully generated.'),
});
export type QuestionGenerationOutput = z.infer<typeof QuestionGenerationOutputSchema>;


// Internal schema for the prompt that generates a single question type
const SingleQuestionPromptInputSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    questionTypeToGenerate: z.enum(['coding', 'conceptual']),
});

const SingleQuestionPromptOutputSchema = z.object({
    question: z.string().describe('The generated question.'),
    hint: z.string().describe('A concise, actionable hint for the generated question.'),
});

const generateSingleQuestionPrompt = ai.definePrompt({
  name: 'generateSingleQuestionPrompt',
  input: { schema: SingleQuestionPromptInputSchema },
  output: { schema: SingleQuestionPromptOutputSchema },
  prompt: `You are an AI expert in generating {{questionTypeToGenerate}} questions and helpful hints for different skill levels.

  Based on the topic, difficulty, and the required question type ({{questionTypeToGenerate}}), generate:
  1. A specific {{questionTypeToGenerate}} question.
  2. A single, concise, actionable hint for that question. The hint should help the user identify a key concept, suggest a general approach, or point towards a relevant language feature or pitfall. For conceptual questions, the hint might point towards key areas to research or consider. **Crucially, the hint must not give away the direct solution or include any code snippets.** Focus on guiding the user's thinking process.

  Topic: {{{topic}}}
  Difficulty: {{{difficulty}}}

  Provide the question and the hint according to the output schema.
  Ensure the question is distinct and appropriate for the specified type.
  `,
});


export async function generateQuestion(input: QuestionGenerationInput): Promise<QuestionGenerationOutput> {
  return generateQuestionFlow(input);
}

const generateQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuestionFlow',
    inputSchema: QuestionGenerationInputSchema,
    outputSchema: QuestionGenerationOutputSchema,
  },
  async (input: QuestionGenerationInput): Promise<QuestionGenerationOutput> => {
    if (input.preferredQuestionType === 'coding') {
      const { output } = await generateSingleQuestionPrompt({
        topic: input.topic,
        difficulty: input.difficulty,
        questionTypeToGenerate: 'coding',
      });
      if (!output) throw new Error('Failed to generate coding question.');
      return {
        codingQuestion: output.question,
        codingHint: output.hint,
        questionTypeGenerated: 'coding',
      };
    } else if (input.preferredQuestionType === 'conceptual') {
      const { output } = await generateSingleQuestionPrompt({
        topic: input.topic,
        difficulty: input.difficulty,
        questionTypeToGenerate: 'conceptual',
      });
      if (!output) throw new Error('Failed to generate conceptual question.');
      return {
        conceptualQuestion: output.question,
        conceptualHint: output.hint,
        questionTypeGenerated: 'conceptual',
      };
    } else { // 'any', meaning user selected "Both"
      const [codingResponse, conceptualResponse] = await Promise.all([
        generateSingleQuestionPrompt({
          topic: input.topic,
          difficulty: input.difficulty,
          questionTypeToGenerate: 'coding',
        }),
        generateSingleQuestionPrompt({
          topic: input.topic,
          difficulty: input.difficulty,
          questionTypeToGenerate: 'conceptual',
        }),
      ]);
      
      if (!codingResponse.output || !conceptualResponse.output) {
        throw new Error('Failed to generate one or both question types.');
      }

      return {
        codingQuestion: codingResponse.output.question,
        codingHint: codingResponse.output.hint,
        conceptualQuestion: conceptualResponse.output.question,
        conceptualHint: conceptualResponse.output.hint,
        questionTypeGenerated: 'both',
      };
    }
  }
);
