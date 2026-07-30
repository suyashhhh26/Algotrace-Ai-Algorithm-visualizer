import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CodePanel, TracerControls, useTracerKeyboard, useAutoPlay } from '../components/Tracer'
import ThemeToggle from '../components/ThemeToggle'

// ─── Source Code (line numbers must match trace events) ─────────────────────
const SOURCE = [
  'def is_safe(board, row, col, n):',
  '  for i in range(row):',
  '    if board[i][col] == "Q":',
  '      return False',
  '',
  '  i, j = row-1, col-1',
  '  while i >= 0 and j >= 0:',
  '    if board[i][j] == "Q":',
  '      return False',
  '    i -= 1; j -= 1',
  '',
  '  i, j = row-1, col+1',
  '  while i >= 0 and j < n:',
  '    if board[i][j] == "Q":',
  '      return False',
  '    i -= 1; j += 1',
  '  return True',
  '',
  'def solve(board, row, n):',
  '  if row == n:',
  '    print("solution!")',
  '    return True',
  '',
  '  for col in range(n):',
  '    if is_safe(board, row, col, n):',
  '      board[row][col] = "Q"',
  '      if solve(board, row+1, n):',
  '        return True',
  '      board[row][col] = "."  # backtrack',
  '  return False',
  '',
  'board = [["."]*n for _ in range(n)]',
  'solve(board, 0, n)',
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface NQEvent {
  line: number
  type: string
  msg: string
  board: string[][]
  stack: { row: number }[]
  row?: number
  col?: number
  scan?: { r: number; c: number }
  conflict?: { r: number; c: number }
  attempts: number
  backtracks: number
  maxDepth: number
}

// ─── Trace Generator ─────────────────────────────────────────────────────────
function generateTrace(n: number): NQEvent[] {
  const trace: NQEvent[] = []
  const board = Array.from({ length: n }, () => Array(n).fill('.'))
  const stack: { row: number }[] = []
  let attempts = 0, backtracks = 0, maxDepth = 0

  const snap = () => board.map(r => r.slice())
  const emit = (ev: Partial<NQEvent>) => {
    maxDepth = Math.max(maxDepth, stack.length)
    trace.push({
      board: snap(), stack: stack.map(f => ({ ...f })),
      attempts, backtracks, maxDepth,
      line: 1, type: 'info', msg: '',
      ...ev,
    } as NQEvent)
  }

  function isSafeTraced(row: number, col: number): boolean {
    for (let i = 0; i < row; i++) {
      emit({ line: 2, type: 'scan', row, col, scan: { r: i, c: col }, msg: `Check column: is (${i},${col}) a queen?` })
      if (board[i][col] === 'Q') {
        emit({ line: 4, type: 'conflict', row, col, conflict: { r: i, c: col }, msg: `Conflict at (${i},${col}) — same column.` })
        return false
      }
    }
    let i = row - 1, j = col - 1
    while (i >= 0 && j >= 0) {
      emit({ line: 7, type: 'scan', row, col, scan: { r: i, c: j }, msg: `Check ↖ diagonal: (${i},${j})` })
      if (board[i][j] === 'Q') {
        emit({ line: 9, type: 'conflict', row, col, conflict: { r: i, c: j }, msg: `Conflict at (${i},${j}) — ↖ diagonal.` })
        return false
      }
      i--; j--
    }
    i = row - 1; j = col + 1
    while (i >= 0 && j < n) {
      emit({ line: 13, type: 'scan', row, col, scan: { r: i, c: j }, msg: `Check ↗ diagonal: (${i},${j})` })
      if (board[i][j] === 'Q') {
        emit({ line: 15, type: 'conflict', row, col, conflict: { r: i, c: j }, msg: `Conflict at (${i},${j}) — ↗ diagonal.` })
        return false
      }
      i--; j++
    }
    emit({ line: 17, type: 'safe', row, col, msg: `(${row},${col}) is safe — no conflicts.` })
    return true
  }

  function solveTraced(row: number): boolean {
    stack.push({ row })
    emit({ line: 19, type: 'enter', row, msg: `solve(row=${row}) called.` })
    if (row === n) {
      emit({ line: 21, type: 'solution', row, msg: `row == n → All queens placed! Solution found! 🎉` })
      stack.pop()
      return true
    }
    emit({ line: 24, type: 'loop', row, msg: `Row ${row}: trying columns 0–${n - 1}.` })
    for (let col = 0; col < n; col++) {
      attempts++
      emit({ line: 25, type: 'try', row, col, msg: `Row ${row}: checking if (${row},${col}) is safe...` })
      const safe = isSafeTraced(row, col)
      if (safe) {
        board[row][col] = 'Q'
        emit({ line: 26, type: 'place', row, col, msg: `Placing queen at (${row},${col}).` })
        emit({ line: 27, type: 'recurse', row, col, msg: `Recursing into solve(row=${row + 1}).` })
        const ok = solveTraced(row + 1)
        if (ok) {
          emit({ line: 28, type: 'propagate-true', row, msg: `solve(${row}) returns True ✓` })
          stack.pop()
          return true
        } else {
          board[row][col] = '.'
          backtracks++
          emit({ line: 29, type: 'backtrack', row, col, msg: `Backtrack: remove queen from (${row},${col}).` })
        }
      }
    }
    emit({ line: 30, type: 'return-false', row, msg: `Row ${row}: all columns failed → return False.` })
    stack.pop()
    return false
  }

  emit({ line: 32, type: 'init', msg: `Board: ${n}×${n} grid initialized.` })
  emit({ line: 33, type: 'call', msg: `Calling solve(board, 0, ${n})` })
  const found = solveTraced(0)
  if (!found) emit({ line: 30, type: 'no-solution', msg: 'No solution exists for this n.' })
  return trace
}

// ─── Board Renderer ───────────────────────────────────────────────────────────
function Board({ ev, n }: { ev: NQEvent; n: number }) {
  const size = n <= 6 ? 52 : n === 7 ? 46 : 40

  return (
    <div className="board-row">
      <div className="board-wrap">
        <div
          className={`board${ev.type === 'solution' ? ' solved' : ''}`}
          style={{ gridTemplateColumns: `repeat(${n}, ${size}px)` }}
        >
          {ev.board.flatMap((row, r) =>
            row.map((cell, c) => {
              const isScan = ev.scan && ev.scan.r === r && ev.scan.c === c
              const isConflict = ev.conflict && (
                (ev.conflict.r === r && ev.conflict.c === c) ||
                (ev.row === r && ev.col === c && ev.type === 'conflict')
              )
              const isTry = ev.type === 'try' && ev.row === r && ev.col === c
              const isBacktrack = ev.type === 'backtrack' && ev.row === r && ev.col === c

              let cls = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`
              if (isConflict) cls += ' conflict-cell'
              else if (isScan) cls += ev.scan && Math.abs(ev.scan.r - (ev.row ?? 0)) !== Math.abs(ev.scan.c - (ev.col ?? 0)) ? ' scan-col' : ' scan-diag'
              if (isTry) cls += ' try-cell'
              if (isBacktrack) cls += ' backtrack-cell'

              return (
                <div key={`${r}-${c}`} className={cls} style={{ width: size, height: size }}>
                  <span className={`q${cell === 'Q' ? ' show' : ''}`}>♛</span>
                </div>
              )
            })
          )}
        </div>
        <span className="coords">
          row {ev.row ?? '–'}, col {ev.col ?? '–'}
        </span>
      </div>

      <div className="stack-wrap">
        <span className="stack-title">Recursion stack</span>
        <div className="stack">
          {ev.stack.length === 0 ? (
            <div className="frame" style={{ opacity: .5 }}>— empty —</div>
          ) : (
            ev.stack.map((f, i) => (
              <div key={i} className={`frame${i === ev.stack.length - 1 ? ' top' : ''}`}>
                <span>solve(row={f.row})</span>
                <span>{i === ev.stack.length - 1 ? '● active' : ''}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const TYPE_TO_CLASS: Record<string, string> = {
  conflict: 'conflict', backtrack: 'conflict', 'return-false': 'conflict',
  safe: 'safe-ok', place: 'safe-ok', solution: 'safe-ok', 'propagate-true': 'safe-ok',
}

const LOG_CLASS: Record<string, string> = {
  scan: 'scan', conflict: 'conflict', safe: 'safe', place: 'place',
  backtrack: 'backtrack', 'return-false': 'backtrack', solution: 'solution',
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NQueens() {
  const [n, setN] = useState(5)
  const [trace, setTrace] = useState<NQEvent[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(380)
  const logRef = useRef<HTMLDivElement>(null)

  const rebuild = useCallback((newN: number) => {
    setPlaying(false)
    const t = generateTrace(newN)
    setTrace(t)
    setIdx(0)
  }, [])

  useEffect(() => { rebuild(n) }, [n, rebuild])

  const ev = trace[idx]
  const total = trace.length

  const next = useCallback(() => setIdx(i => Math.min(i + 1, total - 1)), [total])
  const prev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])
  const reset = useCallback(() => { setPlaying(false); setIdx(0) }, [])
  const togglePlay = useCallback(() => setPlaying(p => !p), [])

  const tick = useCallback(() => {
    setIdx(i => {
      if (i >= total - 1) { setPlaying(false); return i }
      return i + 1
    })
  }, [total])

  useAutoPlay(playing, speed, tick)
  useTracerKeyboard(next, prev, reset, togglePlay)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [idx])

  if (!ev) return <div className="tracer-page">Loading…</div>

  const vars: Record<string, string | number> = {
    n,
    row: ev.row ?? '–',
    col: ev.col ?? '–',
  }

  return (
    <div className="tracer-page">
      {/* Header */}
      <header className="tracer-header">
        <div>
          <Link to="/" className="tracer-back">← Home</Link>
          <div className="tracer-title-block" style={{ marginTop: 6 }}>
            <p className="tracer-eyebrow">Backtracking · Recursion · Constraint Checking</p>
            <h1 className="tracer-title"><span className="icon">♛</span> N-Queens, Traced</h1>
          </div>
        </div>
        <div className="config-row">
          <ThemeToggle />
          <div className="config-group">
            <span className="config-label">Board size (n)</span>
            <div className="n-btns">
              {[4, 5, 6, 7, 8].map(v => (
                <button
                  key={v}
                  className={`n-btn${n === v ? ' active' : ''}`}
                  onClick={() => setN(v)}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="tracer-grid">
        {/* Left: Code Panel */}
        <CodePanel
          source={SOURCE}
          activeLine={ev.line}
          activeClass={TYPE_TO_CLASS[ev.type] ?? ''}
          filename="nqueens.py"
          vars={vars}
          fnRanges={[[1, 17], [19, 30]]}
        />

        {/* Right: Viz Panel */}
        <div className="panel">
          <div className="panel-head">
            <span className="name">Live board & call stack</span>
            <span className="name" style={{ color: 'var(--teal)' }}>
              {ev.type.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="viz-body">
            <Board ev={ev} n={n} />
          </div>
          <div className="log-panel">
            <div className="log-body" ref={logRef}>
              {trace.slice(0, idx + 1).map((e, i) => (
                <div key={i} className={`log-entry ${LOG_CLASS[e.type] ?? ''}`}>{e.msg}</div>
              ))}
            </div>
          </div>
          <div className="stat-bar">
            <span className="stat">Attempts: <b>{ev.attempts}</b></span>
            <span className="stat">Backtracks: <b>{ev.backtracks}</b></span>
            <span className="stat">Max depth: <b>{ev.maxDepth}</b></span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <TracerControls
        idx={idx} total={total} playing={playing} speed={speed}
        onPlay={togglePlay} onNext={next} onPrev={prev} onReset={reset}
        onSpeed={setSpeed}
      />
    </div>
  )
}
