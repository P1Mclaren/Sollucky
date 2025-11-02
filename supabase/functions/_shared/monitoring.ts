/**
 * Monitoring and Alerting Utilities
 * Logs critical events for security monitoring
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface SecurityEvent {
  level: AlertLevel;
  eventType: string;
  walletAddress: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log security-relevant events to admin_action_logs
 */
export async function logSecurityEvent(
  supabaseClient: any,
  event: SecurityEvent
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('admin_action_logs')
      .insert({
        wallet_address: event.walletAddress,
        action_type: event.eventType,
        action_data: {
          level: event.level,
          ...event.details,
          ip: event.ipAddress
        }
      });

    if (error) {
      console.error('Failed to log security event:', error);
    }

    // Log to console for real-time monitoring
    const emoji = event.level === 'critical' ? '🚨' : event.level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${event.level.toUpperCase()}] ${event.eventType}`, {
      wallet: event.walletAddress,
      ...event.details
    });

    // In production, you would also send to external monitoring service
    // e.g., Sentry, DataDog, PagerDuty for critical events
    if (event.level === 'critical') {
      console.error('🚨 CRITICAL SECURITY EVENT - Manual review required');
    }
  } catch (err) {
    console.error('Error in logSecurityEvent:', err);
  }
}

/**
 * Common security event types
 */
export const SECURITY_EVENTS = {
  AUTH_FAILED: 'auth_failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  LARGE_WITHDRAWAL: 'large_withdrawal',
  LOTTERY_DRAW: 'lottery_draw',
  TEST_MODE_TOGGLE: 'test_mode_toggle',
  ADMIN_ACTION: 'admin_action'
} as const;
