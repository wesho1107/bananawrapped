import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Get rate limit configuration from environment variables with defaults
const RATE_LIMIT_REQUESTS = parseInt(
  process.env.RATE_LIMIT_REQUESTS || '10',
  10
);
const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW || '60',
  10
);

// Initialize Upstash Ratelimit
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, `${RATE_LIMIT_WINDOW} s`),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

/**
 * Check rate limit for a given identifier (IP address)
 * @param identifier - Unique identifier (IP address) for rate limiting
 * @returns Rate limit result with success status and remaining requests
 */
export async function checkRateLimit(identifier: string) {
  const result = await rateLimiter.limit(identifier);
  return result;
}

