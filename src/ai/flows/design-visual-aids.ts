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
  subject: z.string().describe('The subject for which the visual aid is being generated (e.g., Biology, Physics).'),
  style: z.string().describe('The artistic style of the image (e.g., Simple Line Drawing, Photorealistic).'),
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
  prompt: `You are an expert visual aid designer for educational purposes. Generate an accurate and clear image for a teacher.

Subject: {{{subject}}}
Style: {{{style}}}
Description: {{{description}}}

If the style is 'Simple Line Drawing' or 'Diagram/Chart', create an image that can be easily replicated on a blackboard.
For other styles, create a high-quality, illustrative image suitable for teaching.`,
});

const designVisualAidsFlow = ai.defineFlow(
  {
    name: 'designVisualAidsFlow',
    inputSchema: DesignVisualAidsInputSchema,
    outputSchema: DesignVisualAidsOutputSchema,
  },
  async input => {
    const llmResponse = await designVisualAidsPrompt(input);
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: llmResponse.text,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
    return {image: media!.url!};
  }
);
