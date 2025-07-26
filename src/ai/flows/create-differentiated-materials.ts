'use server';

/**
 * @fileOverview Differentiates learning materials for multi-grade classrooms.
 *
 * - createDifferentiatedMaterials - A function that generates differentiated worksheets from a textbook page image.
 * - CreateDifferentiatedMaterialsInput - The input type for the createDifferentiatedMaterials function.
 * - CreateDifferentiatedMaterialsOutput - The return type for the createDifferentiatedMaterials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateDifferentiatedMaterialsInputSchema = z.object({
  documentContent: z
    .string()
    .describe(
      "A photo of a textbook page or document text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  gradeLevels: z
    .string()
    .describe('A comma separated list of the grade levels to generate materials for.'),
});
export type CreateDifferentiatedMaterialsInput = z.infer<typeof CreateDifferentiatedMaterialsInputSchema>;

const CreateDifferentiatedMaterialsOutputSchema = z.object({
  worksheets: z.array(
    z.object({
      gradeLevel: z.string().describe('The grade level of the worksheet.'),
      worksheetContent: z.string().describe('The content of the worksheet for the specified grade level.'),
    })
  ).describe('An array of worksheets, each tailored to a specific grade level.'),
});
export type CreateDifferentiatedMaterialsOutput = z.infer<typeof CreateDifferentiatedMaterialsOutputSchema>;

export async function createDifferentiatedMaterials(input: CreateDifferentiatedMaterialsInput): Promise<CreateDifferentiatedMaterialsOutput> {
  return createDifferentiatedMaterialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createDifferentiatedMaterialsPrompt',
  input: {schema: CreateDifferentiatedMaterialsInputSchema},
  output: {schema: CreateDifferentiatedMaterialsOutputSchema},
  prompt: `You are an expert teacher specializing in creating differentiated learning materials for multi-grade classrooms.

You will use the provided document content (from a textbook page image, PDF, or DOCX) and the list of grade levels to generate tailored worksheets for each grade level.

Create worksheets that are appropriate for each grade level, with questions and activities that align with their learning level.

Document Content: {{media url=documentContent}}
Grade Levels: {{{gradeLevels}}}

Output the worksheets in JSON format. The JSON should be an array of objects, with each object containing the gradeLevel and the worksheetContent.
`,
});

const createDifferentiatedMaterialsFlow = ai.defineFlow(
  {
    name: 'createDifferentiatedMaterialsFlow',
    inputSchema: CreateDifferentiatedMaterialsInputSchema,
    outputSchema: CreateDifferentiatedMaterialsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
