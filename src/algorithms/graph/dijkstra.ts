import type { AlgorithmConfig, AlgorithmStep, GraphNode, GraphEdge } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

const defaultNodes: GraphNode[] = [
  { id: 'A', label: 'A', x: 100, y: 150, state: 'unvisited', distance: Infinity },
  { id: 'B', label: 'B', x: 250, y: 50, state: 'unvisited', distance: Infinity },
  { id: 'C', label: 'C', x: 250, y: 250, state: 'unvisited', distance: Infinity },
  { id: 'D', label: 'D', x: 400, y: 150, state: 'unvisited', distance: Infinity },
  { id: 'E', label: 'E', x: 550, y: 150, state: 'unvisited', distance: Infinity },
];

const defaultEdges: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4, state: 'default' },
  { from: 'A', to: 'C', weight: 2, state: 'default' },
  { from: 'B', to: 'C', weight: 5, state: 'default' },
  { from: 'B', to: 'D', weight: 10, state: 'default' },
  { from: 'C', to: 'D', weight: 3, state: 'default' },
  { from: 'D', to: 'E', weight: 1, state: 'default' },
];

const generateDijkstraSteps = (): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  
  const nodes = JSON.parse(JSON.stringify(defaultNodes)) as GraphNode[];
  const edges = JSON.parse(JSON.stringify(defaultEdges)) as GraphEdge[];
  
  const adjacencyList: Record<string, { to: string, weight: number }[]> = {};
  nodes.forEach(n => adjacencyList[n.id] = []);
  edges.forEach(e => {
    adjacencyList[e.from].push({ to: e.to, weight: e.weight! });
    adjacencyList[e.to].push({ to: e.from, weight: e.weight! }); // undirected
  });

  let stepId = 0;
  const pq: { item: string, priority: number }[] = [];
  const visited = new Set<string>();
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};

  nodes.forEach(n => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
  });

  const updateNodeState = (id: string, state: GraphNode['state'], distance?: number) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      if (state) node.state = state;
      if (distance !== undefined) node.distance = distance;
    }
  };

  const updateEdgeState = (u: string, v: string, state: GraphEdge['state']) => {
    const edge = edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (edge) edge.state = state;
  };
  
  const cloneState = () => ({
      graphNodes: JSON.parse(JSON.stringify(nodes)),
      graphEdges: JSON.parse(JSON.stringify(edges)),
      priorityQueue: [...pq].sort((a,b) => a.priority - b.priority),
      visited: Array.from(visited),
  });

  const startNode = 'A';
  const targetNode = 'E'; // Visualize finding shortest path to E
  
  dist[startNode] = 0;
  updateNodeState(startNode, 'visiting', 0);
  pq.push({ item: startNode, priority: 0 });

  steps.push({
    id: stepId++,
    description: `Initialize Dijkstra from start node ${startNode}`,
    explanation: `Set distance to start node as 0, all others to infinity. Push ${startNode} to priority queue.`,
    highlightLines: [2, 3, 4],
    variables: { startNode, current: null },
    ...cloneState(),
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a.priority - b.priority);
    const { item: u, priority: d } = pq.shift()!;
    
    if (visited.has(u)) continue;

    updateNodeState(u, 'current');
    visited.add(u);

    steps.push({
      id: stepId++,
      description: `Extract min from PQ: Node ${u}`,
      explanation: `Node ${u} has the smallest known distance (${d}). We will now explore its neighbors.`,
      highlightLines: [6, 7],
      variables: { u, dist_u: d },
      ...cloneState(),
      complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
    });

    if (u === targetNode) {
         steps.push({
            id: stepId++,
            description: `Target node ${targetNode} reached!`,
            explanation: `We found the shortest path to ${targetNode}. Distance is ${d}.`,
            highlightLines: [8],
            variables: { u, targetNode, distance: d },
            ...cloneState(),
            complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
          });
          break; // Stop when target reached for visual clarity
    }

    const neighbors = adjacencyList[u];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const weight = neighbor.weight;

      if (!visited.has(v)) {
        updateEdgeState(u, v, 'visiting');
        
        steps.push({
          id: stepId++,
          description: `Examine edge ${u} - ${v} (weight: ${weight})`,
          explanation: `Calculate alternative distance to ${v}: dist[${u}] + weight = ${dist[u]} + ${weight} = ${dist[u] + weight}. Current dist[${v}] is ${dist[v] === Infinity ? '∞' : dist[v]}.`,
          highlightLines: [10, 11],
          variables: { u, v, weight, alt: dist[u] + weight, dist_v: dist[v] },
          ...cloneState(),
          complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
        });

        if (dist[u] + weight < dist[v]) {
          dist[v] = dist[u] + weight;
          prev[v] = u;
          updateNodeState(v, 'visiting', dist[v]);
          
          // Add to PQ (or update if existed, simpler to just push in standard Dijkstra with visited array)
          pq.push({ item: v, priority: dist[v] });

          steps.push({
            id: stepId++,
            description: `Relax edge ${u} - ${v}`,
            explanation: `Found a shorter path to ${v}. Update its distance to ${dist[v]} and add to PQ.`,
            highlightLines: [12, 13, 14],
            variables: { u, v, dist_v: dist[v] },
            ...cloneState(),
            complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
          });
        }
        updateEdgeState(u, v, 'default'); // Reset edge for next
      }
    }
    
    updateNodeState(u, 'visited');
    steps.push({
      id: stepId++,
      description: `Finished processing node ${u}`,
      explanation: `All neighbors of ${u} processed. Mark ${u} as permanently visited.`,
      highlightLines: [15],
      variables: { u },
      ...cloneState(),
      complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
    });
  }

  // Backtrack path
  let pathNode: string | null = targetNode;
  const path: string[] = [];
  while (pathNode !== null) {
      path.unshift(pathNode);
      const parent: string | null = prev[pathNode as string] || null;
      if (parent) {
          updateEdgeState(parent, pathNode, 'path');
      }
      updateNodeState(pathNode, 'path');
      pathNode = parent;
  }

  steps.push({
    id: stepId++,
    description: `Shortest Path Found`,
    explanation: `Path from ${startNode} to ${targetNode}: ${path.join(' -> ')} with total cost ${dist[targetNode]}.`,
    highlightLines: [16],
    variables: { path, totalCost: dist[targetNode] },
    ...cloneState(),
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' }
  });

  return steps;
};

