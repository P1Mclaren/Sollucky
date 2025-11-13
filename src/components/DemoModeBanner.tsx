import { useDemoMode } from '@/contexts/DemoModeContext';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
export function DemoModeBanner() {
  const {
    isDemoMode
  } = useDemoMode();
  if (!isDemoMode) return null;
  return;
}