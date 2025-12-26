export interface MonthGenerationData {
  baseImage: string | null;
  editPrompt: string;
  name: string;
}

export interface MonthGenerationResult {
  resultImageUrl: string;
  generatedPrompt: string;
}

export interface ProcessMonthGenerationParams {
  monthData: MonthGenerationData;
  baseStyleImageUrl: string;
}

/**
 * Client-side function to call the analyze API endpoint
 */
async function analyzeInputClient(params: {
  type: 'image' | 'text';
  content: string;
}): Promise<string> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Analysis failed',
    }));
    throw new Error(errorData.error || 'Failed to analyze input');
  }

  const result = await response.json();
  if (!result.prompt) {
    throw new Error('No prompt generated from analysis');
  }

  return result.prompt;
}

/**
 * Client-side function to call the generate API endpoint
 */
async function generateImageClient(params: {
  baseImageUrl: string;
  prompt: string;
}): Promise<string> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Generation failed',
    }));
    throw new Error(errorData.error || 'Failed to generate image');
  }

  const result = await response.json();
  if (!result.imageUrl) {
    throw new Error('No image was generated');
  }

  return result.imageUrl;
}

/**
 * Processes a single month through the full generation pipeline:
 * analyze input → generate image
 * This function calls the API endpoints (client-side)
 * @param params - Parameters containing month data and base style
 * @returns Result containing generated image URL and prompt
 * @throws Error if any step fails
 */
export async function processMonthGeneration(
  params: ProcessMonthGenerationParams
): Promise<MonthGenerationResult> {
  const { monthData, baseStyleImageUrl } = params;

  // Step 1: Analyze user input to generate prompt
  const generatedPrompt = await analyzeInputClient({
    type: monthData.baseImage ? 'image' : 'text',
    content: monthData.baseImage || monthData.editPrompt.trim(),
  });

  // Step 2: Generate edited image using base style and prompt
  const resultImageUrl = await generateImageClient({
    baseImageUrl: baseStyleImageUrl,
    prompt: generatedPrompt,
  });

  return {
    resultImageUrl,
    generatedPrompt,
  };
}

export interface BatchGenerationParams {
  months: Array<{
    data: MonthGenerationData;
    index: number;
  }>;
  baseStyleImageUrl: string;
  onProgress?: (progress: {
    completed: number;
    total: number;
    current: number | null;
  }) => void;
}

export interface BatchGenerationResult {
  results: Array<{
    index: number;
    result: MonthGenerationResult | null;
    error: Error | null;
  }>;
}

/**
 * Processes multiple months through the generation pipeline sequentially
 * @param params - Parameters containing months to process and base style
 * @returns Results for all months (including errors)
 */
export async function processBatchGeneration(
  params: BatchGenerationParams
): Promise<BatchGenerationResult> {
  const { months, baseStyleImageUrl, onProgress } = params;
  const results: BatchGenerationResult['results'] = [];

  for (let i = 0; i < months.length; i++) {
    const { data, index } = months[i];

    // Update progress
    if (onProgress) {
      onProgress({
        completed: i,
        total: months.length,
        current: index,
      });
    }

    try {
      // Process the month generation pipeline
      const result = await processMonthGeneration({
        monthData: data,
        baseStyleImageUrl,
      });

      results.push({
        index,
        result,
        error: null,
      });

      // Update progress after completion
      if (onProgress) {
        onProgress({
          completed: i + 1,
          total: months.length,
          current: null,
        });
      }
    } catch (error) {
      // Handle errors for this specific month
      const err = error instanceof Error ? error : new Error(String(error));
      results.push({
        index,
        result: null,
        error: err,
      });

      // Log error but continue with other months
      console.error(`Error processing ${data.name}:`, err.message);

      // Update progress even on error
      if (onProgress) {
        onProgress({
          completed: i + 1,
          total: months.length,
          current: null,
        });
      }
    }
  }

  return { results };
}

