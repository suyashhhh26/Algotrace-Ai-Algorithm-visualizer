import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { getAlgorithmById, getCategoryById } from '@/data/algorithmCategories';
import { useAlgorithm } from '@/hooks/useAlgorithm';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

import { TheoryPanel } from '@/components/panels/TheoryPanel';
import { CodePanel } from '@/components/panels/CodePanel';
import { ControlsPanel } from '@/components/panels/ControlsPanel';
import { StatsPanel } from '@/components/panels/StatsPanel';

import { SortingVisualizer } from '@/components/visualization/SortingVisualizer';
import { GraphVisualizer } from '@/components/visualization/GraphVisualizer';
import { GridVisualizer } from '@/components/visualization/GridVisualizer';
import { PuzzleVisualizer } from '@/components/visualization/PuzzleVisualizer';
import { SearchVisualizer } from '@/components/visualization/SearchVisualizer';
import { BoardVisualizer } from '@/components/visualization/BoardVisualizer';

// We will dynamically import algorithm implementations later
const algorithmConfigs: Record<string, any> = {}; 

export function AlgorithmPage() {
  const { categoryId, algorithmId } = useParams();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);

  const meta = algorithmId ? getAlgorithmById(algorithmId) : undefined;
  const category = categoryId ? getCategoryById(categoryId) : undefined;

  useEffect(() => {
    if (!meta || !meta.implemented) {
      // Handle not implemented or not found
      return;
    }

    // Dynamic import simulation (in reality we'd import the config object directly if bundled)
    // For now we'll just check if it exists in our registry map
    const loadConfig = async () => {
        try {
            // In a real app we might do: const module = await import(`@/algorithms/${categoryId}/${algorithmId}`);
            // Here we'll assume algorithmConfigs gets populated by actual algorithm files registering themselves
            // or we export a giant map. We will create the map shortly.
            const cfg = algorithmConfigs[algorithmId!];
            if(cfg) {
                setConfig(cfg);
                setSteps(cfg.generateSteps(cfg.defaultInput));
            } else {
                 console.error("Config not found for", algorithmId);
            }
        } catch (e) {
            console.error(e);
        }
    };
    loadConfig();
  }, [algorithmId, categoryId, meta]);

  const algoState = useAlgorithm({ steps, speed: 1 });

  useKeyboardShortcuts({
    onPlayPause: algoState.togglePlay,
    onNextStep: algoState.nextStep,
    onPrevStep: algoState.prevStep,
    onReset: algoState.reset,
    onFullscreen: () => setIsFullscreen((prev) => !prev),
    onSpeedUp: () => algoState.setSpeed(Math.min(algoState.speed * 1.5, 4)),
    onSpeedDown: () => algoState.setSpeed(Math.max(algoState.speed / 1.5, 0.25)),
  });

  if (!meta || !category) {
    return (
      <div className="pt-32 pb-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Algorithm Not Found</h2>
        <p className="text-text-secondary mb-6">The requested algorithm does not exist or has an invalid URL.</p>
        <button onClick={() => navigate('/algorithms')} className="btn-primary">Back to Algorithms</button>
      </div>
    );
  }

  if (!meta.implemented || !config) {
    return (
      <div className="pt-32 pb-12 flex flex-col items-center justify-center text-center">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-6 opacity-50`}>
          <category.icon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">{meta.name}</h2>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-sm text-text-secondary mb-6">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Coming Soon
        </div>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          This algorithm is currently under development and will be available in a future update.
        </p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const renderVisualizer = () => {
    const s = algoState.currentStep;
    if (!s) return null;

    switch (config.visualizationType) {
      case 'bars':
        return <SortingVisualizer bars={s.bars || []} />;
      case 'graph':
        return <GraphVisualizer nodes={s.graphNodes || []} edges={s.graphEdges || []} />;
      case 'grid':
        return <GridVisualizer grid={s.grid || []} />;
      case 'puzzle':
        return <PuzzleVisualizer tiles={s.puzzle || []} />;
      case 'array':
        return <SearchVisualizer array={s.array || []} target={s.variables.target as number} />;
      case 'board':
        return <BoardVisualizer board={s.board || []} type={config.id === 'sudoku' ? 'sudoku' : 'queens'} />;
      default:
        return <div className="p-4 text-center text-text-tertiary">Visualizer not implemented for {config.visualizationType}</div>;
    }
  };

  return (
    <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-bg-primary p-2 sm:p-4' : 'pt-20 p-4 sm:p-6 lg:p-8 min-h-screen'}`}>
      <div className="max-w-[1920px] mx-auto h-full flex flex-col gap-4">
        
        {/* Header */}
        {!isFullscreen && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 text-sm text-text-tertiary mb-1">
                <span className="capitalize">{category.name}</span>
                <span>/</span>
                <span className="text-primary">{meta.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{meta.name}</h1>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className={`grid gap-4 flex-1 ${isFullscreen ? 'h-full grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-12 min-h-[600px]'}`}>
          
          {/* Theory Panel - Hidden in fullscreen */}
          {!isFullscreen && (
            <div className="lg:col-span-3 h-[400px] lg:h-auto order-2 lg:order-1">
              <TheoryPanel theory={config.theory} algorithmName={config.name} />
            </div>
          )}

          {/* Center Column: Visualizer & Controls */}
          <div className={`${isFullscreen ? 'lg:col-span-3' : 'lg:col-span-6'} flex flex-col gap-4 order-1 lg:order-2 h-[50vh] lg:h-auto`}>
            
            {/* Visualizer Canvas */}
            <div className="panel flex-1 relative overflow-hidden flex items-center justify-center min-h-[300px]">
              {/* Fullscreen Toggle overlay */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute top-4 right-4 z-10 btn-icon bg-bg-primary/80 backdrop-blur"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={algoState.currentStepIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {renderVisualizer()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="shrink-0">
              <ControlsPanel
                isPlaying={algoState.isPlaying}
                speed={algoState.speed}
                currentStep={algoState.currentStepIndex}
                totalSteps={algoState.totalSteps}
                progress={algoState.progress}
                onPlay={algoState.play}
                onPause={algoState.pause}
                onNext={algoState.nextStep}
                onPrev={algoState.prevStep}
                onReset={algoState.reset}
                onSpeedChange={algoState.setSpeed}
                onRandomize={config.generateRandomInput ? () => {
                    algoState.reset();
                    setSteps(config.generateSteps(config.generateRandomInput!()));
                } : undefined}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>
          </div>

          {/* Right Column: Code & Stats */}
          <div className={`${isFullscreen ? 'lg:col-span-1' : 'lg:col-span-3'} flex flex-col gap-4 order-3 lg:h-auto`}>
            <div className="flex-1 min-h-[300px]">
              <CodePanel 
                code={config.code}
                pseudocode={config.theory.pseudocode}
                highlightLines={algoState.currentStep?.highlightLines}
              />
            </div>
            <div className="shrink-0">
              <StatsPanel step={algoState.currentStep} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Temporary export to allow registering algorithms
export function registerAlgorithmConfig(id: string, config: any) {
    algorithmConfigs[id] = config;
}
