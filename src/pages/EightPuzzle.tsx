import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CodePanel, TracerControls, useTracerKeyboard, useAutoPlay } from '../components/Tracer'
import ThemeToggle from '../components/ThemeToggle'

// ─── Source ───────────────────────────────────────────────────────────────────
const SOURCE = [
  'import heapq',
  '',
  'def misplaced(state, goal):',
  '  return sum(1 for i in range(9)',
  '    if state[i] != 0 and state[i] != goal[i])',
  '',
  'def a_star(start, goal):',
  '  heap = [(h(start), 0, start, [])]',
  '  visited = set()',
  '',
  '  while heap:',
  '    f, g, state, path = heappop(heap)',
  '    if state == goal:',
  '      return path + [state]',
  '',
  '    if tuple(state) in visited:',
  '      continue',
  '    visited.add(tuple(state))',
  '',
  '    blank = state.index(0)',
  '    for move in get_neighbors(blank, n):',
  '      new_state = state.copy()',
  '      new_state[blank], new_state[move] = \\',
  '        new_state[move], new_state[blank]',
  '      h_val = misplaced(new_state, goal)',
  '      g_new = g + 1',
  '      f_new = g_new + h_val',
  '      heappush(heap, (f_new, g_new, new_state))',
  '',
  '  return None  # no solution',
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface PuzzleEvent {
  line: number
  type: string
  msg: string
  state: number[]
  goal: number[]
  g: number
  h: number
  f: number
  expanded: number
  queueSize: number
  movedTile?: number
}

// ─── Trace Generator ─────────────────────────────────────────────────────────
const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0]

const PRESETS: Record<string, number[]> = {
  easy:   [1, 2, 3, 4, 5, 6, 0, 7, 8],
  medium: [1, 2, 3, 4, 0, 5, 7, 8, 6],
  hard:   [2, 8, 3, 1, 6, 4, 7, 0, 5],
}

function misplaced(state: number[], goal: number[]) {
  return state.reduce((acc, v, i) => acc + (v !== 0 && v !== goal[i] ? 1 : 0), 0)
}

function getNeighbors(blank: number) {
  const moves: number[] = []
  const row = Math.floor(blank / 3), col = blank % 3
  if (row > 0) moves.push(blank - 3)
  if (row < 2) moves.push(blank + 3)
  if (col > 0) moves.push(blank - 1)
  if (col < 2) moves.push(blank + 1)
  return moves
}

function generateTrace(start: number[]): PuzzleEvent[] {
  const trace: PuzzleEvent[] = []
  const goal = GOAL

  type HeapItem = { f: number; g: number; state: number[]; path: number[][] }

  // Simple priority queue
  const heap: HeapItem[] = []
  const push = (item: HeapItem) => { heap.push(item); heap.sort((a, b) => a.f - b.f) }
  const pop = () => heap.shift()!

  const visited = new Set<string>()
  const h0 = misplaced(start, goal)
  push({ f: h0, g: 0, state: start.slice(), path: [] })

  let expanded = 0

  const emit = (ev: Partial<PuzzleEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '', state: start.slice(),
      goal, g: 0, h: 0, f: 0, expanded: 0, queueSize: heap.length,
      ...ev,
    } as PuzzleEvent)
  }

  emit({ line: 7, type: 'init', state: start.slice(), g: 0, h: h0, f: h0, expanded: 0, msg: `A* started. Initial h=${h0}` })

  const MAX_STEPS = 300 // cap for performance

  while (heap.length > 0 && trace.length < MAX_STEPS) {
    const item = pop()
    const { f, g, state } = item
    const key = state.join(',')
    const h = misplaced(state, goal)

    emit({ line: 12, type: 'dequeue', state: state.slice(), g, h, f, expanded, queueSize: heap.length, msg: `Pop: f=${f} (g=${g}+h=${h}), queue=${heap.length}` })

    if (state.join(',') === goal.join(',')) {
      emit({ line: 13, type: 'solution', state: state.slice(), g, h: 0, f, expanded, queueSize: heap.length, msg: `🎉 Goal reached! Cost g=${g}, steps=${g}` })
      break
    }

    if (visited.has(key)) {
      emit({ line: 16, type: 'skip', state: state.slice(), g, h, f, expanded, queueSize: heap.length, msg: `Already visited — skip.` })
      continue
    }
    visited.add(key)
    expanded++

    const blank = state.indexOf(0)
    emit({ line: 19, type: 'expand', state: state.slice(), g, h, f, expanded, queueSize: heap.length, msg: `Expanding node. Blank at position ${blank} (row ${Math.floor(blank / 3)}, col ${blank % 3}).` })

    const neighbors = getNeighbors(blank)
    for (const move of neighbors) {
      const ns = state.slice()
      const movedTile = ns[move]
      ns[blank] = ns[move]
      ns[move] = 0
      const hv = misplaced(ns, goal)
      const gn = g + 1
      const fn = gn + hv
      emit({
        line: 27, type: 'push', state: ns.slice(), g: gn, h: hv, f: fn,
        expanded, queueSize: heap.length + 1, movedTile,
        msg: `Push: moved tile ${movedTile} → f=${fn} (g=${gn}+h=${hv})`,
      })
      push({ f: fn, g: gn, state: ns.slice(), path: [] })
    }
  }

  return trace
}

