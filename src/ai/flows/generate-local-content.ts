'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating hyper-local content in a teacher's local language using Gemini.
 *
 * - generateLocalContent - A function that generates hyper-local content based on a teacher's request.
 * - GenerateLocalContentInput - The input type for the generateLocalContent function.
 * - GenerateLocalContentOutput - The return type for the generateLocalContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLocalContentInputSchema = z.object({
  language: z.string().describe('The local language to generate content in.'),
  request: z.string().describe('The teacher\'s request for hyper-local content (e.g., \'Create a story in Marathi about farmers to explain different soil types\').'),
});
export type GenerateLocalContentInput = z.infer<typeof GenerateLocalContentInputSchema>;

const GenerateLocalContentOutputSchema = z.object({
  content: z.string().describe('The generated hyper-local content in the specified language.'),
});
export type GenerateLocalContentOutput = z.infer<typeof GenerateLocalContentOutputSchema>;

export async function generateLocalContent(input: GenerateLocalContentInput): Promise<GenerateLocalContentOutput> {
  return generateLocalContentFlow(input);
}

const generateLocalContentPrompt = ai.definePrompt({
  name: 'generateLocalContentPrompt',
  input: {schema: GenerateLocalContentInputSchema},
  output: {schema: GenerateLocalContentOutputSchema},
  prompt: `You are an AI assistant designed to generate hyper-local content for teachers in their local language.

  A teacher has requested the following content in {{{language}}}:
  {{request}}

  Generate culturally relevant and simple content based on the request.
  Ensure that the content is appropriate for use in a multi-grade classroom setting.
  Do not include any harmful or inappropriate content.
  Respond in {{{language}}}.`,
});

const generateLocalContentFlow = ai.defineFlow(
  {
    name: 'generateLocalContentFlow',
    inputSchema: GenerateLocalContentInputSchema,
    outputSchema: GenerateLocalContentOutputSchema,
  },
  async input => {
    const {output} = await generateLocalContentPrompt(input);
    return output!;
  }
);
