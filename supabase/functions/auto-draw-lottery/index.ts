import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Checking for draws that need to be executed...');

    // Get all active draws where draw_date has passed
    const now = new Date().toISOString();
    const { data: drawsToExecute, error: fetchError } = await supabase
      .from('lottery_draws')
      .select('id, lottery_type, draw_date')
      .eq('status', 'active')
      .lte('draw_date', now);

    if (fetchError) {
      console.error('Error fetching draws:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${drawsToExecute?.length || 0} draws to execute`);

    if (!drawsToExecute || drawsToExecute.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No draws to execute', checked_at: now }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Execute each draw
    const results = [];
    for (const draw of drawsToExecute) {
      console.log(`🎲 Executing ${draw.lottery_type} draw ${draw.id}...`);
      
      try {
        const { data, error } = await supabase.functions.invoke('draw-winners', {
          body: { drawId: draw.id }
        });

        if (error) {
          console.error(`Failed to draw ${draw.lottery_type} lottery:`, error);
          results.push({
            draw_id: draw.id,
            lottery_type: draw.lottery_type,
            success: false,
            error: error.message
          });
        } else {
          console.log(`✅ Successfully drew ${draw.lottery_type} lottery`);
          results.push({
            draw_id: draw.id,
            lottery_type: draw.lottery_type,
            success: true,
            data
          });
        }
      } catch (error: any) {
        console.error(`Exception drawing ${draw.lottery_type} lottery:`, error);
        results.push({
          draw_id: draw.id,
          lottery_type: draw.lottery_type,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Auto-draw completed',
        executed_at: now,
        draws_executed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Auto-draw error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
