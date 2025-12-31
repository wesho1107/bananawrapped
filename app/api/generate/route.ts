import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/core/generate';
import { rateLimitMiddleware, getRateLimitHeaders } from '@/lib/middleware/rateLimit';

interface GenerateRequest {
  baseImageUrl: string; // base64 data URI
  prompt: string; // Nano Banana editing prompt
}

interface GenerateResponse {
  imageUrl: string; // base64 data URI
}

// POST - Generate edited image using Nano Banana
export async function POST(request: NextRequest) {
  const { rateLimitResponse, rateLimitResult } = await rateLimitMiddleware(request);
  // rateLimitResponse is null if successful
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: GenerateRequest = await request.json();
    const { baseImageUrl, prompt } = body;

    // Validate request
    if (!baseImageUrl || !prompt) {
      return NextResponse.json(
        { error: 'baseImageUrl and prompt are required' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate baseImageUrl is a base64 data URI
    if (!baseImageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        {
          error:
            'baseImageUrl must be a base64 data URI (e.g., data:image/jpeg;base64,...)',
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate prompt is not empty
    if (!prompt.trim()) {
      return NextResponse.json(
        { error: 'prompt cannot be empty' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Call the AI service to generate image
    const imageUrl = await generateImage({ baseImageUrl, prompt });

    const response: GenerateResponse = {
      imageUrl,
    };

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('Error generating image:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('data URI')) {
        return NextResponse.json(
          { error: `Invalid image format: ${error.message}` },
          {
            status: 400,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        );
      }

      return NextResponse.json(
        { error: `Image generation failed: ${error.message}` },
        {
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      {
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}

