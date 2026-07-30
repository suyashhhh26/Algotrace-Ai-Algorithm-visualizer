import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CodePanel, TracerControls, useTracerKeyboard, useAutoPlay } from '../components/Tracer'
import ThemeToggle from '../components/ThemeToggle'

// ─── Source ───────────────────────────────────────────────────────────────────
const SOURCE = [
  'def solve(index):',
  '  if index == len(letters):',
  '    return check_equation()',
  '',
  '  letter = letters[index]',
  '  for digit in digits_to_try:',
  '    if digit not in used_digits:',
  '      if digit == 0 and is_first(letter):',
  '        continue  # leading zero',
  '',
  '      mapping[letter] = digit',
  '      used_digits.add(digit)',
  '',
  '      if solve(index + 1):',
  '        return True',
  '',
  '      # Backtrack',
  '      del mapping[letter]',
  '      used_digits.remove(digit)',
  '',
  '  return False',
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface CryptoScenario {
  label: string
  words: string[]
  result: string
  letters: string[]
  firstLetters: string[]
  digitOrder: number[]
}

const SCENARIOS: Record<string, CryptoScenario> = {
  togo: {
    label: 'TO + GO = OUT',
    words: ['TO', 'GO'],
    result: 'OUT',
    letters: ['O', 'T', 'G', 'U'], // O is first, T is first, G is first
    firstLetters: ['O', 'T', 'G'],
    // Solution: O=1, T=2, G=8, U=3 (21+81=102)
    // Order crafted to find it quickly but show some backtracking
    digitOrder: [0, 4, 1, 5, 2, 9, 8, 7, 3, 6],
  },
  send: {
    label: 'SEND + MORE = MONEY',
    words: ['SEND', 'MORE'],
    result: 'MONEY',
    letters: ['M', 'S', 'E', 'N', 'D', 'O', 'R', 'Y'],
    firstLetters: ['S', 'M'],
    // Solution: M=1, S=9, E=5, N=6, D=7, O=0, R=8, Y=2
    digitOrder: [1, 9, 5, 6, 7, 0, 8, 2, 3, 4], // Very guided to keep trace small
  },
  cross: {
    label: 'SO + SO = TOO',
    words: ['SO', 'SO'],
    result: 'TOO',
    letters: ['S', 'O', 'T'],
    firstLetters: ['S', 'T'],
    // Solution: S=5, O=0 (not allowed if O is first? O is not first), T=1. 50+50=100.
    digitOrder: [1, 4, 5, 2, 0, 3, 6, 7, 8, 9],
  },
}

interface CryptoEvent {
  line: number
  type: string
  msg: string
  mapping: Record<string, number>
  index: number
  success?: boolean
}

// ─── Trace Generator ─────────────────────────────────────────────────────────
function generateTrace(scenario: CryptoScenario): CryptoEvent[] {
  const trace: CryptoEvent[] = []
  const mapping: Record<string, number> = {}
  const used = new Set<number>()
  const { words, result, letters, firstLetters, digitOrder } = scenario

  const emit = (ev: Partial<CryptoEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '',
      mapping: { ...mapping }, index: 0,
      ...ev,
    } as CryptoEvent)
  }

  function checkEq() {
    const getVal = (w: string) => parseInt(w.split('').map(c => mapping[c]).join(''), 10)
    const sum = words.reduce((a, b) => a + getVal(b), 0)
    const res = getVal(result)
    return sum === res
  }

  emit({ line: 1, type: 'start', msg: `Starting Cryptarithmetic search for ${words.join(' + ')} = ${result}` })

  function solve(index: number): boolean {
    if (trace.length > 2000) return false // safety cap

    emit({ line: 2, type: 'check', index, msg: `Checking if all ${letters.length} letters assigned...` })
    if (index === letters.length) {
      const isValid = checkEq()
      if (isValid) {
        emit({ line: 3, type: 'solution', index, success: true, msg: `🎉 Valid solution found!` })
        return true
      } else {
        emit({ line: 3, type: 'conflict', index, success: false, msg: `✗ Equation invalid with this mapping.` })
        return false
      }
    }

    const letter = letters[index]
    emit({ line: 5, type: 'assign', index, msg: `Assigning digit to '${letter}'...` })

    for (const digit of digitOrder) {
      emit({ line: 6, type: 'try', index, msg: `Try digit ${digit} for '${letter}'` })
      
      if (used.has(digit)) {
        emit({ line: 7, type: 'conflict', index, msg: `Digit ${digit} is already used.` })
        continue
      }
      if (digit === 0 && firstLetters.includes(letter)) {
        emit({ line: 8, type: 'conflict', index, msg: `'${letter}' is a leading letter, cannot be 0.` })
        continue
      }

      mapping[letter] = digit
      used.add(digit)
      emit({ line: 11, type: 'place', index, msg: `Assigned ${letter} = ${digit}` })

      if (solve(index + 1)) return true

      delete mapping[letter]
      used.delete(digit)
      emit({ line: 18, type: 'backtrack', index, msg: `Backtrack: removed ${letter} = ${digit}` })
    }

    emit({ line: 21, type: 'backtrack', index, msg: `No valid digits left for '${letter}', backtracking...` })
    return false
  }

  solve(0)
  return trace
}

