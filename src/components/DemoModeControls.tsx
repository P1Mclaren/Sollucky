import { useState } from 'react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Activity } from 'lucide-react';

export function DemoModeControls() {
  const { isDemoMode, refreshDemoMode } = useDemoMode();
  const [toggling, setToggling] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleToggleDemoMode = async (enabled: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase.functions.invoke('toggle-demo-mode', {
        body: { enabled }
      });

      if (error) throw error;

      await refreshDemoMode();
      toast.success(`Demo mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling demo mode:', error);
      toast.error('Failed to toggle demo mode');
    } finally {
      setToggling(false);
    }
  };

  const handleGenerateActivity = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-demo-activity');

      if (error) throw error;

      toast.success('Demo activity generated successfully');
    } catch (error) {
      console.error('Error generating demo activity:', error);
      toast.error('Failed to generate demo activity');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Demo Mode Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="demo-mode">Demo Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable simulated activity for preview and testing
            </p>
          </div>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={handleToggleDemoMode}
            disabled={toggling}
          />
        </div>

        {isDemoMode && (
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleGenerateActivity}
              disabled={generating}
              className="w-full"
              variant="outline"
            >
              <Activity className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Demo Activity'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Manually trigger simulated ticket purchases and prize pool updates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}