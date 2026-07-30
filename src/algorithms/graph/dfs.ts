import type { AlgorithmConfig, AlgorithmStep, GraphNode, GraphEdge } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

// Same default graph as BFS
const defaultNodes: GraphNode[] = [
  { id: 'A', label: 'A', x: 300, y: 50, state: 'unvisited' },
  { id: 'B', label: 'B', x: 200, y: 150, state: 'unvisited' },
  { id: 'C', label: 'C', x: 400, y: 150, state: 'unvisited' },
  { id: 'D', label: 'D', x: 150, y: 250, state: 'unvisited' },
  { id: 'E', label: 'E', x: 250, y: 250, state: 'unvisited' },
  { id: 'F', label: 'F', x: 400, y: 250, state: 'unvisited' },
  { id: 'G', label: 'G', x: 250, y: 350, state: 'unvisited' },
];

const defaultEdges: GraphEdge[] = [
  { from: 'A', to: 'B', state: 'default' },
  { from: 'A', to: 'C', state: 'default' },
  { from: 'B', to: 'D', state: 'default' },
  { from: 'B', to: 'E', state: 'default' },
  { from: 'C', to: 'F', state: 'default' },
  { from: 'E', to: 'G', state: 'default' },
];

const generateDFSSteps = (): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  
  const nodes = JSON.parse(JSON.stringify(defaultNodes)) as GraphNode[];
  const edges = JSON.parse(JSON.stringify(defaultEdges)) as GraphEdge[];
  
  const adjacencyList: Record<string, string[]> = {};
  nodes.forEach(n => adjacencyList[n.id] = []);
  edges.forEach(e => {
    // To make DFS traverse left-to-right visually like a standard tree, 
    // we sort or just keep the order.
    adjacencyList[e.from].push(e.to);
    adjacencyList[e.to].push(e.from); // undirected
  });

  let stepId = 0;
  const stack: string[] = [];
  const visited = new Set<string>();
  const output: string[] = [];

  const updateNodeState = (id: string, state: GraphNode['state']) => {
    const node = nodes.find(n => n.id === id);
    if (node) node.state = state;
  };

  const updateEdgeState = (u: string, v: string, state: GraphEdge['state']) => {
    const edge = edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (edge && edge.state !== 'visited') edge.state = state;
  };
  
  const cloneState = () => ({
      graphNodes: JSON.parse(JSON.stringify(nodes)),
      graphEdges: JSON.parse(JSON.stringify(edges)),
      stack: [...stack],
      visited: Array.from(visited),
      output: [...output]
  });

  const startNode = 'A';
  stack.push(startNode);

  steps.push({
    id: stepId++,
    description: `Initialize DFS from start node ${startNode}`,
    explanation: `Start at node ${startNode}. Add it to the stack.`,
    highlightLines: [2, 3],
    variables: { startNode, current: null },
    ...cloneState(),
    complexity: { time: 'O(V + E)', space: 'O(V)' }
  });

  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (!visited.has(current)) {
      visited.add(current);
      updateNodeState(current, 'current');
      output.push(current);

      steps.push({
        id: stepId++,
        description: `Pop and visit node ${current}`,
        explanation: `Pop ${current} from the stack and mark it as visited.`,
        highlightLines: [5, 6, 7],
        variables: { current },
        ...cloneState(),
        complexity: { time: 'O(V + E)', space: 'O(V)' }
      });

      const neighbors = adjacencyList[current];
      // Reverse neighbors before pushing to stack so we visit left-to-right (if originally ordered that way)
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
          updateEdgeState(current, neighbor, 'visiting');
          stack.push(neighbor);
          
          steps.push({
            id: stepId++,
            description: `Push unvisited neighbor ${neighbor} to stack`,
            explanation: `${neighbor} is an unvisited neighbor. We add it to the stack to explore later.`,
            highlightLines: [9, 10, 11],
            variables: { current, neighbor },
            ...cloneState(),
            complexity: { time: 'O(V + E)', space: 'O(V)' }
          });
          updateEdgeState(current, neighbor, 'visited');
        }
      }
      
      updateNodeState(current, 'visited');
      steps.push({
        id: stepId++,
        description: `Finished processing neighbors of ${current}`,
        explanation: `All unvisited neighbors have been pushed to the stack.`,
        highlightLines: [11],
        variables: { current },
        ...cloneState(),
        complexity: { time: 'O(V + E)', space: 'O(V)' }
      });

    } else {
        steps.push({
            id: stepId++,
            description: `Node ${current} is already visited.`,
            explanation: `Pop ${current} but skip because it is already in the visited set.`,
            highlightLines: [6],
            variables: { current },
            ...cloneState(),
            complexity: { time: 'O(V + E)', space: 'O(V)' }
          });
    }
  }

  steps.push({
    id: stepId++,
    description: `DFS Complete`,
    explanation: `The stack is empty. DFS traversal is complete. Output order: ${output.join(' -> ')}`,
    highlightLines: [12],
    variables: { output },
    ...cloneState(),
    complexity: { time: 'O(V + E)', space: 'O(V)' }
  });

  return steps;
};

