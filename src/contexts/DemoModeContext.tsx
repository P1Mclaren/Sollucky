import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DemoModeContextType {
  isDemoMode: boolean;
  refreshDemoMode: () => Promise<void>;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  refreshDemoMode: async () => {},
});

export const useDemoMode = () => useContext(DemoModeContext);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const refreshDemoMode = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_mode_state')
        .select('is_enabled')
        .single();

      if (error) throw error;
      setIsDemoMode(data?.is_enabled || false);
    } catch (error) {
      console.error('Error fetching demo mode state:', error);
    }
  };

  useEffect(() => {
    refreshDemoMode();

    // Subscribe to demo mode changes
    const channel = supabase
      .channel('demo_mode_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demo_mode_state',
        },
        () => {
          refreshDemoMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, refreshDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}