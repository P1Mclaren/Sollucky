import { useTestMode } from '@/contexts/TestModeContext';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function TestModeBanner() {
  const { isTestMode } = useTestMode();

  if (!isTestMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 px-4 text-center font-bold text-sm shadow-lg"
    >
      <div className="flex items-center justify-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <AlertTriangle className="w-5 h-5" />
        </motion.div>
        <span>TEST MODE ACTIVE - DEVNET ONLY - NO REAL FUNDS</span>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <AlertTriangle className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}