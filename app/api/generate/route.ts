import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

interface GenerateRequest {
  baseImageUrl: string; // base64 data URI
  prompt: string; // Nano Banana editing prompt
}

interface GenerateResponse {
  imageUrl: string; // base64 data URI
}

// Extract base64 data from data URI
function extractBase64FromDataUri(dataUri: string): string {
  const matches = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!matches || matches.length < 2) {
    throw new Error('Invalid data URI format');
  }
  return matches[1];
}

// Extract media type from data URI
function extractMediaTypeFromDataUri(dataUri: string): string {
  const matches = dataUri.match(/^data:(image\/[^;]+);base64,/);
  if (!matches || matches.length < 2) {
    throw new Error('Invalid data URI format');
  }
  return matches[1];
}

// Convert Uint8Array to base64 data URI
function uint8ArrayToDataUri(uint8Array: Uint8Array, mediaType: string): string {
  // Convert Uint8Array to base64 string
  const base64String = Buffer.from(uint8Array).toString('base64');
  return `data:${mediaType};base64,${base64String}`;
}

// POST - Generate edited image using Nano Banana
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { baseImageUrl, prompt } = body;

    // Validate request
    if (!baseImageUrl || !prompt) {
      return NextResponse.json(
        { error: 'baseImageUrl and prompt are required' },
        { status: 400 }
      );
    }

    // Validate baseImageUrl is a base64 data URI
    if (!baseImageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'baseImageUrl must be a base64 data URI (e.g., data:image/jpeg;base64,...)' },
        { status: 400 }
      );
    }

    // Validate prompt is not empty
    if (!prompt.trim()) {
      return NextResponse.json(
        { error: 'prompt cannot be empty' },
        { status: 400 }
      );
    }

    // Extract base64 and media type from data URI
    const base64Data = extractBase64FromDataUri(baseImageUrl);
    const mediaType = extractMediaTypeFromDataUri(baseImageUrl);

    // Use gemini-2.5-flash-image for image editing (Nano Banana)
    const model = google('gemini-2.5-flash-image');

    // Build the prompt for image editing
    const promptMessages = [
      {
        role: 'user' as const,
        content: [
            // editing prompt
          {
            type: 'text' as const,
            text: prompt,
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
      return NextResponse.json(
        { error: 'No image was generated' },
        { status: 500 }
      );
    }

    // Find the first image file in the result
    const imageFile = result.files.find((file) => file.mediaType.startsWith('image/'));
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Generated result does not contain an image' },
        { status: 500 }
      );
    }

    // Convert the image to base64 data URI
    const imageDataUri = uint8ArrayToDataUri(imageFile.uint8Array, imageFile.mediaType);

    const response: GenerateResponse = {
      imageUrl: imageDataUri,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating image:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('data URI')) {
        return NextResponse.json(
          { error: `Invalid image format: ${error.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Image generation failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

