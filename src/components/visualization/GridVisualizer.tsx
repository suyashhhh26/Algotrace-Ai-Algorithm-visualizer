import { motion } from 'framer-motion';
import type { GridCell } from '@/algorithms/types';

interface GridVisualizerProps {
  grid: GridCell[][];
  onCellClick?: (row: number, col: number) => void;
  showValues?: boolean;
}

export function GridVisualizer({ grid, onCellClick, showValues = false }: GridVisualizerProps) {
  if (!grid || grid.length === 0) return null;

  const rows = grid.length;
  const cols = grid[0].length;

  const getCellStyle = (cell: GridCell) => {
    switch (cell.type) {
      case 'start':
        return 'bg-green-500/60 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
      case 'end':
        return 'bg-red-500/60 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      case 'wall':
        return 'bg-white/15 border-white/20';
      case 'visited':
        return 'bg-blue-500/40 border-blue-400/50';
      case 'current':
        return 'bg-orange-500/60 border-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.4)]';
      case 'path':
        return 'bg-green-400/50 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
      case 'frontier':
        return 'bg-yellow-400/40 border-yellow-400/50';
      default:
        return 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08]';
    }
  };

  const cellSize = Math.min(Math.floor(500 / cols), Math.floor(400 / rows), 40);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div
        className="inline-grid gap-[1px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {grid.flat().map((cell) => (
          <motion.div
            key={`${cell.row}-${cell.col}`}
            onClick={() => onCellClick?.(cell.row, cell.col)}
            className={`rounded-sm border transition-colors cursor-pointer flex items-center justify-center ${getCellStyle(cell)}`}
            style={{ width: cellSize, height: cellSize }}
            initial={false}
            animate={{
              scale: cell.type === 'current' ? [1, 1.15, 1] : 1,
              opacity: cell.type === 'visited' ? [0.3, 0.7] : 1,
            }}
            transition={{
              duration: cell.type === 'current' ? 0.5 : 0.3,
              repeat: cell.type === 'current' ? Infinity : 0,
            }}
          >
            {showValues && cell.f !== undefined && cell.type !== 'wall' && (
              <div className="text-center leading-tight">
                <span className="text-[7px] text-text-tertiary font-mono block">{cell.f}</span>
              </div>
            )}
            {cell.type === 'start' && <span className="text-[10px]">S</span>}
            {cell.type === 'end' && <span className="text-[10px]">E</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
