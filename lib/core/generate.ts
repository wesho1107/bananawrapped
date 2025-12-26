import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import {
  extractBase64FromDataUri,
  extractMediaTypeFromDataUri,
  uint8ArrayToDataUri,
} from '../utils/imageUtils';

export interface GenerateImageParams {
  baseImageUrl: string; // base64 data URI
  prompt: string; // Nano Banana editing prompt
}

/**
 * Generates an edited image using the base style and prompt
 * Core business logic function that directly interacts with the AI model
 * @param params - Parameters containing base image URL and prompt
 * @returns Generated image URL (base64 data URI)
 * @throws Error if generation fails
 */
export async function generateImage(
  params: GenerateImageParams
): Promise<string> {
  const { baseImageUrl, prompt } = params;

  // Extract base64 and media type from data URI
  const base64Data = extractBase64FromDataUri(baseImageUrl);
  const mediaType = extractMediaTypeFromDataUri(baseImageUrl);

  // Use gemini-2.5-flash-image for image editing (Nano Banana)
  const model = google('gemini-2.5-flash-image');

  const editMessage = `Given the following base style image and its character, keep the original character but edit the character with the following: ${prompt}

  Render a square 120px by 120px image with the same character and art style, with the edits.
    `;

  // Build the prompt for image editing
  const promptMessages = [
    {
      role: 'user' as const,
      content: [
        // editing prompt
        {
          type: 'text' as const,
          text: editMessage,
        },
        // base style image
        {
          type: 'image' as const,
          image: base64Data,
          mediaType: mediaType,
        },
      ],
    },
  ];

  // Call Gemini for image generation/editing
  const result = await generateText({
    model,
    prompt: promptMessages,
  });

  // Extract the generated image from the result
  if (!result.files || result.files.length === 0) {
    throw new Error('No image was generated');
  }

  // Find the first image file in the result
  const imageFile = result.files.find((file) =>
    file.mediaType.startsWith('image/')
  );

  if (!imageFile) {
    throw new Error('Generated result does not contain an image');
  }

  // Convert the image to base64 data URI
  const imageDataUri = uint8ArrayToDataUri(
    imageFile.uint8Array,
    imageFile.mediaType
  );

  return imageDataUri;
}

