import { useRef, useEffect, useCallback } from 'react'

export interface TraceEvent {
  line: number
  type: string
  msg: string
  board?: string[][]
  stack?: { label: string }[]
  vars?: Record<string, string | number>
  logClass?: string
  vizExtra?: unknown
}

interface TracerControlsProps {
  idx: number
  total: number
  playing: boolean
  speed: number
  onPlay: () => void
  onNext: () => void
  onPrev: () => void
  onReset: () => void
  onSpeed: (v: number) => void
}

export function TracerControls({
  idx, total, playing, speed,
  onPlay, onNext, onPrev, onReset, onSpeed
}: TracerControlsProps) {
  const pct = total ? (idx / (total - 1)) * 100 : 0

  return (
    <div>
      <div className="controls">
        <div className="ctrl-btns">
          <button className="ctrl-btn" onClick={onReset}>⏮ Reset</button>
          <button className="ctrl-btn" onClick={onPrev} disabled={idx === 0}>◀ Step</button>
          <button className={`ctrl-btn play`} onClick={onPlay}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button className="ctrl-btn" onClick={onNext} disabled={idx >= total - 1}>Step ▶</button>
        </div>
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="step-count">{idx + 1} / {total || 1}</span>
        </div>
        <div className="speed-wrap">
          <span className="speed-label">Speed</span>
          <input
            type="range" min={40} max={900} value={speed}
            onChange={e => onSpeed(Number(e.target.value))}
          />
        </div>
      </div>
      <p className="kbd-hint">
        Keyboard: <kbd>←</kbd> / <kbd>→</kbd> step · <kbd>Space</kbd> play/pause · <kbd>R</kbd> reset
      </p>
    </div>
  )
}

interface CodePanelProps {
  source: string[]
  activeLine: number
  activeClass: string
  filename: string
  vars?: Record<string, string | number>
  fnRanges?: [number, number][]
}

export function CodePanel({ source, activeLine, activeClass, filename, vars = {}, fnRanges = [] }: CodePanelProps) {
  const lineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    lineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeLine])

  function isDimFn(i: number) {
    return fnRanges.some(([a, b]) => i >= a && i <= b)
  }

  function highlight(line: string) {
    return line
      .replace(/#.*/g, m => `<span class="cm">${m}</span>`)
      .replace(/\b(def|for|in|if|elif|else|while|return|not|and|or|True|False|None|import|from|class|pass|break|continue|lambda|yield)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(print|range|int|input|len|min|max|abs|list|dict|set|append|pop|push|heappush|heappop|copy|deepcopy)\b(?=\()/g, '<span class="fn">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="str">"$1"</span>')
      .replace(/'([^']*)'/g, "<span class=\"str\">'$1'</span>")
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>')
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="name">{filename}</span>
        <div className="dot-row"><span /><span /><span /></div>
      </div>
      <div className="code-body">
        {source.map((line, i) => {
          const lineNum = i + 1
          const isActive = lineNum === activeLine
          let cls = 'code-line'
          if (isDimFn(lineNum)) cls += ' dim-fn'
          if (isActive) cls += ' active ' + activeClass
          return (
            <div
              key={i}
              className={cls}
              ref={isActive ? lineRef : null}
            >
              <span className="ln">{lineNum}</span>
              <span dangerouslySetInnerHTML={{ __html: highlight(line) }} />
            </div>
          )
        })}
      </div>
      <div className="vars-bar">
        {Object.entries(vars).map(([k, v]) => (
          <span key={k} className="var-chip">{k} = <b>{String(v)}</b></span>
        ))}
      </div>
    </div>
  )
}

export function useTracerKeyboard(
  onNext: () => void,
  onPrev: () => void,
  onReset: () => void,
  onPlay: () => void
) {
  const onPlayRef = useRef(onPlay)
  useEffect(() => { onPlayRef.current = onPlay }, [onPlay])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
      else if (e.code === 'Space') { e.preventDefault(); onPlayRef.current() }
      else if (e.key === 'r' || e.key === 'R') onReset()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNext, onPrev, onReset])
}

export function useAutoPlay(
  playing: boolean,
  speed: number,
  onTick: () => void
) {
  useEffect(() => {
    if (!playing) return
    const delay = 950 - speed
    const id = setInterval(onTick, delay)
    return () => clearInterval(id)
  }, [playing, speed, onTick])
}
