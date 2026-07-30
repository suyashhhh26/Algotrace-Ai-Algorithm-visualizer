import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CodePanel, TracerControls, useTracerKeyboard, useAutoPlay } from '../components/Tracer'
import ThemeToggle from '../components/ThemeToggle'

// ─── Source ───────────────────────────────────────────────────────────────────
const SOURCE = [
  'def minimax(board, depth, is_max):',
  '  winner = check_winner(board)',
  '  if winner == "X": return 10 - depth',
  '  if winner == "O": return depth - 10',
  '  if is_board_full(board): return 0',
  '',
  '  if is_max:  # X maximizes',
  '    best = -infinity',
  '    for each empty cell:',
  '      board[cell] = "X"',
  '      score = minimax(board, depth+1, False)',
  '      board[cell] = ""  # undo',
  '      best = max(best, score)',
  '    return best',
  '',
  '  else:  # O minimizes',
  '    best = +infinity',
  '    for each empty cell:',
  '      board[cell] = "O"',
  '      score = minimax(board, depth+1, True)',
  '      board[cell] = ""  # undo',
  '      best = min(best, score)',
  '    return best',
  '',
  'def best_move(board):',
  '  best_score = -infinity',
  '  move = None',
  '  for each empty cell:',
  '    board[cell] = "X"',
  '    score = minimax(board, 0, False)',
  '    board[cell] = ""  # undo',
  '    if score > best_score:',
  '      best_score = score',
  '      move = cell',
  '  return move',
]

// ─── Types ────────────────────────────────────────────────────────────────────
type Cell = 'X' | 'O' | ''

interface TTTEvent {
  line: number
  type: string
  msg: string
  board: Cell[]
  depth: number
  score?: number
  bestMove?: number
  isMax: boolean
  nodesEvaluated: number
  currentCell?: number
  winCells?: number[]
}

// ─── Game Logic (shared) ──────────────────────────────────────────────────────
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function checkWinner(b: Cell[]): Cell | null {
  for (const [a, x, c] of WINS) {
    if (b[a] && b[a] === b[x] && b[x] === b[c]) return b[a]
  }
  return null
}

function getWinCells(b: Cell[]): number[] {
  for (const [a, x, c] of WINS) {
    if (b[a] && b[a] === b[x] && b[x] === b[c]) return [a, x, c]
  }
  return []
}

function isFull(b: Cell[]) { return b.every(c => c !== '') }

/** Pure minimax — returns best score */
function minimax(b: Cell[], depth: number, isMax: boolean): number {
  const w = checkWinner(b)
  if (w === 'X') return 10 - depth
  if (w === 'O') return depth - 10
  if (isFull(b))  return 0
  if (depth > 8)  return 0

  if (isMax) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (b[i] !== '') continue
      b[i] = 'X'; best = Math.max(best, minimax(b, depth + 1, false)); b[i] = ''
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (b[i] !== '') continue
      b[i] = 'O'; best = Math.min(best, minimax(b, depth + 1, true)); b[i] = ''
    }
    return best
  }
}

/** Returns [bestCell, allScores] for AI (O, minimising) */
function aiBestMove(board: Cell[]): { move: number; scores: (number | null)[] } {
  const scores: (number | null)[] = Array(9).fill(null)
  let bestScore = Infinity
  let bestMove = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] !== '') continue
    const b = board.slice() as Cell[]
    b[i] = 'O'
    const s = minimax(b, 1, true)
    scores[i] = s
    if (s < bestScore) { bestScore = s; bestMove = i }
  }
  return { move: bestMove, scores }
}

// ─── Trace Generator ─────────────────────────────────────────────────────────
const SCENARIOS: Record<string, { label: string; board: Cell[] }> = {
  empty:    { label: 'Empty',    board: Array(9).fill('') as Cell[] },
  midgame:  { label: 'Mid-game', board: ['X','O','','','X','','','','O'] as Cell[] },
  critical: { label: 'X to Win', board: ['X','X','','O','O','','','',''] as Cell[] },
}

