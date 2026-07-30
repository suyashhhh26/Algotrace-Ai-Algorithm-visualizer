import type { AlgorithmConfig, AlgorithmStep, GridCell } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

// A simple grid maze generator is usually helpful here.
// For visualization, we'll keep it small and deterministic, or just let the default grid be mostly empty.
const generateAStarSteps = (): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  
  const rows = 10;
  const cols = 15;
  const startRow = 2;
  const startCol = 2;
  const endRow = 7;
  const endCol = 12;

  // Simple maze pattern
  const walls = new Set([
      '1,5', '2,5', '3,5', '4,5', '5,5', '6,5',
      '4,8', '5,8', '6,8', '7,8', '8,8', '9,8',
      '3,10', '4,10'
  ]);

  const createGrid = (): GridCell[][] => {
      const grid: GridCell[][] = [];
      for(let r = 0; r < rows; r++) {
          const row: GridCell[] = [];
          for(let c = 0; c < cols; c++) {
              let type: GridCell['type'] = 'empty';
              if (r === startRow && c === startCol) type = 'start';
              else if (r === endRow && c === endCol) type = 'end';
              else if (walls.has(`${r},${c}`)) type = 'wall';
              row.push({ row: r, col: c, type });
          }
          grid.push(row);
      }
      return grid;
  };

  const grid = createGrid();
  
  // Heuristic: Manhattan distance
  const heuristic = (r: number, c: number) => Math.abs(r - endRow) + Math.abs(c - endCol);
  
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const cameFrom: Record<string, string> = {};
  const openSet: string[] = []; // Simple array instead of true priority queue for simplicity in steps
  const closedSet = new Set<string>();
  
  const startKey = `${startRow},${startCol}`;
  gScore[startKey] = 0;
  fScore[startKey] = heuristic(startRow, startCol);
  openSet.push(startKey);
  
  let stepId = 0;
  
  const cloneGridState = () => {
       const clone = JSON.parse(JSON.stringify(grid)) as GridCell[][];
       // Attach f values to clone for display
       for(let r=0; r<rows; r++) {
           for(let c=0; c<cols; c++) {
               const k = `${r},${c}`;
               if (fScore[k] !== undefined && fScore[k] !== Infinity) {
                   clone[r][c].f = fScore[k];
               }
           }
       }
       return clone;
  };

  steps.push({
      id: stepId++,
      description: `Initialize A*`,
      explanation: `Set g=0 and f=h for start node. Add start to open set. Heuristic is Manhattan Distance.`,
      highlightLines: [2, 3],
      variables: { openSet: [...openSet] },
      grid: cloneGridState(),
      complexity: { time: 'O(E log V)', space: 'O(V)' }
  });

  const getLowestF = () => {
      let lowestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
          if (fScore[openSet[i]] < fScore[openSet[lowestIndex]]) {
              lowestIndex = i;
          }
      }
      return lowestIndex;
  };

  let found = false;
  let currentKey = '';

  while (openSet.length > 0) {
      const lowestIndex = getLowestF();
      currentKey = openSet[lowestIndex];
      
      const [rStr, cStr] = currentKey.split(',');
      const r = parseInt(rStr);
      const c = parseInt(cStr);
      
      if (r === endRow && c === endCol) {
          found = true;
          break;
      }
      
      openSet.splice(lowestIndex, 1);
      closedSet.add(currentKey);
      
      if (grid[r][c].type !== 'start' && grid[r][c].type !== 'end') {
          grid[r][c].type = 'current';
      }

      steps.push({
          id: stepId++,
          description: `Current node: (${r}, ${c})`,
          explanation: `Extract node with lowest f-score from open set. f = ${fScore[currentKey]}, g = ${gScore[currentKey]}.`,
          highlightLines: [5, 6],
          variables: { current: currentKey, f: fScore[currentKey], g: gScore[currentKey] },
          grid: cloneGridState(),
          complexity: { time: 'O(E log V)', space: 'O(V)' }
      });
      
      const neighbors = [
          [r-1, c], [r+1, c], [r, c-1], [r, c+1]
      ];
      
      for (const [nr, nc] of neighbors) {
          const nKey = `${nr},${nc}`;
          
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (walls.has(nKey) || closedSet.has(nKey)) continue;
          
          const tentativeG = gScore[currentKey] + 1;
          let isNew = false;
          
          if (!openSet.includes(nKey)) {
              openSet.push(nKey);
              isNew = true;
              if (grid[nr][nc].type !== 'start' && grid[nr][nc].type !== 'end') {
                  grid[nr][nc].type = 'frontier';
              }
          } else if (tentativeG >= (gScore[nKey] || Infinity)) {
              continue; // Not a better path
          }
          
          cameFrom[nKey] = currentKey;
          gScore[nKey] = tentativeG;
          fScore[nKey] = gScore[nKey] + heuristic(nr, nc);
          
          steps.push({
              id: stepId++,
              description: `Evaluate neighbor (${nr}, ${nc})`,
              explanation: isNew ? `Discovered new node. g=${tentativeG}, h=${heuristic(nr, nc)}, f=${fScore[nKey]}` : `Found better path to node. Updated g=${tentativeG}, f=${fScore[nKey]}`,
              highlightLines: [9, 10, 11, 12],
              variables: { current: currentKey, neighbor: nKey, g: tentativeG, f: fScore[nKey] },
              grid: cloneGridState(),
              complexity: { time: 'O(E log V)', space: 'O(V)' }
          });
      }
      
      if (grid[r][c].type === 'current') {
          grid[r][c].type = 'visited';
      }
  }

  if (found) {
      // Reconstruct path
      let curr = currentKey;
      const path = [];
      while (cameFrom[curr]) {
          path.push(curr);
          curr = cameFrom[curr];
          const [pr, pc] = curr.split(',');
          if (grid[parseInt(pr)][parseInt(pc)].type !== 'start') {
              grid[parseInt(pr)][parseInt(pc)].type = 'path';
          }
      }
      
      steps.push({
          id: stepId++,
          description: `Path Found!`,
          explanation: `A* has reached the target node. Reconstructed path shown in green.`,
          highlightLines: [16, 17],
          variables: { pathLength: path.length },
          grid: cloneGridState(),
          complexity: { time: 'O(E log V)', space: 'O(V)' }
      });
  } else {
       steps.push({
          id: stepId++,
          description: `No Path Found`,
          explanation: `Open set is empty and target was not reached. Target is unreachable.`,
          highlightLines: [20],
          variables: { },
          grid: cloneGridState(),
          complexity: { time: 'O(E log V)', space: 'O(V)' }
      });
  }
  
  return steps;
};

