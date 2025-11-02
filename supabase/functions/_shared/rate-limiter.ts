/**
 * Rate Limiting for Admin Functions
 * Prevents abuse and brute force attacks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  identifier: string; // wallet address or IP
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and enforce rate limits
 */
export async function checkRateLimit(
  supabaseClient: any,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  // Count recent requests
  const { data: recentLogs, error } = await supabaseClient
    .from('admin_action_logs')
    .select('id')
    .eq('wallet_address', config.identifier)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open (allow request) if database is unavailable
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000)
    };
  }

  const requestCount = recentLogs?.length || 0;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const allowed = requestCount < config.maxRequests;

  return {
    allowed,
    remaining,
    resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000)
  };
}

/**
 * Default rate limit configurations for different function types
 */
export const RATE_LIMITS = {
  ADMIN_CRITICAL: {
    maxRequests: 10,
    windowMinutes: 60
  },
  ADMIN_STANDARD: {
    maxRequests: 30,
    windowMinutes: 60
  },
  ADMIN_READ: {
    maxRequests: 100,
    windowMinutes: 60
  }
} as const;