// ─── Visualizer ───────────────────────────────────────────────────────────────
function CryptoViz({ ev, scenario }: { ev: CryptoEvent, scenario: CryptoScenario }) {
  const { words, result, letters } = scenario
  const maxLen = result.length

  const getCharStr = (word: string, isResult = false) => {
    const pad = ' '.repeat(maxLen - word.length)
    return pad + word
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', padding: '20px 0' }}>
      
      {/* Math Equation */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 36, letterSpacing: '0.2em', fontWeight: 600,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        color: 'var(--ink)'
      }}>
        {words.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: 'var(--ink-dimmer)', width: 30 }}>{i === words.length - 1 ? '+' : ''}</span>
            <div style={{ display: 'flex' }}>
              {getCharStr(w).split('').map((char, ci) => {
                const isActive = letters[ev.index] === char
                const val = ev.mapping[char]
                return (
                  <div key={ci} style={{
                    width: 40, textAlign: 'center',
                    color: val !== undefined ? 'var(--teal)' : isActive ? 'var(--gold)' : 'var(--ink)',
                    textShadow: isActive ? '0 0 12px var(--gold)' : 'none',
                    transition: 'all .2s'
                  }}>
                    {char === ' ' ? '' : (val !== undefined ? val : char)}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div style={{ height: 4, background: 'var(--ink-dimmer)', width: '100%', margin: '8px 0', borderRadius: 2 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ width: 30 }} />
          <div style={{ display: 'flex' }}>
            {getCharStr(result).split('').map((char, ci) => {
              const isActive = letters[ev.index] === char
              const val = ev.mapping[char]
              return (
                <div key={ci} style={{
                  width: 40, textAlign: 'center',
                  color: val !== undefined ? 'var(--teal)' : isActive ? 'var(--gold)' : 'var(--ink)',
                  textShadow: isActive ? '0 0 12px var(--gold)' : 'none',
                  transition: 'all .2s'
                }}>
                  {char === ' ' ? '' : (val !== undefined ? val : char)}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Letter Mappings */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 400 }}>
        {letters.map((l, i) => {
          const val = ev.mapping[l]
          const isCurrent = i === ev.index
          return (
            <div key={l} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: isCurrent ? 'rgba(232,179,74,.1)' : val !== undefined ? 'rgba(79,189,186,.1)' : 'var(--bg-alt)',
              border: `1px solid ${isCurrent ? 'var(--gold)' : val !== undefined ? 'var(--teal)' : 'var(--border)'}`,
              borderRadius: 8, padding: '8px 16px', minWidth: 60,
              boxShadow: isCurrent ? '0 0 0 2px var(--gold)' : 'none',
              transition: 'all .2s'
            }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink-dim)', marginBottom: 4 }}>{l}</span>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700,
                color: val !== undefined ? (isCurrent ? 'var(--gold)' : 'var(--teal)') : 'var(--ink-dimmer)'
              }}>
                {val !== undefined ? val : '?'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const TYPE_TO_CLASS: Record<string, string> = {
  solution: 'safe-ok', place: 'safe-ok', conflict: 'conflict', backtrack: 'conflict'
}
const LOG_CLASS: Record<string, string> = {
  solution: 'solution', place: 'place', conflict: 'conflict', backtrack: 'backtrack', try: 'scan'
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Cryptarithmetic() {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>('togo')
  const [trace, setTrace] = useState<CryptoEvent[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(300)
  const logRef = useRef<HTMLDivElement>(null)

  const rebuild = useCallback((s: keyof typeof SCENARIOS) => {
    setPlaying(false)
    setTrace(generateTrace(SCENARIOS[s]))
    setIdx(0)
  }, [])

  useEffect(() => { rebuild(scenario) }, [scenario, rebuild])

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

  const sc = SCENARIOS[scenario]

  return (
    <div className="tracer-page">
      <header className="tracer-header">
        <div>
          <Link to="/" className="tracer-back">← Home</Link>
          <div className="tracer-title-block" style={{ marginTop: 6 }}>
            <p className="tracer-eyebrow">Constraint Satisfaction · Backtracking</p>
            <h1 className="tracer-title"><span className="icon">🔠</span> Cryptarithmetic</h1>
          </div>
        </div>
        <div className="config-row">
          <ThemeToggle />
          <div className="config-group">
            <span className="config-label">Puzzle</span>
            <div className="n-btns">
              {(Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]).map(s => (
                <button key={s} className={`n-btn${scenario === s ? ' active' : ''}`} style={{ width: 'auto', padding: '0 10px' }} onClick={() => setScenario(s)}>
                  {SCENARIOS[s].label}
                </button>
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
          filename="cryptarithmetic.py"
          vars={{ index: ev.index, letter: sc.letters[ev.index] || '—' }}
        />
        <div className="panel">
          <div className="panel-head">
            <span className="name">Equation & Mappings</span>
            <span className="name" style={{ color: 'var(--teal)' }}>{ev.type.replace(/-/g, ' ')}</span>
          </div>
          <div className="viz-body">
            <CryptoViz ev={ev} scenario={sc} />
          </div>
          <div className="log-panel">
            <div className="log-body" ref={logRef}>
              {trace.slice(0, idx + 1).map((e, i) => (
                <div key={i} className={`log-entry ${LOG_CLASS[e.type] ?? ''}`}>{e.msg}</div>
              ))}
            </div>
          </div>
          <div className="stat-bar">
            <span className="stat">Assigned: <b>{Object.keys(ev.mapping).length} / {sc.letters.length}</b></span>
            <span className="stat">Used Digits: <b>{Object.values(ev.mapping).join(', ') || 'none'}</b></span>
          </div>
        </div>
      </div>

      <TracerControls idx={idx} total={total} playing={playing} speed={speed}
        onPlay={togglePlay} onNext={next} onPrev={prev} onReset={reset} onSpeed={setSpeed} />
    </div>
  )
}
