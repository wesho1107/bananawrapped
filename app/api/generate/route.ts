import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/core/generate';

interface GenerateRequest {
  baseImageUrl: string; // base64 data URI
  prompt: string; // Nano Banana editing prompt
}

interface GenerateResponse {
  imageUrl: string; // base64 data URI
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
        {
          error:
            'baseImageUrl must be a base64 data URI (e.g., data:image/jpeg;base64,...)',
        },
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

    // Call the AI service to generate image
    const imageUrl = await generateImage({ baseImageUrl, prompt });

    const response: GenerateResponse = {
      imageUrl,
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

