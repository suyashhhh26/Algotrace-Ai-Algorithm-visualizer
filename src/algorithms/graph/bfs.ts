import type { AlgorithmConfig, AlgorithmStep, GraphNode, GraphEdge } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

// Simple predefined graph for visualization
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

const generateBFSSteps = (): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  
  // Create deep copies to avoid mutating defaults across runs
  const nodes = JSON.parse(JSON.stringify(defaultNodes)) as GraphNode[];
  const edges = JSON.parse(JSON.stringify(defaultEdges)) as GraphEdge[];
  
  const adjacencyList: Record<string, string[]> = {};
  nodes.forEach(n => adjacencyList[n.id] = []);
  edges.forEach(e => {
    adjacencyList[e.from].push(e.to);
    adjacencyList[e.to].push(e.from); // undirected
  });

  let stepId = 0;
  const queue: string[] = [];
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
      queue: [...queue],
      visited: Array.from(visited),
      output: [...output]
  });

  const startNode = 'A';
  queue.push(startNode);
  visited.add(startNode);
  updateNodeState(startNode, 'visiting');

  steps.push({
    id: stepId++,
    description: `Initialize BFS from start node ${startNode}`,
    explanation: `Start at node ${startNode}. Add it to the queue and mark it as visited.`,
    highlightLines: [2, 3, 4],
    variables: { startNode, current: null },
    ...cloneState(),
    complexity: { time: 'O(V + E)', space: 'O(V)' }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    updateNodeState(current, 'current');
    output.push(current);

    steps.push({
      id: stepId++,
      description: `Dequeue node ${current}`,
      explanation: `Remove ${current} from the front of the queue to explore its neighbors.`,
      highlightLines: [6, 7],
      variables: { current },
      ...cloneState(),
      complexity: { time: 'O(V + E)', space: 'O(V)' }
    });

    const neighbors = adjacencyList[current];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        updateEdgeState(current, neighbor, 'visiting');
        steps.push({
          id: stepId++,
          description: `Examine neighbor ${neighbor} of ${current}`,
          explanation: `${neighbor} is an unvisited neighbor of ${current}.`,
          highlightLines: [8, 9],
          variables: { current, neighbor },
          ...cloneState(),
          complexity: { time: 'O(V + E)', space: 'O(V)' }
        });

        visited.add(neighbor);
        queue.push(neighbor);
        updateNodeState(neighbor, 'visiting');
        updateEdgeState(current, neighbor, 'visited');

        steps.push({
          id: stepId++,
          description: `Add ${neighbor} to queue`,
          explanation: `Mark ${neighbor} as visited and add it to the queue.`,
          highlightLines: [10, 11],
          variables: { current, neighbor },
          ...cloneState(),
          complexity: { time: 'O(V + E)', space: 'O(V)' }
        });
      }
    }

    updateNodeState(current, 'visited');
    steps.push({
      id: stepId++,
      description: `Finished exploring ${current}`,
      explanation: `All neighbors of ${current} have been examined. Mark ${current} as fully visited.`,
      highlightLines: [12],
      variables: { current },
      ...cloneState(),
      complexity: { time: 'O(V + E)', space: 'O(V)' }
    });
  }

  steps.push({
    id: stepId++,
    description: `BFS Complete`,
    explanation: `The queue is empty. BFS traversal is complete. Output order: ${output.join(' -> ')}`,
    highlightLines: [13],
    variables: { output },
    ...cloneState(),
    complexity: { time: 'O(V + E)', space: 'O(V)' }
  });

  return steps;
};

export const bfsConfig: AlgorithmConfig = {
  id: 'bfs',
  name: 'Breadth-First Search',
  category: 'graph',
  description: 'An algorithm for traversing or searching tree or graph data structures. It starts at the tree root and explores all nodes at the present depth prior to moving on to the nodes at the next depth level.',
  difficulty: 'easy',
  visualizationType: 'graph',
  defaultInput: null,
  generateSteps: generateBFSSteps,
  theory: {
    introduction: 'Breadth-First Search (BFS) is a graph traversal algorithm that explores all the vertices of a graph at the current depth level before moving to the vertices at the next depth level. It uses a Queue data structure to keep track of nodes to visit.',
    working: '1. Start by putting the source node in a queue and mark it as visited.\n2. While the queue is not empty, dequeue a node.\n3. For every unvisited neighbor of the dequeued node, mark it as visited and enqueue it.\n4. Repeat until the queue is empty.',
    applications: ['Finding shortest path in unweighted graphs', 'Web crawlers', 'Social networking features (finding friends of friends)', 'Garbage collection (Cheney\'s algorithm)'],
    advantages: ['Finds the shortest path in an unweighted graph', 'Will never get trapped in an infinite loop in a finite graph'],
    disadvantages: ['Requires more memory than DFS (needs to store all nodes at current level)', 'Not suitable for very wide graphs or deep trees where target is far'],
    timeComplexity: {
      best: 'O(V + E)',
      average: 'O(V + E)',
      worst: 'O(V + E)'
    },
    spaceComplexity: 'O(V)',
    pseudocode: `BFS(G, start_v):
    let Q be a queue
    label start_v as discovered
    Q.enqueue(start_v)
    
    while Q is not empty do
        v = Q.dequeue()
        for all edges from v to w in G.adjacentEdges(v) do
            if w is not labeled as discovered then
                label w as discovered
                Q.enqueue(w)`,
  },
  code: {
    python: `from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    
    while queue:
        vertex = queue.popleft()
        print(vertex, end=" ")
        
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
    cpp: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

void BFS(vector<vector<int>>& graph, int start, int V) {
    vector<bool> visited(V, false);
    queue<int> q;
    
    visited[start] = true;
    q.push(start);
    
    while (!q.empty()) {
        int v = q.front();
        q.pop();
        cout << v << " ";
        
        for (int u : graph[v]) {
            if (!visited[u]) {
                visited[u] = true;
                q.push(u);
            }
        }
    }
}`,
    java: `import java.util.*;

void BFS(int start, ArrayList<ArrayList<Integer>> adj, int V) {
    boolean visited[] = new boolean[V];
    Queue<Integer> q = new LinkedList<>();
    
    visited[start] = true;
    q.add(start);
    
    while (!q.isEmpty()) {
        int v = q.poll();
        System.out.print(v + " ");
        
        for (int u : adj.get(v)) {
            if (!visited[u]) {
                visited[u] = true;
                q.add(u);
            }
        }
    }
}`,
    javascript: `function bfs(graph, start) {
    const visited = new Set([start]);
    const queue = [start];
    const result = [];
    
    while (queue.length > 0) {
        const vertex = queue.shift();
        result.push(vertex);
        
        for (const neighbor of graph[vertex]) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return result;
}`
  }
};

registerAlgorithmConfig(bfsConfig.id, bfsConfig);
