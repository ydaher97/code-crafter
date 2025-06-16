
import { config } from 'dotenv';
config();

import '@/ai/flows/question-generation.ts';
import '@/ai/flows/code-grading.ts';
import '@/ai/flows/answer-grading.ts';
import '@/ai/flows/solution-generation.ts';
import '@/ai/flows/topic-generation.ts';
import '@/ai/flows/interview-flow.ts';
import '@/ai/flows/topic-explainer-flow.ts';