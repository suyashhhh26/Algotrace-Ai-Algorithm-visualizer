import { motion } from 'framer-motion';
import type { SortingBar } from '@/algorithms/types';

interface SortingVisualizerProps {
  bars: SortingBar[];
}

export function SortingVisualizer({ bars }: SortingVisualizerProps) {
  if (!bars || bars.length === 0) return null;

  const maxVal = Math.max(...bars.map((b) => b.value));

  const getBarColor = (state: SortingBar['state']) => {
    switch (state) {
      case 'comparing':
        return 'from-yellow-400 to-amber-500';
      case 'swapping':
        return 'from-purple-400 to-fuchsia-500';
      case 'sorted':
        return 'from-green-400 to-emerald-500';
      case 'current':
        return 'from-orange-400 to-red-500';
      case 'minimum':
        return 'from-red-400 to-rose-500';
      case 'pivot':
        return 'from-cyan-400 to-blue-500';
      default:
        return 'from-primary to-primary-light';
    }
  };

  const getBarShadow = (state: SortingBar['state']) => {
    switch (state) {
      case 'comparing':
        return '0 0 15px rgba(250, 204, 21, 0.3)';
      case 'swapping':
        return '0 0 15px rgba(168, 85, 247, 0.3)';
      case 'sorted':
        return '0 0 15px rgba(34, 197, 94, 0.3)';
      case 'current':
        return '0 0 15px rgba(251, 146, 60, 0.3)';
      case 'pivot':
        return '0 0 15px rgba(6, 182, 212, 0.3)';
      default:
        return 'none';
    }
  };

  return (
    <div className="w-full h-full flex items-end justify-center gap-[2px] sm:gap-1 p-4 pb-8">
      {bars.map((bar, index) => {
        const heightPercent = (bar.value / maxVal) * 85;
        return (
          <motion.div
            key={bar.originalIndex}
            layout
            transition={{
              layout: { type: 'spring', bounce: 0.2, duration: 0.6 },
            }}
            className="relative flex flex-col items-center"
            style={{ flex: `1 1 ${100 / bars.length}%`, maxWidth: '60px' }}
          >
            <motion.div
              className={`w-full rounded-t-lg bg-gradient-to-t ${getBarColor(bar.state)} relative`}
              animate={{
                height: `${heightPercent}%`,
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{
                minHeight: '8px',
                boxShadow: getBarShadow(bar.state),
                height: `${heightPercent}%`,
              }}
            >
              {/* Value label on top */}
              {bars.length <= 30 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-text-secondary">
                  {bar.value}
                </span>
              )}
            </motion.div>
            {/* Index label */}
            {bars.length <= 20 && (
              <span className="mt-1 text-[9px] text-text-tertiary font-mono">{index}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