export const dfsConfig: AlgorithmConfig = {
  id: 'dfs',
  name: 'Depth-First Search',
  category: 'graph',
  description: 'An algorithm for traversing or searching tree or graph data structures. The algorithm starts at the root node and explores as far as possible along each branch before backtracking.',
  difficulty: 'easy',
  visualizationType: 'graph',
  defaultInput: null,
  generateSteps: generateDFSSteps,
  theory: {
    introduction: 'Depth-First Search (DFS) is a graph traversal algorithm that explores as deeply as possible along each branch before backtracking. It can be implemented using recursion or an explicit Stack data structure.',
    working: '1. Start at a root node and push it to the stack.\n2. Pop a node from the stack.\n3. If it is not visited, mark it as visited.\n4. Push all its unvisited adjacent nodes onto the stack.\n5. Repeat steps 2-4 until the stack is empty.',
    applications: ['Finding connected components', 'Topological sorting', 'Finding bridges and articulation points', 'Solving puzzles (like mazes) with only one solution'],
    advantages: ['Requires less memory than BFS (only needs to store nodes from root to current node)', 'Easily implemented with recursion'],
    disadvantages: ['Can get stuck in infinite loops in infinite graphs (or graphs with cycles if visited set is not maintained)', 'Does not guarantee the shortest path'],
    timeComplexity: {
      best: 'O(V + E)',
      average: 'O(V + E)',
      worst: 'O(V + E)'
    },
    spaceComplexity: 'O(V)',
    pseudocode: `DFS(G, v):
    let S be a stack
    S.push(v)
    
    while S is not empty do
        v = S.pop()
        if v is not labeled as discovered then
            label v as discovered
            for all edges from v to w in G.adjacentEdges(v) do 
                S.push(w)`,
  },
  code: {
    python: `def dfs(graph, start):
    visited = set()
    stack = [start]
    
    while stack:
        vertex = stack.pop()
        if vertex not in visited:
            print(vertex, end=" ")
            visited.add(vertex)
            # Add neighbors to stack (reversed for left-to-right order)
            for neighbor in reversed(graph[vertex]):
                stack.append(neighbor)`,
    cpp: `#include <iostream>
#include <vector>
#include <stack>
using namespace std;

void DFS(vector<vector<int>>& graph, int start, int V) {
    vector<bool> visited(V, false);
    stack<int> s;
    s.push(start);
    
    while (!s.empty()) {
        int v = s.top();
        s.pop();
        
        if (!visited[v]) {
            cout << v << " ";
            visited[v] = true;
            
            // Push reverse to visit in natural order
            for (auto it = graph[v].rbegin(); it != graph[v].rend(); ++it) {
                if (!visited[*it]) {
                    s.push(*it);
                }
            }
        }
    }
}`,
    java: `import java.util.*;

void DFS(int start, ArrayList<ArrayList<Integer>> adj, int V) {
    boolean visited[] = new boolean[V];
    Stack<Integer> stack = new Stack<>();
    
    stack.push(start);
    
    while (!stack.isEmpty()) {
        int v = stack.pop();
        
        if (!visited[v]) {
            System.out.print(v + " ");
            visited[v] = true;
            
            ArrayList<Integer> neighbors = adj.get(v);
            for (int i = neighbors.size() - 1; i >= 0; i--) {
                int u = neighbors.get(i);
                if (!visited[u]) {
                    stack.push(u);
                }
            }
        }
    }
}`,
    javascript: `function dfs(graph, start) {
    const visited = new Set();
    const stack = [start];
    const result = [];
    
    while (stack.length > 0) {
        const vertex = stack.pop();
        
        if (!visited.has(vertex)) {
            visited.add(vertex);
            result.push(vertex);
            
            const neighbors = graph[vertex];
            for (let i = neighbors.length - 1; i >= 0; i--) {
                stack.push(neighbors[i]);
            }
        }
    }
    return result;
}`
  }
};

registerAlgorithmConfig(dfsConfig.id, dfsConfig);
