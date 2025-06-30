// src/ai/flows/design-visual-aids.ts
'use server';
/**
 * @fileOverview Generates simple line drawings or charts based on a teacher's description.
 *
 * - designVisualAids - A function that handles the visual aid design process.
 * - DesignVisualAidsInput - The input type for the designVisualAids function.
 * - DesignVisualAidsOutput - The return type for the designVisualAids function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DesignVisualAidsInputSchema = z.object({
  description: z.string().describe('The description of the visual aid to generate.'),
});
export type DesignVisualAidsInput = z.infer<typeof DesignVisualAidsInputSchema>;

const DesignVisualAidsOutputSchema = z.object({
  image: z.string().describe('A data URI containing the generated image.'),
});
export type DesignVisualAidsOutput = z.infer<typeof DesignVisualAidsOutputSchema>;

export async function designVisualAids(input: DesignVisualAidsInput): Promise<DesignVisualAidsOutput> {
  return designVisualAidsFlow(input);
}

const designVisualAidsPrompt = ai.definePrompt({
  name: 'designVisualAidsPrompt',
  input: {schema: DesignVisualAidsInputSchema},
  output: {schema: DesignVisualAidsOutputSchema},
  prompt: `Generate a simple line drawing or chart based on the following description that can be easily replicated on a blackboard:

{{{description}}}`, 
});

const designVisualAidsFlow = ai.defineFlow(
  {
    name: 'designVisualAidsFlow',
    inputSchema: DesignVisualAidsInputSchema,
    outputSchema: DesignVisualAidsOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.description,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
    return {image: media!.url!};
  }
);
