import { useDemoMode } from '@/contexts/DemoModeContext';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function DemoModeBanner() {
  const { isDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 text-center font-bold text-sm shadow-lg"
    >
      <div className="flex items-center justify-center gap-2">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
        <span>DEMO MODE ACTIVE - SIMULATED DATA FOR PREVIEW</span>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}