export const dijkstraConfig: AlgorithmConfig = {
  id: 'dijkstra',
  name: "Dijkstra's Algorithm",
  category: 'graph',
  description: 'An algorithm for finding the shortest paths between nodes in a graph, which may represent, for example, road networks.',
  difficulty: 'medium',
  visualizationType: 'graph',
  defaultInput: null,
  generateSteps: generateDijkstraSteps,
  theory: {
    introduction: 'Dijkstra\'s algorithm finds the shortest path from a starting node to all other nodes (or a specific target node) in a weighted graph. It uses a Priority Queue (min-heap) to greedily select the closest unvisited node.',
    working: '1. Mark all nodes unvisited. Create a set of all the unvisited nodes.\n2. Assign to every node a tentative distance value: set it to zero for our initial node and to infinity for all other nodes.\n3. Extract the node with the smallest distance from the unvisited set.\n4. For the current node, consider all of its unvisited neighbors and calculate their tentative distances through the current node.\n5. If the newly calculated distance to a neighbor is less than its current assigned distance, update the distance.\n6. Mark the current node as visited. A visited node\'s distance will not be checked again.',
    applications: ['GPS Navigation systems', 'Routing protocols in networks (OSPF)', 'Finding shortest path in maps'],
    advantages: ['Guarantees the shortest path in a graph with non-negative weights', 'Very efficient with a Fibonacci heap'],
    disadvantages: ['Fails if the graph contains negative weight edges', 'Explores uniformly in all directions (unlike A*)'],
    timeComplexity: {
      best: 'O((V + E) log V)',
      average: 'O((V + E) log V)',
      worst: 'O(V²)' // Without min-priority queue
    },
    spaceComplexity: 'O(V)',
    pseudocode: `function Dijkstra(Graph, source):
    dist[source] ← 0
    for each vertex v in Graph:
        if v ≠ source
            dist[v] ← infinity
        add v to Q (Priority Queue)
        
    while Q is not empty:
        u ← Q.extract_min()
        for each neighbor v of u:
            alt ← dist[u] + length(u, v)
            if alt < dist[v]:
                dist[v] ← alt
                Q.decrease_priority(v, alt)
    return dist`,
  },
  code: {
    python: `import heapq

def dijkstra(graph, start):
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    
    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        if current_distance > distances[current_node]:
            continue
            
        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight
            
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
                
    return distances`,
    cpp: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

typedef pair<int, int> iPair;

void dijkstra(vector<vector<iPair>>& adj, int V, int src) {
    priority_queue<iPair, vector<iPair>, greater<iPair>> pq;
    vector<int> dist(V, INT_MAX);
    
    pq.push(make_pair(0, src));
    dist[src] = 0;
    
    while (!pq.empty()) {
        int u = pq.top().second;
        pq.pop();
        
        for (auto x : adj[u]) {
            int v = x.first;
            int weight = x.second;
            
            if (dist[v] > dist[u] + weight) {
                dist[v] = dist[u] + weight;
                pq.push(make_pair(dist[v], v));
            }
        }
    }
}`,
    java: `import java.util.*;

class Node implements Comparable<Node> {
    int v, weight;
    Node(int v, int w) { this.v = v; this.weight = w; }
    public int compareTo(Node n) { return this.weight - n.weight; }
}

void dijkstra(ArrayList<ArrayList<Node>> adj, int V, int src) {
    int[] dist = new int[V];
    Arrays.fill(dist, Integer.MAX_VALUE);
    PriorityQueue<Node> pq = new PriorityQueue<>();
    
    dist[src] = 0;
    pq.add(new Node(src, 0));
    
    while (!pq.isEmpty()) {
        int u = pq.poll().v;
        
        for (Node neighbor : adj.get(u)) {
            int v = neighbor.v;
            int weight = neighbor.weight;
            
            if (dist[v] > dist[u] + weight) {
                dist[v] = dist[u] + weight;
                pq.add(new Node(v, dist[v]));
            }
        }
    }
}`,
    javascript: `class PriorityQueue { /* Basic min-heap implementation */ }

function dijkstra(graph, start) {
    const distances = {};
    const pq = new PriorityQueue(); // Assume pq.enqueue(item, priority) and pq.dequeue()
    
    for (let node in graph) {
        distances[node] = Infinity;
    }
    distances[start] = 0;
    pq.enqueue(start, 0);
    
    while (!pq.isEmpty()) {
        const { item: current, priority: dist } = pq.dequeue();
        
        if (dist > distances[current]) continue;
        
        for (let neighbor in graph[current]) {
            const newDist = dist + graph[current][neighbor];
            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                pq.enqueue(neighbor, newDist);
            }
        }
    }
    return distances;
}`
  }
};

registerAlgorithmConfig(dijkstraConfig.id, dijkstraConfig);
