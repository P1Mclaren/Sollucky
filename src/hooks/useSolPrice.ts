import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSolPrice() {
  const [solPrice, setSolPrice] = useState<number>(200); // Default fallback
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-sol-price');
        
        if (error) throw error;
        
        if (data?.price_usd) {
          setSolPrice(data.price_usd);
        }
      } catch (error) {
        console.error('Error fetching SOL price:', error);
        // Keep default price on error
      } finally {
        setLoading(false);
      }
    };

    fetchSolPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchSolPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { solPrice, loading };
}
