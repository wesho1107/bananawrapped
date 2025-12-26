import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import {
  extractBase64FromDataUri,
  extractMediaTypeFromDataUri,
} from '../utils/imageUtils';

export interface AnalyzeInputParams {
  type: 'text' | 'image';
  content: string; // text prompt or base64 data URI
}

export interface AnalyzeResult {
  prompt: string;
}

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

Write a concise, actionable 15-word image-editing prompt. Crucially: Avoid naming a specific person or archetype (like 'Santa' or 'Chef'). Instead, describe the specific garments and environment to be added to the existing character.

Format your response as JSON with this structure:
{
  "prompt": "your concise editing prompt here",
}`;

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

  // Call Gemini for analysis
  const result = await generateText({
    model,
    prompt: promptMessages,
  });

  // Parse the response
  const responseText = result.text.trim();

  // Try to extract JSON from the response
  let analysisResult: AnalyzeResult;
  try {
    // Look for JSON in the response (might be wrapped in markdown code blocks)
    const jsonMatch =
      responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
      responseText.match(/```\s*([\s\S]*?)\s*```/) ||
      [null, responseText];

    const jsonText = jsonMatch[1] || responseText;
    analysisResult = JSON.parse(jsonText);
  } catch (parseError) {
    // If JSON parsing fails, try to extract prompt manually
    console.warn(
      'Failed to parse JSON response, attempting manual extraction:',
      parseError
    );

    // Fallback: extract prompt from text
    const promptMatch =
      responseText.match(/"prompt"\s*:\s*"([^"]+)"/) ||
      responseText.match(/prompt[:\s]+(.+?)(?:\n|$)/i);

    const prompt =
      promptMatch?.[1]?.trim() ||
      responseText.split('\n')[0]?.trim() ||
      'Edit the image based on the provided input';

    analysisResult = {
      prompt: prompt,
    };
  }

  // Validate the result
  if (!analysisResult.prompt) {
    throw new Error('Invalid analysis result format');
  }

  return analysisResult.prompt;
}

