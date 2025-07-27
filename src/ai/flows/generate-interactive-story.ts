// src/ai/flows/generate-interactive-story.ts
'use server';
/**
 * @fileOverview Generates an interactive, voice-narrated story for classroom engagement.
 *
 * - generateInteractiveStory - A function that handles the story generation and audio narration.
 * - GenerateInteractiveStoryInput - The input type for the generateInteractiveStory function.
 * - GenerateInteractiveStoryOutput - The return type for the generateInteractiveStory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

async function textToSpeech(text: string): Promise<string> {
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-preview-tts',
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: text,
  });

  if (!media) {
    throw new Error('No audio media was returned from the TTS model.');
  }

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );

  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    const chunks: Buffer[] = [];
    writer.on('data', chunk => chunks.push(chunk));
    writer.on('end', () => resolve('data:audio/wav;base64,' + Buffer.concat(chunks).toString('base64')));
    writer.on('error', reject);
    writer.end(audioBuffer);
  });
}


const GenerateInteractiveStoryInputSchema = z.object({
  topic: z.string().describe('The topic or theme for the story.'),
  language: z.string().describe('The language for the story.'),
  previousContext: z.string().optional().describe('The story context from previous turns.'),
  studentSuggestion: z.string().optional().describe('A suggestion from a student on what should happen next.'),
});
export type GenerateInteractiveStoryInput = z.infer<typeof GenerateInteractiveStoryInputSchema>;

const GenerateInteractiveStoryOutputSchema = z.object({
  storySegment: z.string().describe('The next segment of the story.'),
  audioDataUri: z.string().describe('A data URI containing the narrated audio of the story segment.'),
});
export type GenerateInteractiveStoryOutput = z.infer<typeof GenerateInteractiveStoryOutputSchema>;


const storyPrompt = ai.definePrompt({
    name: 'interactiveStoryPrompt',
    input: { schema: GenerateInteractiveStoryInputSchema },
    output: { schema: z.object({ storySegment: z.string() })},
    prompt: `You are a master storyteller for children. Create a short, engaging story segment in {{{language}}}.

Topic: {{{topic}}}

{{#if previousContext}}
This is the story so far:
"{{{previousContext}}}"

A student suggested this should happen next: "{{{studentSuggestion}}}"
Incorporate the student's suggestion into the next part of the story. Keep it simple and continue the narrative.
{{else}}
Start a new, simple story based on the topic. Keep the first part very short, about two or three sentences, and end with a question asking what should happen next.
{{/if}}

Your response should only be the next part of the story.
`
});


const generateInteractiveStoryFlow = ai.defineFlow(
  {
    name: 'generateInteractiveStoryFlow',
    inputSchema: GenerateInteractiveStoryInputSchema,
    outputSchema: GenerateInteractiveStoryOutputSchema,
  },
  async (input) => {
    const { output } = await storyPrompt(input);
    const storySegment = output!.storySegment;

    if (!storySegment) {
        throw new Error("The AI failed to generate a story segment.");
    }
    
    // Generate TTS audio from the story segment
    const audioDataUri = await textToSpeech(storySegment);
    
    return {
        storySegment,
        audioDataUri,
    };
  }
);


export async function generateInteractiveStory(input: GenerateInteractiveStoryInput): Promise<GenerateInteractiveStoryOutput> {
  return generateInteractiveStoryFlow(input);
}
