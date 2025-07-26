'use server';

/**
 * @fileOverview Generates a Google Form quiz from worksheet content.
 *
 * - createGoogleFormQuiz - A function that creates a quiz and returns the form URL.
 * - CreateGoogleFormQuizInput - The input type for the createGoogleFormQuiz function.
 * - CreateGoogleFormQuizOutput - The return type for the createGoogleFormQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Helper function to call Google Forms API
async function callFormsApi(endpoint: string, options: RequestInit, accessToken: string) {
    const response = await fetch(`https://forms.googleapis.com/v1/${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Forms API Error (${response.status}): ${errorBody}`);
        throw new Error(`Google Forms API request failed with status ${response.status}`);
    }

    return response.json();
}

const createGoogleFormTool = ai.defineTool(
    {
        name: 'createGoogleForm',
        description: 'Creates a new Google Form with a given title and returns the form ID and URL.',
        inputSchema: z.object({
            title: z.string().describe("The title of the Google Form."),
        }),
        outputSchema: z.object({
            formId: z.string(),
            formUrl: z.string(),
        }),
    },
    async ({ title }, { flowState }) => {
        const { accessToken } = flowState as any;
        if (!accessToken) throw new Error("Missing access token in flow state.");
        
        const form = {
            info: { title },
        };
        const createResponse = await callFormsApi('forms', {
            method: 'POST',
            body: JSON.stringify(form)
        }, accessToken);

        return { formId: createResponse.formId, formUrl: createResponse.responderUri };
    }
);

const addQuestionsToFormTool = ai.defineTool(
    {
        name: 'addQuestionsToForm',
        description: 'Adds a batch of questions to a Google Form.',
        inputSchema: z.object({
            formId: z.string(),
            questions: z.array(z.object({
                title: z.string().describe("The question text."),
                options: z.array(z.string()).describe("An array of choices for the multiple-choice question."),
            })),
        }),
        outputSchema: z.any(),
    },
    async ({ formId, questions }, { flowState }) => {
        const { accessToken } = flowState as any;
        if (!accessToken) throw new Error("Missing access token in flow state.");
        
        const requests = questions.map((q, index) => ({
            createItem: {
                item: {
                    title: q.title,
                    questionItem: {
                        question: {
                            required: true,
                            choiceQuestion: {
                                type: 'RADIO',
                                options: q.options.map(opt => ({ value: opt })),
                            },
                        },
                    },
                },
                location: { index },
            },
        }));

        const batchUpdateRequest = { requests };
        return callFormsApi(`forms/${formId}:batchUpdate`, {
            method: 'POST',
            body: JSON.stringify(batchUpdateRequest),
        }, accessToken);
    }
);

const CreateGoogleFormQuizInputSchema = z.object({
  worksheetContent: z.string().describe("The text content of the worksheet to base the quiz on."),
  language: z.string().describe("The language for the quiz questions and options.").default('English'),
  accessToken: z.string().describe("The user's Google OAuth access token."),
});
export type CreateGoogleFormQuizInput = z.infer<typeof CreateGoogleFormQuizInputSchema>;

const CreateGoogleFormQuizOutputSchema = z.object({
  formUrl: z.string().describe('The URL of the created Google Form quiz.'),
});
export type CreateGoogleFormQuizOutput = z.infer<typeof CreateGoogleFormQuizOutputSchema>;


const quizGenerationPrompt = `
    Based on the following worksheet content, generate a 5-question multiple-choice quiz in {{{language}}}.
    The quiz should be titled "Quiz".
    For each question, provide 4 options.

    Worksheet Content:
    {{{worksheetContent}}}
`;


const createGoogleFormQuizFlow = ai.defineFlow(
  {
    name: 'createGoogleFormQuizFlow',
    inputSchema: CreateGoogleFormQuizInputSchema,
    outputSchema: CreateGoogleFormQuizOutputSchema,
  },
  async ({ worksheetContent, language, accessToken }) => {

    const llmResponse = await ai.generate({
        prompt: quizGenerationPrompt,
        input: { worksheetContent, language },
        tools: [createGoogleFormTool, addQuestionsToFormTool],
        model: 'googleai/gemini-1.5-flash',
        toolConfig: {
            definition: {
                flowState: { accessToken }
            }
        }
    });
    
    // The model should call the tool and the output should be available in the toolCalls
    const createFormCall = llmResponse.toolCalls()?.find(call => call.tool === 'createGoogleForm');

    if (!createFormCall) {
        throw new Error('Could not find the call to createGoogleForm tool.');
    }

    const toolOutput = await createFormCall.output();
    const formUrl = (toolOutput as any)?.formUrl;

    if (!formUrl) {
      throw new Error('Could not create Google Form or find formUrl.');
    }

    return { formUrl };
  }
);


export async function createGoogleFormQuiz(input: CreateGoogleFormQuizInput): Promise<CreateGoogleFormQuizOutput> {
  return createGoogleFormQuizFlow(input);
}
