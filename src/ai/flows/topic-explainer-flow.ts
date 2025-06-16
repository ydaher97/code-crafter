
// src/ai/flows/topic-explainer-flow.ts
'use server';
/**
 * @fileOverview An AI flow that explains a given topic with examples and a diagram description.
 *
 * - explainTopic - A function that handles the topic explanation process.
 * - TopicExplainerInput - The input type for the explainTopic function.
 * - TopicExplainerOutput - The return type for the explainTopic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TopicExplainerInputSchema = z.object({
  topic: z.string().describe('The topic the user wants to understand.'),
});
export type TopicExplainerInput = z.infer<typeof TopicExplainerInputSchema>;

const CodeExampleSchema = z.object({
    language: z.string().describe('The programming language of the code example (e.g., javascript, python).'),
    code: z.string().describe('The code snippet example.'),
    title: z.string().optional().describe('A brief title or description for this code example.'),
});

const TopicExplainerOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A clear and concise explanation of the topic.'),
  codeExamples: z
    .array(CodeExampleSchema)
    .optional()
    .describe(
      'One or more relevant code examples to illustrate the topic. Provide examples in common languages like JavaScript or Python if applicable.'
    ),
  diagramDescription: z
    .string()
    .optional()
    .describe(
      'A textual description of a simple diagram that could visually represent the core concept. For example, for "CSS Box Model", describe concentric rectangles for content, padding, border, margin. For "API Call", describe client, arrow to server, arrow back from server.'
    ),
  keyConcepts: z.array(z.string()).optional().describe('A list of 2-4 key concepts or takeaways related to the topic.')
});
export type TopicExplainerOutput = z.infer<typeof TopicExplainerOutputSchema>;

export async function explainTopic(
  input: TopicExplainerInput
): Promise<TopicExplainerOutput> {
  return topicExplainerFlow(input);
}

const topicExplainerPrompt = ai.definePrompt({
  name: 'topicExplainerPrompt',
  input: {schema: TopicExplainerInputSchema},
  output: {schema: TopicExplainerOutputSchema},
  prompt: `You are an expert educator and technical writer. A user wants to understand the topic: {{{topic}}}.

Please provide the following:
1.  **Explanation**: A clear, concise, and easy-to-understand explanation of the topic. Break down complex ideas into simpler parts. Aim for clarity suitable for a learner who may be new to this specific topic.
2.  **Code Examples** (if applicable): If the topic is related to programming, provide 1-2 relevant code examples in common languages (like JavaScript or Python). Each example should be a small, illustrative snippet with an optional brief title. If code examples are not relevant (e.g., for a very high-level concept), omit this field or provide an empty array.
3.  **Diagram Description**: A textual description of a simple, conceptual diagram that would help visualize the core idea of the topic. Focus on clarity and simplicity. For instance:
    *   For "CSS Box Model": "A diagram showing four concentric rectangles. The innermost is 'Content', surrounded by 'Padding', then 'Border', and finally 'Margin' on the outside."
    *   For "Client-Server Architecture": "A diagram with a 'Client' box on one side and a 'Server' box on the other. An arrow labeled 'Request' goes from Client to Server. Another arrow labeled 'Response' goes from Server back to Client."
    *   For "Linked List": "A series of connected nodes. Each node contains 'Data' and a 'Next' pointer arrow pointing to the subsequent node. The last node's 'Next' pointer points to NULL."
    If a diagram is not particularly helpful or easily described for the topic, you can omit this.
4.  **Key Concepts**: A list of 2-4 bullet points summarizing the most important takeaways or key concepts related to the topic.

Topic to explain: {{{topic}}}

Structure your response strictly according to the TopicExplainerOutputSchema.
Ensure explanations are accessible and code examples are practical.
If the topic is very broad, try to focus on the fundamental aspects or ask for clarification (though for this flow, you must provide a direct explanation based on the given topic).
`,
});

const topicExplainerFlow = ai.defineFlow(
  {
    name: 'topicExplainerFlow',
    inputSchema: TopicExplainerInputSchema,
    outputSchema: TopicExplainerOutputSchema,
  },
  async input => {
    const {output} = await topicExplainerPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate an explanation for the topic.');
    }
    return output;
  }
);
