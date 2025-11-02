import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rate-limiter.ts';
import { logSecurityEvent, SECURITY_EVENTS } from '../_shared/monitoring.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract wallet address from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminWallet = user.user_metadata?.wallet_address;
    if (!adminWallet) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No wallet address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const TestModeSchema = z.object({
      isEnabled: z.boolean({
        errorMap: () => ({ message: 'isEnabled must be a boolean value' })
      })
    });

    const body = await req.json();
    const validationResult = TestModeSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(i => i.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { isEnabled } = validationResult.data;

    // Rate limiting for critical operations
    const rateLimit = await checkRateLimit(supabaseClient, {
      identifier: adminWallet,
      ...RATE_LIMITS.ADMIN_CRITICAL
    });

    if (!rateLimit.allowed) {
      await logSecurityEvent(supabaseClient, {
        level: 'warning',
        eventType: SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
        walletAddress: adminWallet,
        details: {
          action: 'toggle_test_mode',
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _wallet: adminWallet,
      _role: 'admin',
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update test mode state
    const { error: updateError } = await supabaseClient
      .from('test_mode_state')
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
        updated_by: adminWallet,
      })
      .eq('id', (await supabaseClient.from('test_mode_state').select('id').single()).data?.id);

    if (updateError) throw updateError;

    // Log audit
    await supabaseClient.from('audit_log').insert({
      action_type: 'TOGGLE_TEST_MODE',
      action_details: { isEnabled },
      admin_wallet: adminWallet,
    });

    return new Response(
      JSON.stringify({ success: true, isEnabled }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error toggling test mode:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});