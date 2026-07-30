export type Language = 'python' | 'cpp' | 'java' | 'javascript';

export type VisualizationType = 'grid' | 'graph' | 'bars' | 'tree' | 'puzzle' | 'array' | 'board' | 'custom';

export type AlgorithmCategory =
  | 'ai'
  | 'graph'
  | 'sorting'
  | 'searching'
  | 'trees'
  | 'dp'
  | 'backtracking'
  | 'linked-list'
  | 'stack'
  | 'queue'
  | 'recursion'
  | 'greedy';

// ============================================
// Visualization State Types
// ============================================

export interface GridCell {
  row: number;
  col: number;
  type: 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'current' | 'path' | 'frontier';
  g?: number;
  h?: number;
  f?: number;
  weight?: number;
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  state: 'unvisited' | 'visiting' | 'visited' | 'current' | 'path';
  distance?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  state: 'default' | 'visiting' | 'visited' | 'path';
  directed?: boolean;
}

export interface SortingBar {
  value: number;
  state: 'default' | 'comparing' | 'swapping' | 'sorted' | 'current' | 'minimum' | 'pivot';
  originalIndex: number;
}

export interface PuzzleTile {
  value: number;
  row: number;
  col: number;
}

export interface BoardCell {
  row: number;
  col: number;
  value: number | string | null;
  state: 'empty' | 'placed' | 'conflict' | 'valid' | 'trying' | 'removed';
}

export interface ArrayElement {
  value: number;
  state: 'default' | 'current' | 'found' | 'eliminated' | 'comparing' | 'target' | 'pointer-left' | 'pointer-right' | 'pointer-mid';
  label?: string;
}

// ============================================
// Algorithm Step
// ============================================

export interface AlgorithmStep {
  id: number;
  description: string;
  highlightLines: number[];
  variables: Record<string, unknown>;
  explanation: string;

  // Visualization state (each algorithm uses the relevant one)
  grid?: GridCell[][];
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
  bars?: SortingBar[];
  puzzle?: PuzzleTile[];
  board?: BoardCell[][];
  array?: ArrayElement[];

  // Data structure states
  queue?: unknown[];
  stack?: unknown[];
  priorityQueue?: { item: unknown; priority: number }[];
  visited?: unknown[];
  currentNode?: unknown;
  output?: unknown;

  // Stats
  comparisons?: number;
  swaps?: number;
  complexity?: { time: string; space: string };
}

// ============================================
// Algorithm Theory
// ============================================

export interface AlgorithmTheory {
  introduction: string;
  working: string;
  applications: string[];
  advantages: string[];
  disadvantages: string[];
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  pseudocode: string;
  realWorldExample?: string;
}

// ============================================
// Algorithm Configuration
// ============================================

export interface AlgorithmConfig {
  id: string;
  name: string;
  category: AlgorithmCategory;
  subcategory?: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  theory: AlgorithmTheory;
  code: Record<Language, string>;
  visualizationType: VisualizationType;
  generateSteps: (input: unknown) => AlgorithmStep[];
  defaultInput: unknown;
  generateRandomInput?: () => unknown;
}

// ============================================
// Category Info
// ============================================

export interface CategoryInfo {
  id: AlgorithmCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  algorithmCount: number;
}