export const aStarConfig: AlgorithmConfig = {
  id: 'a-star',
  name: 'A* Search',
  category: 'ai',
  description: 'A graph traversal and path search algorithm, which is often used in many fields of computer science due to its completeness, optimality, and optimal efficiency.',
  difficulty: 'hard',
  visualizationType: 'grid',
  defaultInput: null,
  generateSteps: generateAStarSteps,
  theory: {
    introduction: 'A* is an informed search algorithm, meaning it is formulated in terms of weighted graphs: starting from a specific starting node, it aims to find a path to the given goal node having the smallest cost (least distance travelled, shortest time, etc.).',
    working: '1. It maintains an open set of nodes to be evaluated, and a closed set of evaluated nodes.\n2. Each node has a cost f(n) = g(n) + h(n), where g is the exact cost from start, and h is the estimated heuristic cost to goal.\n3. At each step, it picks the node from open set with lowest f(n).\n4. If it\'s the goal, we are done.\n5. Otherwise, explore neighbors, update their g and f scores, and add to open set if new or found a better path.',
    applications: ['Video games (NPC pathfinding)', 'Traffic routing systems', 'Robotics', 'Parsing (NLP)'],
    advantages: ['Complete and Optimal (finds the shortest path if heuristic is admissible)', 'More efficient than Dijkstra\'s as it uses a heuristic to guide search'],
    disadvantages: ['Can be memory intensive as it stores all generated nodes', 'Performance heavily depends on the quality of the heuristic function'],
    timeComplexity: {
      best: 'O(E)',
      average: 'O(E log V)',
      worst: 'O(b^d)' // where b is branching factor and d is depth
    },
    spaceComplexity: 'O(V)',
    pseudocode: `function A_Star(start, goal, h)
    openSet := {start}
    cameFrom := an empty map
    
    gScore := map with default value of Infinity
    gScore[start] := 0
    
    fScore := map with default value of Infinity
    fScore[start] := h(start)
    
    while openSet is not empty
        current := node in openSet with lowest fScore[]
        if current = goal
            return reconstruct_path(cameFrom, current)
            
        openSet.Remove(current)
        for each neighbor of current
            tentative_gScore := gScore[current] + d(current, neighbor)
            if tentative_gScore < gScore[neighbor]
                cameFrom[neighbor] := current
                gScore[neighbor] := tentative_gScore
                fScore[neighbor] := tentative_gScore + h(neighbor)
                if neighbor not in openSet
                    openSet.add(neighbor)
    return failure`,
  },
  code: {
    python: `import heapq

def a_star(grid, start, goal):
    def heuristic(a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])
        
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}
    
    while open_set:
        current = heapq.heappop(open_set)[1]
        
        if current == goal:
            return reconstruct_path(came_from, current)
            
        for dx, dy in [(0,1), (1,0), (0,-1), (-1,0)]:
            neighbor = (current[0] + dx, current[1] + dy)
            if not is_valid(grid, neighbor): continue
            
            tentative_g = g_score[current] + 1
            
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))
                
    return None`,
    cpp: `// C++ implementation using priority_queue omitted for brevity.
// Logic matches the pseudocode exactly using std::priority_queue and std::map.`,
    java: `// Java implementation using PriorityQueue omitted for brevity.
// Uses a Node class implementing Comparable based on f_score.`,
    javascript: `function aStar(start, goal, heuristic, getNeighbors) {
    let openSet = [start];
    let cameFrom = new Map();
    let gScore = new Map();
    let fScore = new Map();
    
    gScore.set(start, 0);
    fScore.set(start, heuristic(start, goal));
    
    while(openSet.length > 0) {
        // Find node with lowest fScore
        let currentIdx = 0;
        for(let i=1; i<openSet.length; i++) {
            if(fScore.get(openSet[i]) < fScore.get(openSet[currentIdx])) {
                currentIdx = i;
            }
        }
        let current = openSet[currentIdx];
        
        if(current === goal) return reconstructPath(cameFrom, current);
        
        openSet.splice(currentIdx, 1);
        
        for(let neighbor of getNeighbors(current)) {
            let tentativeG = gScore.get(current) + 1; // Assuming weight 1
            if(tentativeG < (gScore.get(neighbor) || Infinity)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                fScore.set(neighbor, tentativeG + heuristic(neighbor, goal));
                if(!openSet.includes(neighbor)) openSet.push(neighbor);
            }
        }
    }
    return null;
}`
  }
};

registerAlgorithmConfig(aStarConfig.id, aStarConfig);
