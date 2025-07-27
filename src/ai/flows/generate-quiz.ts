
'use server';

/**
 * @fileOverview Generates a quiz based on a topic and creates a Google Form.
 *
 * - generateQuiz - A function that handles the quiz generation and Google Form creation.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createGoogleFormQuiz } from './create-google-form-quiz';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
  language: z.string().describe('The language for the quiz.'),
  accessToken: z.string().describe("The user's Google OAuth access token."),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  formUrl: z.string().describe('The URL of the created Google Form quiz.'),
  quizContent: z.string().describe('The raw text content of the generated quiz.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const quizGenerationPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {
    schema: z.object({
      topic: z.string(),
      numQuestions: z.number(),
      language: z.string(),
    }),
  },
  output: {
    schema: z.object({
      quizContent: z.string().describe("The full content of the quiz with questions and multiple choice options.")
    }),
  },
  prompt: `
    You are an expert quiz creator for educational purposes.
    Generate a multiple-choice quiz in {{{language}}} about the following topic: {{{topic}}}.
    The quiz should have exactly {{{numQuestions}}} questions.
    For each question, provide 4 options.
    The quiz should be titled "Quiz on {{{topic}}}".

    Return the entire quiz as a single string.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ topic, numQuestions, language, accessToken }) => {

    const { output } = await quizGenerationPrompt({ topic, numQuestions, language });
    const quizContent = output!.quizContent;

    if (!quizContent) {
        throw new Error("Failed to generate quiz content.");
    }

    const { formUrl } = await createGoogleFormQuiz({
        worksheetContent: quizContent,
        language: language,
        accessToken: accessToken,
    });
    
    return { formUrl, quizContent };
  }
);
