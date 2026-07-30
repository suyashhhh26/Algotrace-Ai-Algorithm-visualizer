import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CodePanel, TracerControls, useTracerKeyboard, useAutoPlay } from '../components/Tracer'
import ThemeToggle from '../components/ThemeToggle'

// ─── Source ───────────────────────────────────────────────────────────────────
const SOURCE_BFS = [
  'def bfs(graph, start):',
  '  visited = set()',
  '  queue = [start]',
  '  visited.add(start)',
  '',
  '  while queue:',
  '    node = queue.pop(0)',
  '',
  '    for neighbor in graph[node]:',
  '      if neighbor not in visited:',
  '        visited.add(neighbor)',
  '        queue.append(neighbor)',
]

const SOURCE_DFS = [
  'def dfs(graph, start):',
  '  visited = set()',
  '  stack = [start]',
  '',
  '  while stack:',
  '    node = stack.pop()',
  '',
  '    if node not in visited:',
  '      visited.add(node)',
  '',
  '      for neighbor in reversed(graph[node]):',
  '        if neighbor not in visited:',
  '          stack.append(neighbor)',
]

// ─── Graphs ───────────────────────────────────────────────────────────────────
interface NodePos { x: number; y: number }
interface GraphDef {
  label: string
  nodes: Record<string, NodePos>
  edges: [string, string][]
  start: string
}

const GRAPHS: Record<string, GraphDef> = {
  binary: {
    label: 'Binary Tree',
    start: 'A',
    nodes: {
      A: { x: 300, y: 40 },
      B: { x: 150, y: 120 },
      C: { x: 450, y: 120 },
      D: { x: 75,  y: 200 },
      E: { x: 225, y: 200 },
      F: { x: 375, y: 200 },
      G: { x: 525, y: 200 },
    },
    edges: [
      ['A','B'], ['A','C'],
      ['B','D'], ['B','E'],
      ['C','F'], ['C','G']
    ]
  },
  cyclic: {
    label: 'Cyclic Graph',
    start: 'A',
    nodes: {
      A: { x: 300, y: 40 },
      B: { x: 150, y: 140 },
      C: { x: 450, y: 140 },
      D: { x: 300, y: 140 },
      E: { x: 150, y: 240 },
      F: { x: 450, y: 240 },
      G: { x: 300, y: 240 },
      H: { x: 300, y: 320 },
    },
    edges: [
      ['A','B'], ['A','C'], ['A','D'],
      ['B','E'], ['B','D'],
      ['C','F'], ['C','D'],
      ['D','G'],
      ['E','G'], ['F','G'],
      ['G','H']
    ]
  }
}

// ─── Trace Generator ─────────────────────────────────────────────────────────
interface GraphEvent {
  line: number
  type: string
  msg: string
  visited: string[]
  struct: string[] // Queue or Stack
  currentNode: string | null
  currentNeighbor: string | null
}

function getAdjList(graph: GraphDef) {
  const adj: Record<string, string[]> = {}
  Object.keys(graph.nodes).forEach(n => adj[n] = [])
  graph.edges.forEach(([u, v]) => {
    adj[u].push(v)
    adj[v].push(u) // undirected
  })
  // sort alphabetically for deterministic traversal
  Object.keys(adj).forEach(k => adj[k].sort())
  return adj
}

function generateBFS(graph: GraphDef): GraphEvent[] {
  const trace: GraphEvent[] = []
  const adj = getAdjList(graph)
  const visited = new Set<string>()
  const queue: string[] = []
  let curr: string | null = null

  const emit = (ev: Partial<GraphEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '',
      visited: [...visited], struct: [...queue],
      currentNode: curr, currentNeighbor: null,
      ...ev,
    } as GraphEvent)
  }

  emit({ line: 1, type: 'start', msg: `BFS starting at node ${graph.start}` })
  
  visited.add(graph.start)
  queue.push(graph.start)
  emit({ line: 4, type: 'place', msg: `Added ${graph.start} to visited and queue.` })

  while (queue.length > 0) {
    emit({ line: 6, type: 'scan', msg: `Queue is not empty, loop continues.` })
    curr = queue.shift()!
    emit({ line: 7, type: 'pop', msg: `De-queued node ${curr}.` })

    const neighbors = adj[curr]
    for (const neighbor of neighbors) {
      emit({ line: 9, type: 'check', currentNeighbor: neighbor, msg: `Checking neighbor ${neighbor} of ${curr}.` })
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
        emit({ line: 12, type: 'safe-ok', currentNeighbor: neighbor, msg: `${neighbor} is unvisited. Added to visited and queue.` })
      } else {
        emit({ line: 10, type: 'conflict', currentNeighbor: neighbor, msg: `${neighbor} was already visited.` })
      }
    }
    emit({ line: 12, type: 'info', msg: `Finished checking all neighbors of ${curr}.` })
  }
  
  curr = null
  emit({ line: 6, type: 'solution', msg: `Queue is empty. BFS complete!` })
  return trace
}