function generateTrace(startBoard: Cell[]): TTTEvent[] {
  const trace: TTTEvent[] = []
  let nodesEvaluated = 0
  const board = startBoard.slice() as Cell[]

  const emit = (ev: Partial<TTTEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '', board: board.slice() as Cell[],
      depth: 0, isMax: true, nodesEvaluated, ...ev,
    } as TTTEvent)
  }

  function mmTrace(b: Cell[], depth: number, isMax: boolean): number {
    nodesEvaluated++
    const winner = checkWinner(b)
    if (winner === 'X') { emit({ line: 3, type: 'terminal',     board: b.slice() as Cell[], depth, isMax, score: 10 - depth, msg: `X wins → score = ${10-depth}` }); return 10-depth }
    if (winner === 'O') { emit({ line: 4, type: 'terminal-bad', board: b.slice() as Cell[], depth, isMax, score: depth - 10, msg: `O wins → score = ${depth-10}` }); return depth-10 }
    if (isFull(b))      { emit({ line: 5, type: 'draw',         board: b.slice() as Cell[], depth, isMax, score: 0, msg: `Board full → draw = 0` }); return 0 }
    if (trace.length > 450) return 0

    if (isMax) {
      emit({ line: 7, type: 'maximize', board: b.slice() as Cell[], depth, isMax, msg: `Depth ${depth}: X to move (maximizing).` })
      let best = -Infinity
      for (let i = 0; i < 9; i++) {
        if (b[i] !== '') continue
        b[i] = 'X'; emit({ line: 10, type: 'try', board: b.slice() as Cell[], depth, isMax, currentCell: i, msg: `Try X at cell ${i}.` })
        const s = mmTrace(b, depth + 1, false); b[i] = ''
        if (s > best) { best = s; emit({ line: 13, type: 'better', board: b.slice() as Cell[], depth, isMax, score: s, msg: `Better: cell ${i} → ${s}` }) }
      }
      return best
    } else {
      emit({ line: 16, type: 'minimize', board: b.slice() as Cell[], depth, isMax, msg: `Depth ${depth}: O to move (minimizing).` })
      let best = Infinity
      for (let i = 0; i < 9; i++) {
        if (b[i] !== '') continue
        b[i] = 'O'; emit({ line: 19, type: 'try', board: b.slice() as Cell[], depth, isMax, currentCell: i, msg: `Try O at cell ${i}.` })
        const s = mmTrace(b, depth + 1, true); b[i] = ''
        if (s < best) { best = s; emit({ line: 22, type: 'better', board: b.slice() as Cell[], depth, isMax, score: s, msg: `Better: cell ${i} → ${s}` }) }
      }
      return best
    }
  }

  emit({ line: 25, type: 'start', board: board.slice() as Cell[], depth: 0, isMax: true, msg: `Finding best move for X using Minimax.` })
  let bestScore = -Infinity; let bestMove = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] !== '') continue
    board[i] = 'X'
    emit({ line: 29, type: 'try', board: board.slice() as Cell[], depth: 0, isMax: true, currentCell: i, msg: `Evaluating X at cell ${i}…` })
    const s = mmTrace(board.slice() as Cell[], 1, false)
    board[i] = ''
    emit({ line: 31, type: 'eval', board: board.slice() as Cell[], depth: 0, isMax: true, score: s, currentCell: i, msg: `Cell ${i} scored ${s}.` })
    if (s > bestScore) { bestScore = s; bestMove = i; emit({ line: 33, type: 'best-update', board: board.slice() as Cell[], depth: 0, isMax: true, score: s, bestMove, msg: `New best: cell ${i} → score ${s}.` }) }
  }
  const finalBoard = board.slice() as Cell[]; finalBoard[bestMove] = 'X'
  emit({ line: 34, type: 'best-final', board: finalBoard, depth: 0, isMax: true, score: bestScore, bestMove, msg: `Best move: X plays cell ${bestMove} (score ${bestScore}).` })
  return trace
}

