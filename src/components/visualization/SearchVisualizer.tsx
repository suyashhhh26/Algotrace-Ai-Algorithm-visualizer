import { motion } from 'framer-motion';
import type { ArrayElement } from '@/algorithms/types';

interface SearchVisualizerProps {
  array: ArrayElement[];
  target?: number;
}

export function SearchVisualizer({ array, target }: SearchVisualizerProps) {
  if (!array || array.length === 0) return null;

  const getColor = (state: ArrayElement['state']) => {
    switch (state) {
      case 'current': return 'from-orange-400 to-amber-500';
      case 'found': return 'from-green-400 to-emerald-500';
      case 'eliminated': return 'from-gray-600 to-gray-700';
      case 'comparing': return 'from-yellow-400 to-amber-500';
      case 'target': return 'from-red-400 to-rose-500';
      case 'pointer-left': return 'from-blue-400 to-blue-500';
      case 'pointer-right': return 'from-purple-400 to-purple-500';
      case 'pointer-mid': return 'from-cyan-400 to-cyan-500';
      default: return 'from-primary/60 to-primary-light/60';
    }
  };

  const getShadow = (state: ArrayElement['state']) => {
    switch (state) {
      case 'current': return '0 0 15px rgba(251, 146, 60, 0.3)';
      case 'found': return '0 0 20px rgba(34, 197, 94, 0.4)';
      case 'pointer-mid': return '0 0 15px rgba(6, 182, 212, 0.3)';
      default: return 'none';
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-6">
      {target !== undefined && (
        <div className="text-sm text-text-secondary">
          Searching for: <span className="text-accent font-mono font-bold text-lg">{target}</span>
        </div>
      )}
      <div className="flex items-center gap-1 sm:gap-2">
        {array.map((elem, i) => (
          <motion.div
            key={i}
            layout
            className={`relative flex flex-col items-center`}
          >
            {/* Pointer labels */}
            {elem.label && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[10px] font-mono mb-1 ${
                  elem.state === 'pointer-left' ? 'text-blue-400' :
                  elem.state === 'pointer-right' ? 'text-purple-400' :
                  elem.state === 'pointer-mid' ? 'text-cyan-400' :
                  'text-text-tertiary'
                }`}
              >
                {elem.label}
              </motion.span>
            )}
            <motion.div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${getColor(elem.state)} flex items-center justify-center border border-white/10`}
              animate={{
                scale: elem.state === 'found' ? [1, 1.2, 1] : elem.state === 'current' ? [1, 1.1, 1] : 1,
                opacity: elem.state === 'eliminated' ? 0.35 : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: elem.state === 'found' ? 2 : 0,
              }}
              style={{ boxShadow: getShadow(elem.state) }}
            >
              <span className={`text-sm font-mono font-bold ${elem.state === 'eliminated' ? 'text-gray-400' : 'text-white'}`}>
                {elem.value}
              </span>
            </motion.div>
            <span className="text-[9px] text-text-tertiary mt-1 font-mono">{i}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
