import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/utils/rateLimit';

/**
 * Extract IP address from NextRequest
 * Tries multiple methods to get the client IP address
 */
export function getClientIP(request: NextRequest): string {
  // Use x-forwarded-for header (common in Vercel/proxy environments)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to x-real-ip header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Use a default identifier if IP cannot be determined
  return 'unknown';
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiting middleware for API routes
 * Checks rate limit based on client IP address and returns 429 if exceeded
 * @param request - NextRequest object
 * @returns Object with rateLimitResponse (429 if exceeded, null if allowed) and rateLimitResult (for headers)
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<{
  rateLimitResponse: NextResponse | null;
  rateLimitResult: RateLimitResult | null;
}> {
  try {
    // Extract IP address from request
    const ip = getClientIP(request);

    // Check rate limit
    const result = await checkRateLimit(ip);

    // If rate limit exceeded, return 429 response
    if (!result.success) {
      return {
        rateLimitResponse: NextResponse.json(
          {
            error: 'Rate limit exceeded. Please try again later.',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.reset).toISOString(),
              'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            },
          }
        ),
        rateLimitResult: null,
      };
    }

    // Rate limit check passed, return null response and the result for headers
    return {
      rateLimitResponse: null,
      rateLimitResult: {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
    };
  } catch (error) {
    // If rate limiting check fails, log error but allow request to proceed
    // This prevents rate limiting from breaking the API if Redis is unavailable
    console.error('Rate limit check failed:', error);
    return {
      rateLimitResponse: null,
      rateLimitResult: null,
    };
  }
}

/**
 * Get rate limit headers from a rate limit result
 * @param rateLimitResult - Result from rateLimitMiddleware
 * @returns Headers object with rate limit information
 */
export function getRateLimitHeaders(
  rateLimitResult: RateLimitResult | null
): Record<string, string> {
  if (!rateLimitResult) {
    return {};
  }

  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
  };
}

