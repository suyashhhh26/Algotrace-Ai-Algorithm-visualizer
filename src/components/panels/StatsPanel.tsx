import { motion } from 'framer-motion';
import { Activity, Clock, Database, Hash, Eye, Cpu, ListOrdered, Layers } from 'lucide-react';
import type { AlgorithmStep } from '@/algorithms/types';

interface StatsPanelProps {
  step: AlgorithmStep | null;
}

export function StatsPanel({ step }: StatsPanelProps) {
  if (!step) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-text-tertiary">Run the algorithm to see statistics</p>
      </div>
    );
  }

  const statItems = [
    ...(step.comparisons !== undefined
      ? [{ label: 'Comparisons', value: step.comparisons, icon: Hash, color: 'text-blue-400' }]
      : []),
    ...(step.swaps !== undefined
      ? [{ label: 'Swaps', value: step.swaps, icon: Activity, color: 'text-purple-400' }]
      : []),
    ...(step.visited && step.visited.length > 0
      ? [{ label: 'Visited', value: step.visited.length, icon: Eye, color: 'text-cyan-400' }]
      : []),
    ...(step.complexity
      ? [
          { label: 'Time', value: step.complexity.time, icon: Clock, color: 'text-yellow-400' },
          { label: 'Space', value: step.complexity.space, icon: Database, color: 'text-green-400' },
        ]
      : []),
  ];

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Step description */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Cpu className="w-3 h-3" />
          <span>Step {step.id + 1}</span>
        </div>
        <p className="text-sm text-text-secondary">{step.explanation}</p>
      </div>

      {/* Stats grid */}
      {statItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {statItems.map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              layout
              className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-[10px] text-text-tertiary">{label}</span>
              </div>
              <p className="text-sm font-mono font-semibold text-white">{value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Variables */}
      {Object.keys(step.variables).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-tertiary flex items-center gap-1">
            <Layers className="w-3 h-3" /> Variables
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(step.variables).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-2.5 py-1.5 border border-white/[0.04]">
                <span className="text-[11px] text-text-tertiary font-mono">{key}</span>
                <span className="text-[11px] text-accent font-mono font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue */}
      {step.queue && step.queue.length > 0 && (
        <DataStructureDisplay title="Queue" icon={ListOrdered} items={step.queue} color="text-blue-400" />
      )}

      {/* Stack */}
      {step.stack && step.stack.length > 0 && (
        <DataStructureDisplay title="Stack" icon={Layers} items={step.stack} color="text-purple-400" />
      )}

      {/* Priority Queue */}
      {step.priorityQueue && step.priorityQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-tertiary flex items-center gap-1">
            <ListOrdered className="w-3 h-3 text-yellow-400" /> Priority Queue
          </h4>
          <div className="flex flex-wrap gap-1">
            {step.priorityQueue.map((item, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[11px] font-mono text-yellow-400"
              >
                {String(item.item)}:{item.priority}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DataStructureDisplay({
  title,
  icon: Icon,
  items,
  color,
}: {
  title: string;
  icon: typeof ListOrdered;
  items: unknown[];
  color: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-text-tertiary flex items-center gap-1">
        <Icon className={`w-3 h-3 ${color}`} /> {title}
      </h4>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[11px] font-mono text-text-secondary`}
          >
            {String(item)}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
