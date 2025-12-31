import { NextRequest, NextResponse } from 'next/server';
import { analyzeInput } from '@/lib/core/analyse';
import { rateLimitMiddleware, getRateLimitHeaders } from '@/lib/middleware/rateLimit';

interface AnalyzeRequest {
  type: 'text' | 'image';
  content: string; // text prompt or base64 data URI
}

interface AnalyzeResponse {
  prompt: string;
}

// POST - Analyze user input and generate Nano Banana prompt
export async function POST(request: NextRequest) {
  const { rateLimitResponse, rateLimitResult } = await rateLimitMiddleware(request);
  // rateLimitResponse is null if successful
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: AnalyzeRequest = await request.json();
    const { type, content } = body;

    // Validate request
    if (!type || !content) {
      return NextResponse.json(
        { error: 'type and content are required' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (type !== 'text' && type !== 'image') {
      return NextResponse.json(
        { error: 'type must be either "text" or "image"' },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Validate image format if type is image
    if (type === 'image' && !content.startsWith('data:image/')) {
      return NextResponse.json(
        {
          error:
            'image content must be a base64 data URI (e.g., data:image/jpeg;base64,...)',
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Call the AI service to analyze input
    const prompt = await analyzeInput({ type, content });

    const response: AnalyzeResponse = {
      prompt,
    };

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('Error analyzing input:', error);

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
        { error: `Analysis failed: ${error.message}` },
        {
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze input' },
      {
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}

