import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Shuffle,
  Maximize,
  Minimize,
} from 'lucide-react';

interface ControlsPanelProps {
  isPlaying: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onRandomize?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function ControlsPanel({
  isPlaying,
  speed,
  currentStep,
  totalSteps,
  progress,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  onSpeedChange,
  onRandomize,
  isFullscreen,
  onToggleFullscreen,
}: ControlsPanelProps) {
  const speeds = [0.25, 0.5, 1, 1.5, 2, 3, 4];

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onReset}
          className="btn-icon"
          title="Reset (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPrev}
          className="btn-icon"
          title="Previous Step (←)"
        >
          <SkipBack className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? onPause : onPlay}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          title="Play/Pause (Space)"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onNext}
          className="btn-icon"
          title="Next Step (→)"
        >
          <SkipForward className="w-4 h-4" />
        </motion.button>

        {onRandomize && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRandomize}
            className="btn-icon"
            title="Randomize"
          >
            <Shuffle className="w-4 h-4" />
          </motion.button>
        )}

        {onToggleFullscreen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleFullscreen}
            className="btn-icon"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </motion.button>
        )}
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>Speed</span>
          <span className="text-primary font-medium">{speed}x</span>
        </div>
        <div className="flex items-center gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`flex-1 py-1 text-xs rounded-lg transition-all duration-300 ${
                speed === s
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white/[0.03] text-text-tertiary hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="flex flex-wrap gap-2 text-[10px] text-text-tertiary">
        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Space: Play/Pause</span>
        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">←→: Step</span>
        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">R: Reset</span>
      </div>
    </div>
  );
}
