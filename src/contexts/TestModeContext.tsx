import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TestModeContextType {
  isTestMode: boolean;
  refreshTestMode: () => Promise<void>;
}

const TestModeContext = createContext<TestModeContextType>({
  isTestMode: false,
  refreshTestMode: async () => {},
});

export const useTestMode = () => useContext(TestModeContext);

export function TestModeProvider({ children }: { children: React.ReactNode }) {
  const [isTestMode, setIsTestMode] = useState(false);

  const refreshTestMode = async () => {
    try {
      const { data, error } = await supabase
        .from('test_mode_state')
        .select('is_enabled')
        .single();

      if (error) throw error;
      setIsTestMode(data?.is_enabled || false);
    } catch (error) {
      console.error('Error fetching test mode state:', error);
    }
  };

  useEffect(() => {
    refreshTestMode();

    // Subscribe to test mode changes
    const channel = supabase
      .channel('test_mode_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_mode_state',
        },
        () => {
          refreshTestMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <TestModeContext.Provider value={{ isTestMode, refreshTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
}