function generateDFS(graph: GraphDef): GraphEvent[] {
  const trace: GraphEvent[] = []
  const adj = getAdjList(graph)
  const visited = new Set<string>()
  const stack: string[] = []
  let curr: string | null = null

  const emit = (ev: Partial<GraphEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '',
      visited: [...visited], struct: [...stack],
      currentNode: curr, currentNeighbor: null,
      ...ev,
    } as GraphEvent)
  }

  emit({ line: 1, type: 'start', msg: `DFS starting at node ${graph.start}` })
  
  stack.push(graph.start)
  emit({ line: 3, type: 'place', msg: `Pushed ${graph.start} to stack.` })

  while (stack.length > 0) {
    emit({ line: 5, type: 'scan', msg: `Stack is not empty, loop continues.` })
    curr = stack.pop()!
    emit({ line: 6, type: 'pop', msg: `Popped node ${curr}.` })

    emit({ line: 8, type: 'check', msg: `Is ${curr} visited?` })
    if (!visited.has(curr)) {
      visited.add(curr)
      emit({ line: 9, type: 'safe-ok', msg: `${curr} is unvisited. Marked as visited.` })

      const neighbors = [...adj[curr]].reverse() // standard DFS reverse iteration
      for (const neighbor of neighbors) {
        emit({ line: 11, type: 'check', currentNeighbor: neighbor, msg: `Checking neighbor ${neighbor} of ${curr}.` })
        if (!visited.has(neighbor)) {
          stack.push(neighbor)
          emit({ line: 13, type: 'place', currentNeighbor: neighbor, msg: `Pushed unvisited neighbor ${neighbor} to stack.` })
        } else {
          emit({ line: 12, type: 'conflict', currentNeighbor: neighbor, msg: `${neighbor} is already visited.` })
        }
      }
      emit({ line: 13, type: 'info', msg: `Finished pushing unvisited neighbors of ${curr}.` })
    } else {
      emit({ line: 8, type: 'conflict', msg: `${curr} was already visited. Skipping.` })
    }
  }

  curr = null
  emit({ line: 5, type: 'solution', msg: `Stack is empty. DFS complete!` })
  return trace
}

