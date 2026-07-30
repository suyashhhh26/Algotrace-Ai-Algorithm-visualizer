import {
  Brain,
  GitBranch,
  Search,
  ArrowUpDown,
  TreePine,
  Layers,
  Undo2,
  Link,
  Box,
  Inbox,
  RotateCcw,
  Zap,
} from 'lucide-react';

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: typeof Brain;
  gradient: string;
  algorithms: AlgorithmMeta[];
}

export interface AlgorithmMeta {
  id: string;
  name: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  implemented: boolean;
}

export const categories: CategoryData[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    description: 'AI search and optimization algorithms',
    icon: Brain,
    gradient: 'from-purple-500 to-indigo-600',
    algorithms: [
      { id: 'a-star', name: 'A* Search', category: 'ai', difficulty: 'hard', implemented: true },
      { id: 'ao-star', name: 'AO* Search', category: 'ai', difficulty: 'hard', implemented: false },
      { id: 'best-first-search', name: 'Best First Search', category: 'ai', difficulty: 'medium', implemented: false },
      { id: 'hill-climbing', name: 'Hill Climbing', category: 'ai', difficulty: 'medium', implemented: false },
      { id: 'minimax', name: 'Minimax', category: 'ai', difficulty: 'hard', implemented: false },
      { id: 'alpha-beta', name: 'Alpha-Beta Pruning', category: 'ai', difficulty: 'hard', implemented: false },
      { id: 'genetic', name: 'Genetic Algorithm', category: 'ai', difficulty: 'hard', implemented: false },
      { id: 'simulated-annealing', name: 'Simulated Annealing', category: 'ai', difficulty: 'hard', implemented: false },
      { id: 'csp', name: 'Constraint Satisfaction', category: 'ai', difficulty: 'hard', implemented: false },
      { id: '8-puzzle', name: '8 Puzzle', category: 'ai', difficulty: 'medium', implemented: true },
      { id: 'water-jug', name: 'Water Jug', category: 'ai', difficulty: 'easy', implemented: false },
      { id: 'missionaries', name: 'Missionaries & Cannibals', category: 'ai', difficulty: 'medium', implemented: false },
      { id: 'cryptarithmetic', name: 'Cryptarithmetic', category: 'ai', difficulty: 'hard', implemented: false },
      { id: 'tic-tac-toe', name: 'Tic Tac Toe AI', category: 'ai', difficulty: 'medium', implemented: false },
    ],
  },
  {
    id: 'graph',
    name: 'Graph Algorithms',
    description: 'Traversal, shortest path, and spanning tree algorithms',
    icon: GitBranch,
    gradient: 'from-blue-500 to-cyan-500',
    algorithms: [
      { id: 'bfs', name: 'Breadth-First Search', category: 'graph', difficulty: 'easy', implemented: true },
      { id: 'dfs', name: 'Depth-First Search', category: 'graph', difficulty: 'easy', implemented: true },
      { id: 'dijkstra', name: "Dijkstra's Algorithm", category: 'graph', difficulty: 'medium', implemented: true },
      { id: 'bellman-ford', name: 'Bellman-Ford', category: 'graph', difficulty: 'medium', implemented: false },
      { id: 'floyd-warshall', name: 'Floyd-Warshall', category: 'graph', difficulty: 'medium', implemented: false },
      { id: 'prim', name: "Prim's MST", category: 'graph', difficulty: 'medium', implemented: false },
      { id: 'kruskal', name: "Kruskal's MST", category: 'graph', difficulty: 'medium', implemented: false },
      { id: 'topological-sort', name: 'Topological Sort', category: 'graph', difficulty: 'medium', implemented: false },
      { id: 'kosaraju', name: "Kosaraju's SCC", category: 'graph', difficulty: 'hard', implemented: false },
      { id: 'tarjan', name: "Tarjan's SCC", category: 'graph', difficulty: 'hard', implemented: false },
      { id: 'union-find', name: 'Union-Find', category: 'graph', difficulty: 'medium', implemented: false },
      { id: 'bidirectional', name: 'Bidirectional Search', category: 'graph', difficulty: 'medium', implemented: false },
    ],
  },
  {
    id: 'searching',
    name: 'Searching Algorithms',
    description: 'Linear, binary, and advanced search techniques',
    icon: Search,
    gradient: 'from-emerald-500 to-teal-500',
    algorithms: [
      { id: 'linear-search', name: 'Linear Search', category: 'searching', difficulty: 'easy', implemented: false },
      { id: 'binary-search', name: 'Binary Search', category: 'searching', difficulty: 'easy', implemented: true },
      { id: 'jump-search', name: 'Jump Search', category: 'searching', difficulty: 'medium', implemented: false },
      { id: 'interpolation-search', name: 'Interpolation Search', category: 'searching', difficulty: 'medium', implemented: false },
      { id: 'exponential-search', name: 'Exponential Search', category: 'searching', difficulty: 'medium', implemented: false },
    ],
  },
  {
    id: 'sorting',
    name: 'Sorting Algorithms',
    description: 'Comparison and non-comparison based sorting',
    icon: ArrowUpDown,
    gradient: 'from-orange-500 to-amber-500',
    algorithms: [
      { id: 'bubble-sort', name: 'Bubble Sort', category: 'sorting', difficulty: 'easy', implemented: true },
      { id: 'selection-sort', name: 'Selection Sort', category: 'sorting', difficulty: 'easy', implemented: false },
      { id: 'insertion-sort', name: 'Insertion Sort', category: 'sorting', difficulty: 'easy', implemented: false },
      { id: 'merge-sort', name: 'Merge Sort', category: 'sorting', difficulty: 'medium', implemented: true },
      { id: 'quick-sort', name: 'Quick Sort', category: 'sorting', difficulty: 'medium', implemented: true },
      { id: 'heap-sort', name: 'Heap Sort', category: 'sorting', difficulty: 'medium', implemented: false },
      { id: 'counting-sort', name: 'Counting Sort', category: 'sorting', difficulty: 'easy', implemented: false },
      { id: 'radix-sort', name: 'Radix Sort', category: 'sorting', difficulty: 'medium', implemented: false },
      { id: 'bucket-sort', name: 'Bucket Sort', category: 'sorting', difficulty: 'medium', implemented: false },
      { id: 'shell-sort', name: 'Shell Sort', category: 'sorting', difficulty: 'medium', implemented: false },
    ],
  },
  {
    id: 'trees',
    name: 'Tree Data Structures',
    description: 'Binary trees, balanced trees, and advanced structures',
    icon: TreePine,
    gradient: 'from-green-500 to-emerald-600',
    algorithms: [
      { id: 'bst', name: 'Binary Search Tree', category: 'trees', difficulty: 'medium', implemented: false },
      { id: 'avl', name: 'AVL Tree', category: 'trees', difficulty: 'hard', implemented: false },
      { id: 'red-black', name: 'Red-Black Tree', category: 'trees', difficulty: 'hard', implemented: false },
      { id: 'trie', name: 'Trie', category: 'trees', difficulty: 'medium', implemented: false },
      { id: 'heap', name: 'Heap', category: 'trees', difficulty: 'medium', implemented: false },
      { id: 'segment-tree', name: 'Segment Tree', category: 'trees', difficulty: 'hard', implemented: false },
      { id: 'fenwick-tree', name: 'Fenwick Tree', category: 'trees', difficulty: 'hard', implemented: false },
      { id: 'b-tree', name: 'B-Tree', category: 'trees', difficulty: 'hard', implemented: false },
    ],
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    description: 'Optimization through memoization and tabulation',
    icon: Layers,
    gradient: 'from-violet-500 to-purple-600',
    algorithms: [
      { id: 'fibonacci', name: 'Fibonacci', category: 'dp', difficulty: 'easy', implemented: false },
      { id: 'knapsack', name: '0/1 Knapsack', category: 'dp', difficulty: 'medium', implemented: false },
      { id: 'lcs', name: 'Longest Common Subsequence', category: 'dp', difficulty: 'medium', implemented: false },
      { id: 'matrix-chain', name: 'Matrix Chain Multiplication', category: 'dp', difficulty: 'hard', implemented: false },
      { id: 'coin-change', name: 'Coin Change', category: 'dp', difficulty: 'medium', implemented: false },
      { id: 'edit-distance', name: 'Edit Distance', category: 'dp', difficulty: 'medium', implemented: false },
      { id: 'rod-cutting', name: 'Rod Cutting', category: 'dp', difficulty: 'medium', implemented: false },
    ],
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    description: 'Constraint solving and exhaustive search',
    icon: Undo2,
    gradient: 'from-red-500 to-rose-600',
    algorithms: [
      { id: 'n-queens', name: 'N-Queens', category: 'backtracking', difficulty: 'medium', implemented: true },
      { id: 'sudoku', name: 'Sudoku Solver', category: 'backtracking', difficulty: 'hard', implemented: false },
      { id: 'rat-in-maze', name: 'Rat in a Maze', category: 'backtracking', difficulty: 'medium', implemented: false },
      { id: 'knight-tour', name: "Knight's Tour", category: 'backtracking', difficulty: 'hard', implemented: false },
      { id: 'maze-solver', name: 'Maze Solver', category: 'backtracking', difficulty: 'medium', implemented: false },
      { id: 'subset-sum', name: 'Subset Sum', category: 'backtracking', difficulty: 'medium', implemented: false },
      { id: 'hamiltonian', name: 'Hamiltonian Cycle', category: 'backtracking', difficulty: 'hard', implemented: false },
      { id: 'graph-coloring', name: 'Graph Coloring', category: 'backtracking', difficulty: 'hard', implemented: false },
    ],
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    description: 'Singly, doubly, and circular linked lists',
    icon: Link,
    gradient: 'from-sky-500 to-blue-600',
    algorithms: [],
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'LIFO data structure operations',
    icon: Box,
    gradient: 'from-fuchsia-500 to-pink-600',
    algorithms: [],
  },
  {
    id: 'queue',
    name: 'Queue',
    description: 'FIFO data structure operations',
    icon: Inbox,
    gradient: 'from-indigo-500 to-blue-600',
    algorithms: [],
  },
  {
    id: 'recursion',
    name: 'Recursion',
    description: 'Recursive problem solving patterns',
    icon: RotateCcw,
    gradient: 'from-cyan-500 to-teal-600',
    algorithms: [],
  },
  {
    id: 'greedy',
    name: 'Greedy Algorithms',
    description: 'Locally optimal choices for global optimum',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-500',
    algorithms: [],
  },
];

export function getAllAlgorithms(): AlgorithmMeta[] {
  return categories.flatMap((cat) => cat.algorithms);
}

export function getImplementedAlgorithms(): AlgorithmMeta[] {
  return getAllAlgorithms().filter((a) => a.implemented);
}

export function getCategoryById(id: string): CategoryData | undefined {
  return categories.find((c) => c.id === id);
}

export function getAlgorithmById(id: string): AlgorithmMeta | undefined {
  return getAllAlgorithms().find((a) => a.id === id);
}

export function searchAlgorithms(query: string): AlgorithmMeta[] {
  const lower = query.toLowerCase();
  return getAllAlgorithms().filter(
    (a) => a.name.toLowerCase().includes(lower) || a.category.toLowerCase().includes(lower)
  );
}