// ─── Puzzle Visual ────────────────────────────────────────────────────────────
function PuzzleViz({ ev }: { ev: PuzzleEvent }) {
  return (
    <div className="board-row">
      <div className="board-wrap">
        <div className="puzzle-grid">
          {ev.state.map((tile, i) => {
            const isCorrect = tile !== 0 && tile === ev.goal[i]
            const isMoved = tile !== 0 && tile === ev.movedTile && ev.type === 'push'
            let cls = 'puzzle-tile'
            if (tile === 0) cls += ' blank'
            else if (isMoved) cls += ' moved'
            else if (isCorrect) cls += ' correct'
            return <div key={i} className={cls}>{tile === 0 ? '' : tile}</div>
          })}
        </div>
        <span className="coords">blank at index {ev.state.indexOf(0)}</span>
      </div>

      <div className="puzzle-info">
        <div className="cost-chip">g (path cost) = <b>{ev.g}</b></div>
        <div className="cost-chip">h (misplaced) = <b className="teal">{ev.h}</b></div>
        <div className="cost-chip">f = g + h = <b>{ev.f}</b></div>
        <div className="cost-chip">Expanded: <b>{ev.expanded}</b> nodes</div>
        <div className="cost-chip">Queue size: <b>{ev.queueSize}</b></div>
        <div style={{ marginTop: 8 }}>
          <span className="stack-title">Goal State</span>
          <div className="puzzle-grid" style={{ marginTop: 6, transform: 'scale(0.75)', transformOrigin: 'top left' }}>
            {ev.goal.map((tile, i) => {
              const isCorrect = tile !== 0 && tile === ev.state[i]
              let cls = 'puzzle-tile'
              if (tile === 0) cls += ' blank'
              else if (isCorrect) cls += ' correct'
              return <div key={i} className={cls}>{tile === 0 ? '' : tile}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const TYPE_TO_CLASS: Record<string, string> = {
  solution: 'safe-ok',
  dequeue: '',
  push: 'safe-ok',
  skip: 'conflict',
}

const LOG_CLASS: Record<string, string> = {
  init: '', dequeue: 'scan', push: 'place', skip: 'backtrack', solution: 'solution', expand: 'info',
}

export default function EightPuzzle() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('medium')
  const [trace, setTrace] = useState<PuzzleEvent[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(380)
  const logRef = useRef<HTMLDivElement>(null)

  const rebuild = useCallback((p: keyof typeof PRESETS) => {
    setPlaying(false)
    const t = generateTrace(PRESETS[p])
    setTrace(t)
    setIdx(0)
  }, [])

  useEffect(() => { rebuild(preset) }, [preset, rebuild])

  const ev = trace[idx]
  const total = trace.length

  const next = useCallback(() => setIdx(i => Math.min(i + 1, total - 1)), [total])
  const prev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])
  const reset = useCallback(() => { setPlaying(false); setIdx(0) }, [])
  const togglePlay = useCallback(() => setPlaying(p => !p), [])
  const tick = useCallback(() => {
    setIdx(i => { if (i >= total - 1) { setPlaying(false); return i }; return i + 1 })
  }, [total])

  useAutoPlay(playing, speed, tick)
  useTracerKeyboard(next, prev, reset, togglePlay)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [idx])

  if (!ev) return <div className="tracer-page">Loading…</div>

  return (
    <div className="tracer-page">
      <header className="tracer-header">
        <div>
          <Link to="/" className="tracer-back">← Home</Link>
          <div className="tracer-title-block" style={{ marginTop: 6 }}>
            <p className="tracer-eyebrow">A* Search · Misplaced Tiles Heuristic</p>
            <h1 className="tracer-title"><span className="icon">🧩</span> 8-Puzzle, Traced</h1>
          </div>
        </div>
        <div className="config-row">
          <ThemeToggle />
          <div className="config-group">
            <span className="config-label">Difficulty</span>
            <div className="n-btns">
              {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map(p => (
                <button
                  key={p}
                  className={`n-btn${preset === p ? ' active' : ''}`}
                  style={{ width: 'auto', padding: '0 10px' }}
                  onClick={() => setPreset(p)}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="tracer-grid">
        <CodePanel
          source={SOURCE}
          activeLine={ev.line}
          activeClass={TYPE_TO_CLASS[ev.type] ?? ''}
          filename="a_star_puzzle.py"
          vars={{ g: ev.g, h: ev.h, f: ev.f }}
        />

        <div className="panel">
          <div className="panel-head">
            <span className="name">Puzzle state & costs</span>
            <span className="name" style={{ color: 'var(--teal)' }}>{ev.type}</span>
          </div>
          <div className="viz-body">
            <PuzzleViz ev={ev} />
          </div>
          <div className="log-panel">
            <div className="log-body" ref={logRef}>
              {trace.slice(0, idx + 1).map((e, i) => (
                <div key={i} className={`log-entry ${LOG_CLASS[e.type] ?? ''}`}>{e.msg}</div>
              ))}
            </div>
          </div>
          <div className="stat-bar">
            <span className="stat">Expanded: <b>{ev.expanded}</b></span>
            <span className="stat">Queue: <b>{ev.queueSize}</b></span>
            <span className="stat">g+h=f: <b>{ev.g}+{ev.h}={ev.f}</b></span>
          </div>
        </div>
      </div>

      <TracerControls
        idx={idx} total={total} playing={playing} speed={speed}
        onPlay={togglePlay} onNext={next} onPrev={prev} onReset={reset}
        onSpeed={setSpeed}
      />
    </div>
  )
}
