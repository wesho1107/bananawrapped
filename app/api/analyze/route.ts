import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

interface AnalyzeRequest {
  type: 'text' | 'image';
  content: string; // text prompt or base64 data URI
}

interface AnalyzeResponse {
  prompt: string;
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

// POST - Analyze user input and generate Nano Banana prompt
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { type, content } = body;

    // Validate request
    if (!type || !content) {
      return NextResponse.json(
        { error: 'type and content are required' },
        { status: 400 }
      );
    }

    if (type !== 'text' && type !== 'image') {
      return NextResponse.json(
        { error: 'type must be either "text" or "image"' },
        { status: 400 }
      );
    }

    // Validate image format if type is image
    if (type === 'image' && !content.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'image content must be a base64 data URI (e.g., data:image/jpeg;base64,...)' },
        { status: 400 }
      );
    }

    // Build the analysis prompt
    const analysisPrompt = `Act as an image analyst. Analyze the provided ${type === 'image' ? 'image' : 'text input'} and extract key visual characteristics that should be reflected in a square art. Focus on:

- Clothing
- Emotions/expressions
- Activities/context
- Key objects or elements

Write me a concise, actionable 20-words image-editing prompt to edit a base style image to incorporate these characteristics. The prompt should be specific and suitable for image editing.

Format your response as JSON with this structure:
{
  "prompt": "your concise editing prompt here",
}`;

    // Prepare content for Gemini
    // Using gemini-1.5-flash for fast multimodal analysis
    const model = google('gemini-1.5-flash');
    
    // Build the prompt content based on input type
    let promptMessages: Array<{ role: 'user'; content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mediaType: string }> }>;

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
    let analysisResult: AnalyzeResponse;
    try {
      // Look for JSON in the response (might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText];
      
      const jsonText = jsonMatch[1] || responseText;
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract prompt manually
      console.warn('Failed to parse JSON response, attempting manual extraction:', parseError);
      
      // Fallback: extract prompt from text
      const promptMatch = responseText.match(/"prompt"\s*:\s*"([^"]+)"/) ||
                         responseText.match(/prompt[:\s]+(.+?)(?:\n|$)/i);
      
      const prompt = promptMatch?.[1]?.trim() || 
                    responseText.split('\n')[0]?.trim() || 
                    'Edit the image based on the provided input';
      
      analysisResult = {
        prompt: prompt,
      };
    }

    // Validate the result
    if (!analysisResult.prompt) {
      return NextResponse.json(
        { error: 'Invalid analysis result format' },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing input:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('data URI')) {
        return NextResponse.json(
          { error: `Invalid image format: ${error.message}` },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Analysis failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze input' },
      { status: 500 }
    );
  }
}

