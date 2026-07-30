import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Cog,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Database,
  Globe,
} from 'lucide-react';
import type { AlgorithmTheory } from '@/algorithms/types';

interface TheoryPanelProps {
  theory: AlgorithmTheory;
  algorithmName: string;
}

type Tab = 'intro' | 'working' | 'applications' | 'complexity';

export function TheoryPanel({ theory, algorithmName }: TheoryPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('intro');

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'intro', label: 'Intro', icon: BookOpen },
    { id: 'working', label: 'Working', icon: Cog },
    { id: 'applications', label: 'Uses', icon: Globe },
    { id: 'complexity', label: 'Complexity', icon: Clock },
  ];

  return (
    <div className="panel h-full flex flex-col">
      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">{algorithmName}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="theoryTab"
                  className="absolute inset-0 bg-primary/15 border border-primary/20 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className="w-3 h-3 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeTab === 'intro' && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-accent" />
                    Introduction
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{theory.introduction}</p>
                </div>
                {theory.realWorldExample && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">Real World Example</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{theory.realWorldExample}</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'working' && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cog className="w-3.5 h-3.5 text-accent" />
                  How it Works
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{theory.working}</p>
              </div>
            )}

            {activeTab === 'applications' && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-accent" />
                    Applications
                  </h3>
                  <ul className="space-y-1.5">
                    {theory.applications.map((app, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        {app}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-green-400 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Advantages
                    </h4>
                    <ul className="space-y-1">
                      {theory.advantages.map((adv, i) => (
                        <li key={i} className="text-[11px] text-text-secondary">{adv}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Disadvantages
                    </h4>
                    <ul className="space-y-1">
                      {theory.disadvantages.map((dis, i) => (
                        <li key={i} className="text-[11px] text-text-secondary">{dis}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'complexity' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    Time Complexity
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Best', value: theory.timeComplexity.best, color: 'text-green-400' },
                      { label: 'Average', value: theory.timeComplexity.average, color: 'text-yellow-400' },
                      { label: 'Worst', value: theory.timeComplexity.worst, color: 'text-red-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.06]">
                        <p className="text-[10px] text-text-tertiary mb-1">{label}</p>
                        <p className={`text-xs font-mono font-semibold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-accent" />
                    Space Complexity
                  </h3>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.06]">
                    <p className="text-xs font-mono font-semibold text-primary">{theory.spaceComplexity}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
