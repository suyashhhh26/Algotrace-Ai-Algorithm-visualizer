import { motion } from 'framer-motion';
import type { PuzzleTile } from '@/algorithms/types';

interface PuzzleVisualizerProps {
  tiles: PuzzleTile[];
  size?: number;
}

export function PuzzleVisualizer({ tiles, size = 3 }: PuzzleVisualizerProps) {
  if (!tiles || tiles.length === 0) return null;

  const cellSize = Math.min(100, Math.floor(360 / size));

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div
        className="relative rounded-2xl border border-white/[0.1] overflow-hidden bg-white/[0.02]"
        style={{
          width: cellSize * size + 4,
          height: cellSize * size + 4,
        }}
      >
        {tiles.map((tile) => {
          if (tile.value === 0) return null; // Empty tile
          return (
            <motion.div
              key={tile.value}
              layout
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="absolute flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 border border-white/[0.1] cursor-pointer hover:from-primary/50 hover:to-accent/40"
              style={{
                width: cellSize - 4,
                height: cellSize - 4,
                left: tile.col * cellSize + 2,
                top: tile.row * cellSize + 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-xl sm:text-2xl font-bold text-white font-mono">
                {tile.value}
              </span>
            </motion.div>
          );
        })}
        {/* Empty tile indicator */}
        {tiles
          .filter((t) => t.value === 0)
          .map((tile) => (
            <div
              key="empty"
              className="absolute rounded-xl border-2 border-dashed border-white/[0.08]"
              style={{
                width: cellSize - 4,
                height: cellSize - 4,
                left: tile.col * cellSize + 2,
                top: tile.row * cellSize + 2,
              }}
            />
          ))}
      </div>
    </div>
  );
}
