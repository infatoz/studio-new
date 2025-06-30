'use server';

/**
 * @fileOverview A flow for providing simple, accurate explanations for complex student questions.
 *
 * - instantKnowledgeBase - A function that handles the process of providing explanations.
 * - InstantKnowledgeBaseInput - The input type for the instantKnowledgeBase function.
 * - InstantKnowledgeBaseOutput - The return type for the instantKnowledgeBase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantKnowledgeBaseInputSchema = z.object({
  question: z.string().describe('The complex question from the student.'),
  localLanguage: z.string().describe('The local language of the teacher and students.'),
});
export type InstantKnowledgeBaseInput = z.infer<typeof InstantKnowledgeBaseInputSchema>;

const InstantKnowledgeBaseOutputSchema = z.object({
  explanation: z.string().describe('A simple, accurate explanation of the question in the local language, complete with easy-to-understand analogies.'),
});
export type InstantKnowledgeBaseOutput = z.infer<typeof InstantKnowledgeBaseOutputSchema>;

export async function instantKnowledgeBase(input: InstantKnowledgeBaseInput): Promise<InstantKnowledgeBaseOutput> {
  return instantKnowledgeBaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'instantKnowledgeBasePrompt',
  input: {schema: InstantKnowledgeBaseInputSchema},
  output: {schema: InstantKnowledgeBaseOutputSchema},
  prompt: `You are an expert in explaining complex topics in simple terms, using analogies that are easy to understand for students.

  A student has asked the following question in their local language ({{{localLanguage}}}):
  {{{question}}}

  Provide a simple, accurate explanation in the same local language, using analogies to help them understand the concept. Focus on making it very simple to understand.
  \n  Explanation:`, 
});

const instantKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'instantKnowledgeBaseFlow',
    inputSchema: InstantKnowledgeBaseInputSchema,
    outputSchema: InstantKnowledgeBaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
