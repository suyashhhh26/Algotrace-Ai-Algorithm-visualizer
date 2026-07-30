import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { categories } from '@/data/algorithmCategories';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['ai', 'graph', 'sorting']);
  const location = useLocation();

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const lower = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        algorithms: cat.algorithms.filter((a) => a.name.toLowerCase().includes(lower)),
      }))
      .filter((cat) => cat.algorithms.length > 0 || cat.name.toLowerCase().includes(lower));
  }, [searchQuery]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 btn-icon rounded-l-none rounded-r-xl border-l-0 hidden lg:flex"
        style={{ left: isOpen ? '280px' : '0px', transition: 'left 0.3s ease' }}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
          width: 280,
        }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        className="fixed top-16 left-0 bottom-0 z-40 glass-strong border-r border-white/[0.06] overflow-hidden flex flex-col"
      >
        {/* Search */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search algorithms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.includes(category.id);
            const hasAlgorithms = category.algorithms.length > 0;

            return (
              <div key={category.id}>
                <button
                  onClick={() => hasAlgorithms && toggleCategory(category.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] transition-all duration-300 group"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="flex-1 text-left truncate">{category.name}</span>
                  {hasAlgorithms && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
                    </motion.div>
                  )}
                  {!hasAlgorithms && (
                    <span className="text-xs text-text-tertiary">Soon</span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && hasAlgorithms && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 pl-3 border-l border-white/[0.06] space-y-0.5 py-1">
                        {category.algorithms.map((algo) => {
                          const isActive = location.pathname === `/algorithms/${algo.category}/${algo.id}`;
                          return (
                            <Link
                              key={algo.id}
                              to={algo.implemented ? `/algorithms/${algo.category}/${algo.id}` : '#'}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all duration-300 ${
                                isActive
                                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(108,99,255,0.15)]'
                                  : algo.implemented
                                  ? 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                                  : 'text-text-tertiary cursor-not-allowed opacity-50'
                              }`}
                            >
                              <span className="truncate">{algo.name}</span>
                              {!algo.implemented && <Lock className="w-3 h-3 flex-shrink-0" />}
                              {algo.implemented && (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    algo.difficulty === 'easy'
                                      ? 'bg-green-400'
                                      : algo.difficulty === 'medium'
                                      ? 'bg-yellow-400'
                                      : 'bg-red-400'
                                  }`}
                                />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Phase 1: 10 algorithms</span>
            <span className="text-primary">v1.0</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