// ─── Visualizer ───────────────────────────────────────────────────────────────
function GraphViz({ ev, scenario }: { ev: GraphEvent, scenario: GraphDef }) {
  const { nodes, edges } = scenario
  const visited = new Set(ev.visited)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px 10px' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <svg width="100%" height="360" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet">
          {/* Edges */}
          {edges.map(([u, v], i) => {
            const p1 = nodes[u]
            const p2 = nodes[v]
            
            // Highlight active edge being checked
            const isActive = (ev.currentNode === u && ev.currentNeighbor === v) || 
                             (ev.currentNode === v && ev.currentNeighbor === u)
            
            const isVisitedEdge = visited.has(u) && visited.has(v)

            const stroke = isActive ? 'var(--gold)' : isVisitedEdge ? 'rgba(79,189,186,0.4)' : 'var(--border-soft)'
            const strokeW = isActive ? 3 : 2
            
            return (
              <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke={stroke} strokeWidth={strokeW} 
                    style={{ transition: 'stroke 0.3s' }} />
            )
          })}
          
          {/* Nodes */}
          {Object.entries(nodes).map(([id, pos]) => {
            const isCurrent = ev.currentNode === id
            const isNeighbor = ev.currentNeighbor === id
            const isVisited = visited.has(id)
            
            const fill = isCurrent ? 'var(--gold)' : 
                         isNeighbor ? 'var(--gold-dim)' : 
                         isVisited ? 'var(--teal)' : 'var(--bg-alt)'
            
            const stroke = isCurrent ? '#fff' : 
                           isVisited ? '#fff' : 'var(--border)'
                           
            const textColor = isCurrent || isVisited ? '#fff' : 'var(--ink)'
            
            const r = isCurrent ? 20 : 16
            const glow = isCurrent ? 'drop-shadow(0 0 8px var(--gold))' : 
                         isVisited ? 'drop-shadow(0 0 4px var(--teal))' : 'none'

            return (
              <g key={id} style={{ transition: 'all 0.3s', filter: glow }}>
                <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: 'all 0.3s' }} />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={14} fontWeight={600} fill={textColor} fontFamily="var(--display)" style={{ transition: 'all 0.3s' }}>
                  {id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Data Structure Panel (Queue/Stack) */}
      <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-dimmer)', fontSize: 12 }}>
          {ev.struct.length > 0 ? (ev.type.includes('start') ? 'INITIALIZING' : 'ACTIVE') : 'EMPTY'}
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {ev.struct.map((node, i) => (
            <div key={`${node}-${i}`} style={{
              background: i === ev.struct.length - 1 ? 'var(--gold)' : 'var(--bg-alt)',
              color: i === ev.struct.length - 1 ? '#000' : 'var(--ink)',
              border: `1px solid ${i === ev.struct.length - 1 ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 6, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14,
              animation: 'fact-pop 0.3s ease'
            }}>
              {node}
            </div>
          ))}
          {ev.struct.length === 0 && <span style={{ color: 'var(--ink-dimmer)', fontSize: 13, fontStyle: 'italic' }}>No elements</span>}
        </div>
      </div>
    </div>
  )
}

const TYPE_TO_CLASS: Record<string, string> = {
  solution: 'safe-ok', 'safe-ok': 'safe-ok', conflict: 'conflict', pop: 'safe-ok', place: 'safe-ok'
}
const LOG_CLASS: Record<string, string> = {
  solution: 'solution', 'safe-ok': 'safe', conflict: 'conflict', pop: 'scan', place: 'place', check: 'scan'
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function GraphSearch() {
  const [algo, setAlgo] = useState<'bfs' | 'dfs'>('bfs')
  const [scenario, setScenario] = useState<keyof typeof GRAPHS>('binary')
  const [trace, setTrace] = useState<GraphEvent[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)
  const logRef = useRef<HTMLDivElement>(null)

  const rebuild = useCallback((a: 'bfs' | 'dfs', s: keyof typeof GRAPHS) => {
    setPlaying(false)
    const graphDef = GRAPHS[s]
    setTrace(a === 'bfs' ? generateBFS(graphDef) : generateDFS(graphDef))
    setIdx(0)
  }, [])

  useEffect(() => { rebuild(algo, scenario) }, [algo, scenario, rebuild])

  const ev = trace[idx]
  const total = trace.length
  const next = useCallback(() => setIdx(i => Math.min(i + 1, total - 1)), [total])
  const prev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])
  const reset = useCallback(() => { setPlaying(false); setIdx(0) }, [])
  const togglePlay = useCallback(() => setPlaying(p => !p), [])
  const tick = useCallback(() => { setIdx(i => { if (i >= total - 1) { setPlaying(false); return i }; return i + 1 }) }, [total])

  useAutoPlay(playing, speed, tick)
  useTracerKeyboard(next, prev, reset, togglePlay)
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [idx])

  if (!ev) return null

  const sc = GRAPHS[scenario]

  return (
    <div className="tracer-page">
      <header className="tracer-header">
        <div>
          <Link to="/" className="tracer-back">← Home</Link>
          <div className="tracer-title-block" style={{ marginTop: 6 }}>
            <p className="tracer-eyebrow">Graph Traversal · Queue & Stack</p>
            <h1 className="tracer-title"><span className="icon">🕸️</span> BFS & DFS Search</h1>
          </div>
        </div>
        <div className="config-row">
          <ThemeToggle />
          <div className="config-group">
            <span className="config-label">Algorithm</span>
            <div className="n-btns">
              <button className={`n-btn${algo === 'bfs' ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setAlgo('bfs')}>BFS (Queue)</button>
              <button className={`n-btn${algo === 'dfs' ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setAlgo('dfs')}>DFS (Stack)</button>
            </div>
          </div>
          <div className="config-group">
            <span className="config-label">Graph</span>
            <div className="n-btns">
              {(Object.keys(GRAPHS) as (keyof typeof GRAPHS)[]).map(s => (
                <button key={s} className={`n-btn${scenario === s ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setScenario(s)}>
                  {GRAPHS[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="tracer-grid">
        <CodePanel
          source={algo === 'bfs' ? SOURCE_BFS : SOURCE_DFS}
          activeLine={ev.line}
          activeClass={TYPE_TO_CLASS[ev.type] ?? ''}
          filename={algo === 'bfs' ? 'bfs.py' : 'dfs.py'}
          vars={{
            node: ev.currentNode || '—',
            neighbor: ev.currentNeighbor || '—',
            [algo === 'bfs' ? 'queue' : 'stack']: `[${ev.struct.join(', ')}]`
          }}
        />
        <div className="panel">
          <div className="panel-head">
            <span className="name">{algo.toUpperCase()} Traversal</span>
            <span className="name" style={{ color: 'var(--teal)' }}>{ev.type.replace(/-/g, ' ')}</span>
          </div>
          <div className="viz-body">
            <GraphViz ev={ev} scenario={sc} />
          </div>
          <div className="log-panel">
            <div className="log-body" ref={logRef}>
              {trace.slice(0, idx + 1).map((e, i) => (
                <div key={i} className={`log-entry ${LOG_CLASS[e.type] ?? ''}`}>{e.msg}</div>
              ))}
            </div>
          </div>
          <div className="stat-bar">
            <span className="stat">Visited: <b>{ev.visited.length} / {Object.keys(sc.nodes).length}</b></span>
            <span className="stat">{algo === 'bfs' ? 'Queue' : 'Stack'} Size: <b>{ev.struct.length}</b></span>
          </div>
        </div>
      </div>

      <TracerControls idx={idx} total={total} playing={playing} speed={speed}
        onPlay={togglePlay} onNext={next} onPrev={prev} onReset={reset} onSpeed={setSpeed} />
    </div>
  )
}
