import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

interface GenerateDemoWinnerButtonProps {
  lotteryType: 'monthly' | 'weekly' | 'daily';
}

export function GenerateDemoWinnerButton({ lotteryType }: GenerateDemoWinnerButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-demo-winners', {
        body: { lotteryType }
      });

      if (error) throw error;

      toast.success(`Demo winner generated for ${lotteryType} lottery!`);
    } catch (error) {
      console.error('Error generating demo winner:', error);
      toast.error('Failed to generate demo winner');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={generating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Trophy className="w-4 h-4" />
      {generating ? 'Generating...' : 'Generate Demo Winner'}
    </Button>
  );
}