// ─── Board Visual (used in trace) ─────────────────────────────────────────────
function TTTViz({ ev }: { ev: TTTEvent }) {
  const winCells = ev.type === 'terminal' || ev.type === 'best-final' ? getWinCells(ev.board) : []
  return (
    <div className="board-row">
      <div className="board-wrap">
        <div className="ttt-board">
          {ev.board.map((cell, i) => {
            const isBest = ev.bestMove === i && ev.type === 'best-final'
            const isWin  = winCells.includes(i)
            let cls = 'ttt-cell'
            if (cell) cls += ` ${cell}`
            if (isWin)  cls += ' win-cell'
            if (isBest) cls += ' best-move'
            return <div key={i} className={cls}>{cell}</div>
          })}
        </div>
        <span className="coords" style={{ marginTop: 8 }}>depth {ev.depth} · {ev.isMax ? 'X maximizing' : 'O minimizing'}</span>
      </div>
      <div className="ttt-info">
        <div className="score-badge">score: <b>{ev.score !== undefined ? ev.score : '—'}</b></div>
        {ev.bestMove !== undefined && <div className="score-badge win">Best → cell {ev.bestMove}</div>}
        <div className="var-chip">Nodes: <b>{ev.nodesEvaluated}</b></div>
        <div className="var-chip">Depth: <b>{ev.depth}</b></div>
        <div style={{ marginTop: 8 }}>
          <div className="stack-title">Cell layout</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-dimmer)', marginTop: 6 }}>[0][1][2]<br/>[3][4][5]<br/>[6][7][8]</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PLAY VS AI MODE
// ═══════════════════════════════════════════════════════════════════════════════
type GameStatus = 'playing' | 'x-wins' | 'o-wins' | 'draw' | 'ai-thinking'

function PlayVsAI({ playerMark }: { playerMark: 'X' | 'O' }) {
  const aiMark: Cell  = playerMark === 'X' ? 'O' : 'X'
  const [board, setBoard]         = useState<Cell[]>(Array(9).fill(''))
  const [status, setStatus]       = useState<GameStatus>('playing')
  const [scores, setScores]       = useState<(number | null)[]>(Array(9).fill(null))
  const [lastAI, setLastAI]       = useState<number | null>(null)
  const [lastPlayer, setLastPlayer] = useState<number | null>(null)
  const [history, setHistory]     = useState<string[]>([`Game started. You are ${playerMark}, AI is ${aiMark}.`])
  const [moveCount, setMoveCount] = useState(0)

  const addLog = (msg: string) => setHistory(h => [...h, msg])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [history])

  // If AI goes first (player is O), trigger AI move at start
  useEffect(() => {
    if (playerMark === 'O') runAI(Array(9).fill(''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function computeStatus(b: Cell[]): GameStatus {
    const w = checkWinner(b)
    if (w === playerMark) return 'x-wins' // player won
    if (w === aiMark)     return 'o-wins' // AI won
    if (isFull(b))        return 'draw'
    return 'playing'
  }

  function runAI(b: Cell[]) {
    setStatus('ai-thinking')
    addLog(`🤖 AI (${aiMark}) is thinking…`)
    // Small delay for UX
    setTimeout(() => {
      const { move, scores: s } = aiBestMove(b)
      if (move === -1) { setStatus(computeStatus(b)); return }
      const next = b.slice() as Cell[]
      next[move] = aiMark
      setBoard(next)
      setScores(s)
      setLastAI(move)
      setMoveCount(c => c + 1)
      addLog(`🤖 AI plays cell ${move} (best score: ${s[move]})`)
      const newStatus = computeStatus(next)
      setStatus(newStatus)
      if (newStatus !== 'playing') addLog(newStatus === 'o-wins' ? `🤖 AI wins! Better luck next time.` : `🤝 Draw!`)
    }, 420)
  }

  function handleCellClick(i: number) {
    if (board[i] !== '' || status !== 'playing') return
    const next = board.slice() as Cell[]
    next[i] = playerMark
    setBoard(next)
    setLastPlayer(i)
    setScores(Array(9).fill(null)) // clear score hints
    setMoveCount(c => c + 1)
    addLog(`You (${playerMark}) play cell ${i}`)
    const newStatus = computeStatus(next)
    if (newStatus !== 'playing') {
      setStatus(newStatus)
      addLog(newStatus === 'x-wins' ? `🎉 You win! Amazing!` : `🤝 Draw!`)
      return
    }
    runAI(next)
  }

  function restart() {
    const fresh: Cell[] = Array(9).fill('')
    setBoard(fresh); setStatus('playing'); setScores(Array(9).fill(null))
    setLastAI(null); setLastPlayer(null); setMoveCount(0)
    setHistory([`New game. You are ${playerMark}, AI is ${aiMark}.`])
    if (playerMark === 'O') runAI(fresh)
  }

  const winCells = ['x-wins', 'o-wins'].includes(status) ? getWinCells(board) : []
  const isDone = status !== 'playing' && status !== 'ai-thinking'
  const isThinking = status === 'ai-thinking'

  // Compute score color for hints
  function scoreColor(s: number | null): string {
    if (s === null) return 'transparent'
    if (s > 0)  return 'rgba(10,96,96,.75)'   // good for X (bad for AI)
    if (s < 0)  return 'rgba(138,85,0,.75)'   // good for AI (bad for X)
    return 'rgba(90,120,150,.7)'               // draw
  }

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: '12px 4px', alignItems: 'flex-start' }}>
      {/* Board */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Status banner */}
        <div style={{
          padding: '8px 20px', borderRadius: 10,
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15,
          border: `2px solid ${isDone && status === 'x-wins' ? 'var(--teal)' : isDone && status === 'o-wins' ? 'var(--coral)' : isDone ? 'var(--gold)' : 'var(--border)'}`,
          color: isDone && status === 'x-wins' ? 'var(--teal)' : isDone && status === 'o-wins' ? 'var(--coral)' : isDone ? 'var(--gold)' : isThinking ? 'var(--gold)' : 'var(--ink-dim)',
          background: isDone ? 'rgba(255,255,255,.04)' : 'transparent',
          transition: 'all .3s',
          animation: isThinking ? 'rule-pulse .8s ease-in-out infinite' : isDone ? 'fact-pop .35s ease' : 'none',
          minWidth: 220, textAlign: 'center',
        }}>
          {status === 'playing'     ? `Your turn (${playerMark})`      : ''}
          {status === 'ai-thinking' ? `AI thinking… 🤖`                 : ''}
          {status === 'x-wins'      ? `🎉 You win!`                     : ''}
          {status === 'o-wins'      ? `🤖 AI wins!`                     : ''}
          {status === 'draw'        ? `🤝 Draw!`                        : ''}
        </div>

        {/* Game board */}
        <div className="ttt-board" style={{ position: 'relative' }}>
          {board.map((cell, i) => {
            const isWin      = winCells.includes(i)
            const isLastAI   = i === lastAI
            const isLastPlr  = i === lastPlayer
            const scoreHint  = scores[i]
            const canClick   = cell === '' && status === 'playing'

            let cls = 'ttt-cell'
            if (cell) cls += ` ${cell}`
            if (isWin) cls += ' win-cell'

            return (
              <div
                key={i}
                className={cls}
                onClick={() => handleCellClick(i)}
                style={{
                  cursor: canClick ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'all .2s',
                  transform: isLastAI || isLastPlr ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isLastAI  ? '0 0 0 2px var(--coral)' :
                             isLastPlr ? '0 0 0 2px var(--teal)'  : '',
                  opacity: isThinking && cell === '' ? .6 : 1,
                }}
              >
                {cell}
                
                {/* Score hint overlay on empty cells */}
                {cell === '' && scoreHint !== null && !isDone && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                    color: '#fff',
                    background: scoreColor(scoreHint),
                    borderRadius: 6,
                    pointerEvents: 'none',
                    animation: 'fact-pop .3s ease',
                  }}>
                    {scoreHint > 0 ? `+${scoreHint}` : scoreHint}
                  </div>
                )}

                {/* Hover hint on empty cells when it's the player's turn */}
                {cell === '' && status === 'playing' && scoreHint === null && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700,
                    color: playerMark === 'X' ? 'rgba(10,96,96,.25)' : 'rgba(158,32,32,.25)',
                    borderRadius: 6, pointerEvents: 'none',
                    opacity: 0, transition: 'opacity .15s',
                  }}
                  className="hover-hint">
                    {playerMark}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* AI score legend */}
        {scores.some(s => s !== null) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-dimmer)' }}>Score hints:</span>
            {[['rgba(10,96,96,.75)', `Good for you (${playerMark})`], ['rgba(138,85,0,.75)', `Good for AI (${aiMark})`], ['rgba(90,120,150,.7)', 'Draw']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-dimmer)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: c as string, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        )}

        {/* Restart */}
        <button
          className="ctrl-btn"
          onClick={restart}
          style={{ marginTop: 4, borderColor: isDone ? 'var(--teal)' : '', color: isDone ? 'var(--teal)' : '' }}
        >
          ↺ Restart
        </button>
      </div>

      {/* Stats + Log */}
      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['You', playerMark, 'var(--teal)'],
            ['AI', aiMark, 'var(--coral)'],
            ['Moves', String(moveCount), 'var(--gold)'],
          ].map(([label, val, color]) => (
            <div key={label} style={{
              flex: 1, minWidth: 80,
              background: 'var(--bg-alt)', border: '1px solid var(--border)',
              borderRadius: 9, padding: '8px 12px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-dimmer)', marginBottom: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* How AI thinks info */}
        <div style={{
          background: 'var(--bg-alt)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '10px 14px',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-dimmer)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            How the AI works
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-dim)', lineHeight: 1.55 }}>
            After your move, the AI runs <span style={{ color: 'var(--teal)' }}>Minimax</span> to score every empty cell. It picks the cell with the lowest score (AI = O, minimizing). The <b>colored numbers</b> on empty cells show Minimax scores from the AI's last evaluation.
          </div>
        </div>

        {/* Move log */}
        <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden', flex: 1 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-dimmer)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '8px 12px', borderBottom: '1px solid var(--border-soft)', background: 'var(--panel-2)' }}>
            Move log
          </div>
          <div ref={logRef} style={{ height: 160, overflowY: 'auto', padding: '7px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map((msg, i) => (
              <div key={i} style={{
                fontFamily: 'var(--mono)', fontSize: 11.5,
                color: msg.startsWith('🤖') ? 'var(--coral)' : msg.startsWith('🎉') ? 'var(--teal)' : msg.startsWith('🤝') ? 'var(--gold)' : 'var(--ink-dim)',
                paddingLeft: 4,
                borderLeft: `3px solid ${msg.startsWith('🤖') ? 'var(--coral)' : msg.startsWith('🎉') ? 'var(--teal)' : msg.startsWith('🤝') ? 'var(--gold)' : 'var(--border)'}`,
                lineHeight: 1.4,
                animation: i === history.length - 1 ? 'fact-pop .25s ease' : 'none',
              }}>{msg}</div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ttt-cell:hover .hover-hint { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

// ─── Trace Mode constants ─────────────────────────────────────────────────────
const TYPE_TO_CLASS: Record<string, string> = {
  terminal: 'safe-ok', 'best-final': 'safe-ok', 'best-update': 'safe-ok', better: 'safe-ok',
  'terminal-bad': 'conflict', draw: '',
}
const LOG_CLASS: Record<string, string> = {
  terminal: 'solution', 'terminal-bad': 'conflict', draw: 'scan',
  try: '', eval: 'place', 'best-update': 'safe', 'best-final': 'solution',
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function TicTacToe() {
  const [pageMode, setPageMode] = useState<'trace' | 'play'>('trace')
  const [playerMark, setPlayerMark] = useState<'X' | 'O'>('X')
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>('midgame')
  const [trace, setTrace]   = useState<TTTEvent[]>([])
  const [idx, setIdx]       = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed]   = useState(300)
  const logRef = useRef<HTMLDivElement>(null)

  const rebuild = useCallback((s: keyof typeof SCENARIOS) => {
    setPlaying(false)
    setTrace(generateTrace(SCENARIOS[s].board))
    setIdx(0)
  }, [])

  useEffect(() => { rebuild(scenario) }, [scenario, rebuild])

  const ev    = trace[idx]
  const total = trace.length
  const next  = useCallback(() => setIdx(i => Math.min(i + 1, total - 1)), [total])
  const prev  = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])
  const reset = useCallback(() => { setPlaying(false); setIdx(0) }, [])
  const togglePlay = useCallback(() => setPlaying(p => !p), [])
  const tick  = useCallback(() => { setIdx(i => { if (i >= total - 1) { setPlaying(false); return i }; return i + 1 }) }, [total])

  useAutoPlay(playing, speed, tick)
  useTracerKeyboard(next, prev, reset, togglePlay)
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [idx])

  return (
    <div className="tracer-page">
      {/* ── Header ── */}
      <header className="tracer-header">
        <div>
          <Link to="/" className="tracer-back">← Home</Link>
          <div className="tracer-title-block" style={{ marginTop: 6 }}>
            <p className="tracer-eyebrow">Minimax · Game Tree · Optimal Play</p>
            <h1 className="tracer-title"><span className="icon">⚔️</span> Tic-Tac-Toe Minimax</h1>
          </div>
        </div>
        <div className="config-row">
          <ThemeToggle />

          {/* Page mode toggle */}
          <div className="config-group">
            <span className="config-label">Mode</span>
            <div className="n-btns">
              <button className={`n-btn${pageMode === 'trace' ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setPageMode('trace')}>📊 Trace</button>
              <button className={`n-btn${pageMode === 'play'  ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setPageMode('play')}>🎮 Play vs AI</button>
            </div>
          </div>

          {/* Trace scenario selector */}
          {pageMode === 'trace' && (
            <div className="config-group">
              <span className="config-label">Scenario</span>
              <div className="n-btns">
                {(Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]).map(s => (
                  <button key={s} className={`n-btn${scenario === s ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setScenario(s)}>{SCENARIOS[s].label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Play: choose mark */}
          {pageMode === 'play' && (
            <div className="config-group">
              <span className="config-label">You play as</span>
              <div className="n-btns">
                <button className={`n-btn${playerMark === 'X' ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setPlayerMark('X')}>X (first)</button>
                <button className={`n-btn${playerMark === 'O' ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setPlayerMark('O')}>O (second)</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Play Mode ── */}
      {pageMode === 'play' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            flex: 1, background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px', overflow: 'auto',
          }}>
            <PlayVsAI key={playerMark} playerMark={playerMark} />
          </div>
        </div>
      )}

      {/* ── Trace Mode ── */}
      {pageMode === 'trace' && ev && (
        <>
          <div className="tracer-grid">
            <CodePanel
              source={SOURCE}
              activeLine={ev.line}
              activeClass={TYPE_TO_CLASS[ev.type] ?? ''}
              filename="minimax.py"
              vars={{ depth: ev.depth, score: ev.score !== undefined ? ev.score : '—', isMax: ev.isMax ? 'True (X)' : 'False (O)' }}
            />
            <div className="panel">
              <div className="panel-head">
                <span className="name">Game tree trace</span>
                <span className="name" style={{ color: 'var(--teal)' }}>{ev.type.replace(/-/g, ' ')}</span>
              </div>
              <div className="viz-body">
                <TTTViz ev={ev} />
              </div>
              <div className="log-panel">
                <div className="log-body" ref={logRef}>
                  {trace.slice(0, idx + 1).map((e, i) => (
                    <div key={i} className={`log-entry ${LOG_CLASS[e.type] ?? ''}`}>{e.msg}</div>
                  ))}
                </div>
              </div>
              <div className="stat-bar">
                <span className="stat">Nodes: <b>{ev.nodesEvaluated}</b></span>
                <span className="stat">Depth: <b>{ev.depth}</b></span>
                <span className="stat">Mode: <b>{ev.isMax ? 'MAX (X)' : 'MIN (O)'}</b></span>
              </div>
            </div>
          </div>
          <TracerControls idx={idx} total={total} playing={playing} speed={speed}
            onPlay={togglePlay} onNext={next} onPrev={prev} onReset={reset} onSpeed={setSpeed} />
        </>
      )}
    </div>
  )
}
