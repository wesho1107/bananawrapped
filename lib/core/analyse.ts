import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import {
  extractBase64FromDataUri,
  extractMediaTypeFromDataUri,
} from '../utils/imageUtils';

export interface AnalyzeInputParams {
  type: 'text' | 'image';
  content: string; // text prompt or base64 data URI
}

const analysisPromptSchema = z.object({
  prompt: z.string().describe('A concise, actionable 15-word image-editing prompt.')
});

/**
 * Analyzes user input (image or text) and generates an editing prompt
 * Core business logic function that directly interacts with the AI model
 * @param params - Input parameters containing type and content
 * @returns Generated prompt string
 * @throws Error if analysis fails
 */
export async function analyzeInput(
  params: AnalyzeInputParams
): Promise<string> {
  const { type, content } = params;

  // Build the analysis prompt
  const analysisPrompt = `Analyze the provided ${type === 'image' ? 'image' : 'text input'} and extract one key visual characteristic. Focus on:

- Clothings: Specific clothing items
- Emotions/expressions: Describe the expressions on the face
- Overlay logic: Describe the elements as items the base character is 'donning' or 'wearing'.

Write a concise, actionable 15-word image-editing prompt. Crucially: Avoid naming a specific person or archetype (like 'Santa' or 'Chef'). Instead, describe the specific garments and environment to be added to the existing character.`;

  // Using gemini-1.5-flash for fast multimodal analysis
  const model = google('gemini-flash-latest');

  // Build the prompt content based on input type
  let promptMessages: Array<{
    role: 'user';
    content: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: string; mediaType: string }
    >;
  }>;

  if (type === 'text') {
    promptMessages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `User input: ${content}\n\n${analysisPrompt}`,
          },
        ],
      },
    ];
  } else {
    // Extract base64 and media type from data URI
    const base64Data = extractBase64FromDataUri(content);
    const mediaType = extractMediaTypeFromDataUri(content);

    promptMessages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: analysisPrompt,
          },
          {
            type: 'image',
            image: base64Data,
            mediaType: mediaType,
          },
        ],
      },
    ];
  }

  const result = await generateText({
    model,
    prompt: promptMessages,
    output: Output.object({ schema: analysisPromptSchema }),
  });

  return result.output.prompt;
}

