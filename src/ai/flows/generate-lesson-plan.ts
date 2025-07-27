// src/ai/flows/generate-lesson-plan.ts
'use server';
/**
 * @fileOverview Creates a comprehensive lesson plan by searching for online resources.
 *
 * - generateLessonPlan - A function that handles the lesson planning process.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Tool to simulate searching the web for educational resources
const searchEducationalResourcesTool = ai.defineTool(
  {
    name: 'searchEducationalResources',
    description: 'Searches for educational online resources like articles, videos, and activities based on a query.',
    inputSchema: z.object({
      query: z.string().describe('The search query, e.g., "photosynthesis for 5th graders"'),
    }),
    outputSchema: z.object({
      resources: z.array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          type: z.enum(['video', 'article', 'activity']),
        })
      ),
    }),
  },
  async ({ query }) => {
    console.log(`Simulating web search for: ${query}`);
    // In a real application, this would call a search API (e.g., Google Search API)
    // For this simulation, we return a fixed set of plausible-looking results.
    const results = [
      {
        title: 'Photosynthesis for Kids | Learn with BYJU\'S',
        url: 'https://byjus.com/biology/photosynthesis-for-kids/',
        type: 'article' as const,
      },
      {
        title: 'Photosynthesis | Educational Video for Kids',
        url: 'https://www.youtube.com/watch?v=D1Ymc31__xM',
        type: 'video' as const,
      },
      {
        title: 'Photosynthesis Paper Craft Activity',
        url: 'https://www.sugarnspicebaking.com/2020/04/photosynthesis-for-kids-craft.html',
        type: 'activity' as const,
      },
       {
        title: 'What is Photosynthesis? | National Geographic',
        url: 'https://www.nationalgeographic.org/encyclopedia/photosynthesis/',
        type: 'article' as const,
      },
    ];
    return { resources: results.filter(r => r.title.toLowerCase().includes(query.split(' ')[0].toLowerCase())) };
  }
);


const GenerateLessonPlanInputSchema = z.object({
  topic: z.string().describe('The main topic for the lesson (e.g., "Photosynthesis").'),
  gradeLevel: z.string().describe('The grade level for the students (e.g., "5th Grade").'),
  objectives: z.string().describe('A comma-separated list of learning objectives (e.g., "Understand the role of sunlight, Explain the inputs and outputs").'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonTitle: z.string(),
  lessonPlan: z.array(
    z.object({
      sectionTitle: z.string().describe('Title of the lesson section (e.g., "Introduction", "Activity", "Assessment").'),
      durationMinutes: z.number().describe('Estimated duration of this section in minutes.'),
      description: z.string().describe('A detailed description of the activities or content for this section.'),
      resources: z.array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          type: z.enum(['video', 'article', 'activity']),
        })
      ).optional().describe('A list of online resources for this section.'),
    })
  ),
});
export type GenerateLessonPlanOutput = z.infer<typeof GenerateLessonPlanOutputSchema>;


const lessonPlanPrompt = ai.definePrompt({
    name: 'lessonPlanPrompt',
    input: { schema: GenerateLessonPlanInputSchema },
    output: { schema: GenerateLessonPlanOutputSchema },
    tools: [searchEducationalResourcesTool],
    prompt: `You are an expert curriculum developer. Your task is to create a detailed lesson plan based on the provided topic, grade level, and objectives.

Topic: {{{topic}}}
Grade Level: {{{gradeLevel}}}
Learning Objectives: {{{objectives}}}

1.  First, use the 'searchEducationalResources' tool to find 2-3 relevant online resources (articles, videos, activities) for the given topic and grade level.
2.  Then, create a comprehensive lesson plan with a suitable title.
3.  The lesson plan should be divided into logical sections (e.g., Introduction, Direct Instruction, Guided Practice, Independent Activity, Assessment).
4.  For each section, provide a clear description and estimate the time required in minutes.
5.  Integrate the resources you found into the appropriate sections of the lesson plan. For instance, a video could be in the introduction, and an online article could be part of the guided practice.

Your final output must be a structured JSON object conforming to the output schema.
`,
});

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async (input) => {
    const { output } = await lessonPlanPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a lesson plan.');
    }
    return output;
  }
);


export async function generateLessonPlan(input: GenerateLessonPlanInput): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}
