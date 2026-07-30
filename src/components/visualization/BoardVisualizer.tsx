import { motion } from 'framer-motion';
import type { BoardCell } from '@/algorithms/types';

interface BoardVisualizerProps {
  board: BoardCell[][];
  type?: 'queens' | 'sudoku';
}

export function BoardVisualizer({ board, type = 'queens' }: BoardVisualizerProps) {
  if (!board || board.length === 0) return null;

  const size = board.length;
  const cellSize = Math.min(Math.floor(420 / size), 60);

  const getCellBg = (cell: BoardCell, isBlack: boolean) => {
    switch (cell.state) {
      case 'placed':
        return 'bg-green-500/30 border-green-400/40';
      case 'conflict':
        return 'bg-red-500/30 border-red-400/40';
      case 'trying':
        return 'bg-yellow-500/30 border-yellow-400/40 shadow-[0_0_12px_rgba(250,204,21,0.2)]';
      case 'valid':
        return 'bg-blue-500/20 border-blue-400/30';
      case 'removed':
        return 'bg-red-500/10 border-red-400/20';
      default:
        return isBlack ? 'bg-white/[0.06] border-white/[0.04]' : 'bg-white/[0.02] border-white/[0.04]';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div
        className="inline-grid border border-white/[0.1] rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
        }}
      >
        {board.flat().map((cell) => {
          const isBlack = (cell.row + cell.col) % 2 === 1;
          return (
            <motion.div
              key={`${cell.row}-${cell.col}`}
              className={`flex items-center justify-center border transition-all duration-300 ${getCellBg(cell, isBlack)}`}
              style={{ width: cellSize, height: cellSize }}
              animate={{
                scale: cell.state === 'trying' ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {type === 'queens' && cell.value === 'Q' && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="text-lg sm:text-xl"
                >
                  ♛
                </motion.span>
              )}
              {type === 'sudoku' && cell.value !== null && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-sm font-mono font-bold text-white"
                >
                  {cell.value}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
