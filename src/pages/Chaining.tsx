import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CodePanel, TracerControls, useTracerKeyboard, useAutoPlay } from '../components/Tracer'
import ThemeToggle from '../components/ThemeToggle'

// ─── Source ───────────────────────────────────────────────────────────────────
const SOURCE_FORWARD = [
  '# Forward Chaining (Data-Driven)',
  'def forward_chain(rules, facts, goal):',
  '  agenda = list(facts)  # known true facts',
  '  derived = set(facts)',
  '',
  '  while agenda:',
  '    fact = agenda.pop(0)',
  '    if fact == goal:',
  '      return True  # goal derived!',
  '',
  '    for rule in rules:',
  '      premises, conclusion = rule',
  '      if all(p in derived for p in premises):',
  '        if conclusion not in derived:',
  '          derived.add(conclusion)',
  '          agenda.append(conclusion)',
  '          print(f"Derived: {conclusion}")',
  '',
  '  return False  # goal not reachable',
]

const SOURCE_BACKWARD = [
  '# Backward Chaining (Goal-Driven)',
  'def backward_chain(rules, facts, goal):',
  '  if goal in facts:',
  '    return True  # already known!',
  '',
  '  for rule in rules:',
  '    premises, conclusion = rule',
  '    if conclusion == goal:',
  '      # try to prove all premises',
  '      if all(backward_chain(rules, facts, p)',
  '             for p in premises):',
  '        facts.add(conclusion)',
  '        return True',
  '',
  '  return False  # cannot prove goal',
]

// ─── Scenario Definitions ─────────────────────────────────────────────────────
interface Rule { premises: string[]; conclusion: string; label: string }
interface KBScenario {
  label: string
  facts: string[]
  rules: Rule[]
  goal: string
}

const SCENARIOS: Record<string, KBScenario> = {
  socrates: {
    label: '⚡ Socrates',
    facts: ['is_human'],
    goal: 'is_mortal',
    rules: [
      { premises: ['is_human'], conclusion: 'is_mortal', label: 'is_human → is_mortal' },
      { premises: ['is_mortal'], conclusion: 'will_die', label: 'is_mortal → will_die' },
    ],
  },
  light: {
    label: '💡 Light Bulb',
    facts: ['switch_on', 'power_ok'],
    goal: 'light_on',
    rules: [
      { premises: ['switch_on', 'power_ok'], conclusion: 'circuit_complete', label: 'switch_on ∧ power_ok → circuit_complete' },
      { premises: ['circuit_complete'], conclusion: 'light_on', label: 'circuit_complete → light_on' },
      { premises: ['light_on'], conclusion: 'room_bright', label: 'light_on → room_bright' },
    ],
  },
  rain: {
    label: '🌧️ Rain',
    facts: ['is_raining'],
    goal: 'take_umbrella',
    rules: [
      { premises: ['is_raining'], conclusion: 'ground_wet', label: 'is_raining → ground_wet' },
      { premises: ['ground_wet'], conclusion: 'shoes_wet', label: 'ground_wet → shoes_wet' },
      { premises: ['is_raining'], conclusion: 'take_umbrella', label: 'is_raining → take_umbrella' },
      { premises: ['shoes_wet'], conclusion: 'go_home', label: 'shoes_wet → go_home' },
    ],
  },
}


// ─── Types ────────────────────────────────────────────────────────────────────
interface ChainEvent {
  line: number
  type: string
  msg: string
  facts: string[]
  derived: string[]
  agenda: string[]
  currentFact?: string
  currentRule?: Rule
  currentGoal?: string
  ruleIdx?: number
  success?: boolean
}

// ─── Trace Generators ─────────────────────────────────────────────────────────
function generateForwardTrace(scenario: KBScenario): ChainEvent[] {
  const trace: ChainEvent[] = []
  const derived = new Set(scenario.facts)
  const agenda = [...scenario.facts]
  const goal = scenario.goal

  const emit = (ev: Partial<ChainEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '',
      facts: [...scenario.facts],
      derived: [...derived],
      agenda: [...agenda],
      ...ev,
    } as ChainEvent)
  }

  emit({ line: 2, type: 'init', msg: `Forward chaining started. Goal: "${goal}"`, currentGoal: goal })
  emit({ line: 3, type: 'init', msg: `Initial facts: ${scenario.facts.join(', ')}` })

  while (agenda.length > 0) {
    const fact = agenda.shift()!
    emit({ line: 7, type: 'dequeue', currentFact: fact, msg: `Processing fact: "${fact}"` })

    if (fact === goal) {
      emit({ line: 8, type: 'goal-reached', currentFact: fact, currentGoal: goal, success: true, msg: `🎉 Goal "${goal}" reached!` })
      break
    }

    for (let i = 0; i < scenario.rules.length; i++) {
      const rule = scenario.rules[i]
      emit({ line: 11, type: 'check-rule', currentFact: fact, currentRule: rule, ruleIdx: i, msg: `Check rule: ${rule.label}` })

      const allSatisfied = rule.premises.every(p => derived.has(p))
      if (allSatisfied) {
        if (!derived.has(rule.conclusion)) {
          derived.add(rule.conclusion)
          agenda.push(rule.conclusion)
          emit({
            line: 15, type: 'derive', currentRule: rule, ruleIdx: i,
            derived: [...derived], agenda: [...agenda],
            msg: `✓ Rule fired! Derived: "${rule.conclusion}"`,
          })
        } else {
          emit({ line: 14, type: 'already-known', currentRule: rule, msg: `"${rule.conclusion}" already derived.` })
        }
      } else {
        const missing = rule.premises.filter(p => !derived.has(p))
        emit({ line: 13, type: 'no-fire', currentRule: rule, ruleIdx: i, msg: `Rule cannot fire. Missing: ${missing.join(', ')}` })
      }
    }
  }

  if (!derived.has(goal)) {
    emit({ line: 18, type: 'fail', success: false, msg: `Goal "${goal}" could NOT be derived.` })
  }

  return trace
}

function generateBackwardTrace(scenario: KBScenario): ChainEvent[] {
  const trace: ChainEvent[] = []
  const facts = new Set(scenario.facts)

  const emit = (ev: Partial<ChainEvent>) => {
    trace.push({
      line: 1, type: 'info', msg: '',
      facts: [...scenario.facts],
      derived: [...facts],
      agenda: [],
      ...ev,
    } as ChainEvent)
  }

  emit({ line: 2, type: 'init', msg: `Backward chaining started. Goal: "${scenario.goal}"`, currentGoal: scenario.goal })

  function prove(goal: string, depth: number): boolean {
    emit({ line: 2, type: 'goal', currentGoal: goal, msg: `${'  '.repeat(depth)}Trying to prove: "${goal}"` })

    if (facts.has(goal)) {
      emit({ line: 3, type: 'known', currentGoal: goal, msg: `${'  '.repeat(depth)}✓ "${goal}" is already known!` })
      return true
    }

    for (let i = 0; i < scenario.rules.length; i++) {
      const rule = scenario.rules[i]
      if (rule.conclusion !== goal) continue

      emit({ line: 7, type: 'check-rule', currentRule: rule, currentGoal: goal, ruleIdx: i, msg: `${'  '.repeat(depth)}Try rule: ${rule.label}` })

      let allProved = true
      for (const premise of rule.premises) {
        const ok = prove(premise, depth + 1)
        if (!ok) { allProved = false; break }
      }

      if (allProved) {
        facts.add(goal)
        emit({ line: 12, type: 'derive', currentGoal: goal, currentRule: rule, derived: [...facts], msg: `${'  '.repeat(depth)}✓ Proved "${goal}" via rule: ${rule.label}` })
        return true
      } else {
        emit({ line: 15, type: 'no-fire', currentRule: rule, currentGoal: goal, msg: `${'  '.repeat(depth)}✗ Rule failed for "${goal}".` })
      }
    }

    emit({ line: 14, type: 'fail', currentGoal: goal, msg: `${'  '.repeat(depth)}✗ Cannot prove "${goal}".` })
    return false
  }

  const success = prove(scenario.goal, 0)
  emit({
    line: success ? 12 : 14, type: success ? 'goal-reached' : 'fail',
    success, currentGoal: scenario.goal,
    msg: success ? `🎉 Goal "${scenario.goal}" proved!` : `✗ Goal "${scenario.goal}" cannot be proved.`,
  })
  return trace
}

// ─── SVG Graph Visualization ─────────────────────────────────────────────────

interface NodePos { id: string; x: number; y: number; w: number; h: number }

/** Compute which column each proposition belongs to (BFS topological level). */
function computeLevels(scenario: KBScenario): Record<string, number> {
  const levels: Record<string, number> = {}
  scenario.facts.forEach(f => { levels[f] = 0 })

  let changed = true
  while (changed) {
    changed = false
    scenario.rules.forEach(r => {
      if (r.premises.every(p => levels[p] !== undefined)) {
        const maxPremiseLevel = Math.max(...r.premises.map(p => levels[p]))
        const newLevel = maxPremiseLevel + 1
        if (levels[r.conclusion] === undefined || levels[r.conclusion] < newLevel) {
          levels[r.conclusion] = newLevel
          changed = true
        }
      }
    })
  }
  // Unknown facts stay at level 0
  const allProps = new Set([...scenario.facts, ...scenario.rules.flatMap(r => [...r.premises, r.conclusion])])
  allProps.forEach(p => { if (levels[p] === undefined) levels[p] = 0 })
  return levels
}

const NODE_W = 130
const NODE_H = 34
const COL_GAP = 180
const ROW_GAP = 52

function ChainingGraph({ ev, scenario }: { ev: ChainEvent; scenario: KBScenario }) {
  const derived = new Set(ev.derived)
  const activeFact = ev.currentFact
  const activeGoal = ev.currentGoal
  const activeRule = ev.currentRule
  const activeRuleIdx = ev.ruleIdx

  // Compute all unique propositions and their levels
  const levels = useMemo(() => computeLevels(scenario), [scenario])
  const allProps = useMemo(() => {
    const s = new Set([
      ...scenario.facts,
      ...scenario.rules.flatMap(r => [...r.premises, r.conclusion]),
    ])
    return [...s]
  }, [scenario])

  // Group by level
  const byLevel = useMemo(() => {
    const m: Record<number, string[]> = {}
    allProps.forEach(p => {
      const l = levels[p] ?? 0
      if (!m[l]) m[l] = []
      m[l].push(p)
    })
    return m
  }, [allProps, levels])

  const maxLevel = Math.max(...Object.keys(byLevel).map(Number))

  // Compute x/y positions for each node
  const nodePos = useMemo((): Record<string, NodePos> => {
    const pos: Record<string, NodePos> = {}
    Object.entries(byLevel).forEach(([levelStr, props]) => {
      const level = Number(levelStr)
      const x = 20 + level * COL_GAP
      props.forEach((p, i) => {
        pos[p] = { id: p, x, y: 20 + i * ROW_GAP, w: NODE_W, h: NODE_H }
      })
    })
    return pos
  }, [byLevel])

  // SVG dimensions
  const svgW = 20 + (maxLevel + 1) * COL_GAP + NODE_W + 20
  const maxInLevel = Math.max(...Object.values(byLevel).map(a => a.length))
  const svgH = Math.max(220, 20 + maxInLevel * ROW_GAP + NODE_H + 20)

  // Determine node status
  function getNodeStatus(prop: string): 'unknown' | 'initial' | 'known' | 'current' | 'goal' | 'failed' {
    if (prop === scenario.goal && ev.success) return 'goal'
    if (prop === scenario.goal) return 'goal'
    if (prop === activeFact || prop === activeGoal) return 'current'
    if (derived.has(prop)) return scenario.facts.includes(prop) ? 'initial' : 'known'
    if (ev.type === 'fail' && prop === activeGoal) return 'failed'
    return 'unknown'
  }

  // Determine edge status for (premise → conclusion via rule)
  function getEdgeStatus(premise: string, ruleIdx: number, conclusion: string): 'inactive' | 'checking' | 'active' | 'fired' {
    const rule = scenario.rules[ruleIdx]
    if (!rule) return 'inactive'
    const isActive = ruleIdx === activeRuleIdx
    if (!isActive) {
      // Check if this edge is in a "fired" rule (derived contains conclusion)
      if (derived.has(conclusion) && rule.premises.every(p => derived.has(p))) return 'fired'
      return 'inactive'
    }
    if (ev.type === 'derive') return 'fired'
    if (ev.type === 'check-rule' || ev.type === 'no-fire') {
      if (derived.has(premise)) return 'active'
      return 'checking'
    }
    return 'inactive'
  }

  // Draw a smooth bezier path between two nodes (right edge of from → left edge of to)
  function edgePath(from: NodePos, to: NodePos) {
    const x1 = from.x + from.w
    const y1 = from.y + from.h / 2
    const x2 = to.x
    const y2 = to.y + to.h / 2
    const cx = (x1 + x2) / 2
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: svgW }}>
        <defs>
          {/* Arrowhead markers for different states */}
          {['inactive', 'checking', 'active', 'fired'].map(state => (
            <marker key={state} id={`arrow-${state}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={
                state === 'fired' ? '#4FBDBA' :
                state === 'active' ? '#E8B34A' :
                state === 'checking' ? '#5D707F' :
                '#2a3947'
              } />
            </marker>
          ))}
        </defs>

        {/* Draw edges per rule */}
        {scenario.rules.map((rule, ri) => {
          const conclusionPos = nodePos[rule.conclusion]
          if (!conclusionPos) return null

          return rule.premises.map(premise => {
            const premisePos = nodePos[premise]
            if (!premisePos) return null
            const status = getEdgeStatus(premise, ri, rule.conclusion)
            const color = status === 'fired' ? '#4FBDBA'
              : status === 'active' ? '#E8B34A'
              : status === 'checking' ? '#5D707F44'
              : '#2a394744'

            const d = edgePath(premisePos, conclusionPos)

            return (
              <g key={`edge-${ri}-${premise}`}>
                {/* Background dim path */}
                <path d={d} fill="none" stroke="#2a394744" strokeWidth="2" />
                {/* Animated foreground path */}
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={status !== 'inactive' ? 2.5 : 1.5}
                  strokeDasharray={status === 'active' || status === 'checking' ? '6 4' : 'none'}
                  markerEnd={`url(#arrow-${status})`}
                  style={{
                    animation: status === 'active' ? 'flow-dash 0.6s linear infinite' : 'none',
                    transition: 'stroke 0.3s, stroke-width 0.3s',
                    filter: status === 'fired' ? 'drop-shadow(0 0 4px #4FBDBA88)' : 'none',
                  }}
                />
                {/* Animated dot traveling along the edge */}
                {(status === 'active' || status === 'fired') && (
                  <circle r="4" fill={status === 'fired' ? '#4FBDBA' : '#E8B34A'} style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}>
                    <animateMotion dur="1.2s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            )
          })
        })}

        {/* Draw nodes */}
        {allProps.map(prop => {
          const pos = nodePos[prop]
          if (!pos) return null
          const status = getNodeStatus(prop)
          const isGoal = prop === scenario.goal

          const fill = status === 'goal' && ev.success ? 'rgba(92,200,122,0.15)'
            : status === 'goal' ? 'rgba(232,179,74,0.1)'
            : status === 'current' ? 'rgba(232,179,74,0.18)'
            : status === 'known' ? 'rgba(79,189,186,0.12)'
            : status === 'initial' ? 'rgba(79,189,186,0.08)'
            : status === 'failed' ? 'rgba(226,104,90,0.15)'
            : 'rgba(255,255,255,0.03)'

          const stroke = status === 'goal' && ev.success ? '#5CC87A'
            : status === 'goal' ? '#E8B34A'
            : status === 'current' ? '#E8B34A'
            : status === 'known' ? '#4FBDBA'
            : status === 'initial' ? '#4FBDBA88'
            : status === 'failed' ? '#E2685A'
            : '#2a3947'

          const strokeW = ['current', 'goal', 'known', 'failed'].includes(status) ? 2 : 1

          const textColor = status === 'goal' && ev.success ? '#5CC87A'
            : status === 'current' ? '#E8B34A'
            : status === 'known' || status === 'initial' ? '#4FBDBA'
            : status === 'failed' ? '#E2685A'
            : '#5D707F'

          const glowFilter = status === 'current'
            ? 'drop-shadow(0 0 8px rgba(232,179,74,0.7))'
            : status === 'known' || (status === 'goal' && ev.success)
            ? 'drop-shadow(0 0 8px rgba(79,189,186,0.5))'
            : status === 'goal'
            ? 'drop-shadow(0 0 6px rgba(232,179,74,0.4))'
            : 'none'

          // Truncate label for display
          const displayLabel = prop.length > 14 ? prop.slice(0, 13) + '…' : prop

          return (
            <g key={prop} style={{
              transition: 'filter 0.3s',
              filter: glowFilter,
              animation: status === 'current' ? 'node-scale-pulse 0.8s ease-in-out infinite' : 'none',
            }}>
              <rect
                x={pos.x} y={pos.y}
                width={pos.w} height={pos.h}
                rx="8"
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
                style={{ transition: 'fill 0.3s, stroke 0.3s' }}
              />
              {/* Goal star indicator */}
              {isGoal && (
                <text x={pos.x + 10} y={pos.y + pos.h / 2 + 5} fontSize="14" fill="#E8B34A">🎯</text>
              )}
              <text
                x={pos.x + (isGoal ? 28 : pos.w / 2)}
                y={pos.y + pos.h / 2 + 5}
                textAnchor={isGoal ? 'start' : 'middle'}
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
                fill={textColor}
                style={{ transition: 'fill 0.3s' }}
              >
                {displayLabel}
              </text>
              {/* "Known" check badge */}
              {(status === 'known' || status === 'initial') && (
                <text x={pos.x + pos.w - 14} y={pos.y + pos.h / 2 + 5} fontSize="12" fill="#4FBDBA">✓</text>
              )}
              {status === 'goal' && ev.success && (
                <text x={pos.x + pos.w - 14} y={pos.y + pos.h / 2 + 5} fontSize="12" fill="#5CC87A">★</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Rule Inspector Panel ─────────────────────────────────────────────────────
function RuleInspector({ ev, scenario }: { ev: ChainEvent; scenario: KBScenario }) {
  const derived = new Set(ev.derived)
  const activeRuleIdx = ev.ruleIdx

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 2px' }}>
      <div className="kb-label">Rules</div>
      {scenario.rules.map((rule, i) => {
        const isChecking = i === activeRuleIdx && ev.type === 'check-rule'
        const isNoFire = i === activeRuleIdx && ev.type === 'no-fire'
        const isFired = i === activeRuleIdx && ev.type === 'derive'
        const wasFired = rule.premises.every(p => derived.has(p)) && derived.has(rule.conclusion)

        let ruleStatus = 'idle'
        if (isFired) ruleStatus = 'fired'
        else if (isChecking) ruleStatus = 'checking'
        else if (isNoFire) ruleStatus = 'failed'
        else if (wasFired) ruleStatus = 'done'

        const borderColor = ruleStatus === 'fired' ? '#4FBDBA'
          : ruleStatus === 'checking' ? '#E8B34A'
          : ruleStatus === 'failed' ? '#E2685A'
          : ruleStatus === 'done' ? '#4FBDBA55'
          : '#2a3947'

        return (
          <div key={i} style={{
            background: ruleStatus === 'fired' ? 'rgba(79,189,186,.1)'
              : ruleStatus === 'checking' ? 'rgba(232,179,74,.08)'
              : ruleStatus === 'failed' ? 'rgba(226,104,90,.07)'
              : ruleStatus === 'done' ? 'rgba(79,189,186,.04)'
              : 'rgba(255,255,255,.02)',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            padding: '8px 12px',
            transition: 'all 0.3s',
            boxShadow: ruleStatus === 'fired' ? '0 0 12px rgba(79,189,186,.3)'
              : ruleStatus === 'checking' ? '0 0 12px rgba(232,179,74,.2)' : 'none',
            animation: ruleStatus === 'checking' ? 'rule-pulse 0.7s ease-in-out infinite' : 'none',
          }}>
            {/* Rule label */}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-dimmer)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Rule {i + 1}</span>
              <span style={{
                color: ruleStatus === 'fired' ? '#4FBDBA' : ruleStatus === 'checking' ? '#E8B34A' : ruleStatus === 'failed' ? '#E2685A' : ruleStatus === 'done' ? '#4FBDBA' : 'var(--ink-dimmer)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '.05em'
              }}>
                {ruleStatus === 'fired' ? '⚡ FIRED' : ruleStatus === 'checking' ? '⟳ CHECKING' : ruleStatus === 'failed' ? '✗ MISS' : ruleStatus === 'done' ? '✓ DONE' : ''}
              </span>
            </div>

            {/* Premises */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
              {rule.premises.map((p, pi) => {
                const isSatisfied = derived.has(p)
                return (
                  <span key={pi} style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 20,
                    border: `1px solid ${isSatisfied ? '#4FBDBA' : '#5D707F'}`,
                    color: isSatisfied ? '#4FBDBA' : 'var(--ink-dimmer)',
                    background: isSatisfied ? 'rgba(79,189,186,.1)' : 'transparent',
                    transition: 'all 0.3s',
                  }}>
                    {isSatisfied ? '✓ ' : ''}{p}
                  </span>
                )
              })}
              <span style={{ color: 'var(--ink-dimmer)', fontFamily: 'var(--mono)', fontSize: 14 }}>→</span>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
                border: `1px solid ${derived.has(rule.conclusion) ? '#4FBDBA' : '#E8B34A44'}`,
                color: derived.has(rule.conclusion) ? '#4FBDBA' : '#E8B34A88',
                background: derived.has(rule.conclusion) ? 'rgba(79,189,186,.1)' : 'rgba(232,179,74,.04)',
                transition: 'all 0.3s',
                animation: ruleStatus === 'fired' ? 'fact-pop 0.4s ease' : 'none',
              }}>
                {rule.conclusion}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Viz Panel (Graph + Inspector) ──────────────────────────────────────
function ChainingViz({ ev, scenario, mode }: { ev: ChainEvent; scenario: KBScenario; mode: string }) {
  const derived = new Set(ev.derived)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflow: 'hidden' }}>
      {/* Knowledge Base Summary */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '0 2px' }}>
        <span className="kb-label" style={{ margin: 0 }}>KB:</span>
        {[...new Set([...scenario.facts, ...scenario.rules.map(r => r.conclusion)])].map(p => {
          const isKnown = derived.has(p)
          const isCurrent = p === ev.currentFact || p === ev.currentGoal
          const isGoal = p === scenario.goal
          return (
            <span key={p} className="fact-chip"
              style={{
                transition: 'all 0.3s',
                borderColor: isGoal ? '#E8B34A' : isCurrent ? '#E8B34A88' : isKnown ? '#4FBDBA' : '',
                color: isGoal ? '#E8B34A' : isCurrent ? '#E8B34A' : isKnown ? '#4FBDBA' : '',
                background: isGoal && isKnown ? 'rgba(79,189,186,.12)' : isGoal ? 'rgba(232,179,74,.08)' : isKnown ? 'rgba(79,189,186,.08)' : '',
                boxShadow: isCurrent ? '0 0 10px rgba(232,179,74,.4)' : isKnown && isGoal && ev.success ? '0 0 12px rgba(79,189,186,.5)' : '',
                animation: p === ev.currentFact && ev.type === 'derive' ? 'fact-pop 0.4s ease' : 'none',
              }}>
              {isGoal ? '🎯 ' : isKnown && !scenario.facts.includes(p) ? '⚡' : ''}{p}
            </span>
          )
        })}
      </div>

      {/* SVG Graph */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: 'rgba(0,0,0,.15)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
        <ChainingGraph ev={ev} scenario={scenario} />
      </div>

      {/* Rule Inspector */}
      <div style={{ flexShrink: 0, maxHeight: 220, overflow: 'auto' }}>
        <RuleInspector ev={ev} scenario={scenario} />
      </div>
    </div>
  )
}

const TYPE_TO_CLASS: Record<string, string> = {
  derive: 'safe-ok', known: 'safe-ok', 'goal-reached': 'safe-ok',
  'no-fire': 'conflict', fail: 'conflict',
}

const LOG_CLASS: Record<string, string> = {
  derive: 'safe', 'goal-reached': 'solution', 'no-fire': 'backtrack',
  fail: 'conflict', known: 'safe', 'check-rule': 'scan', goal: 'info', dequeue: 'scan',
}

export default function Chaining() {
  const [mode, setMode] = useState<'forward' | 'backward'>('forward')
  const [scenarioKey, setScenarioKey] = useState<keyof typeof SCENARIOS>('socrates')
  const [trace, setTrace] = useState<ChainEvent[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(350)
  const logRef = useRef<HTMLDivElement>(null)

  const rebuild = useCallback((m: 'forward' | 'backward', s: keyof typeof SCENARIOS) => {
    setPlaying(false)
    const sc = SCENARIOS[s]
    const t = m === 'forward' ? generateForwardTrace(sc) : generateBackwardTrace(sc)
    setTrace(t)
    setIdx(0)
  }, [])

  useEffect(() => { rebuild(mode, scenarioKey) }, [mode, scenarioKey, rebuild])

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

  const scenario = SCENARIOS[scenarioKey]

  return (
    <div className="tracer-page">
      <header className="tracer-header">
        <div>
          <Link to="/" className="tracer-back">← Home</Link>
          <div className="tracer-title-block" style={{ marginTop: 6 }}>
            <p className="tracer-eyebrow">Inference Engine · Logic · Rule-Based AI</p>
            <h1 className="tracer-title"><span className="icon">🔗</span> Chaining Inference</h1>
          </div>
        </div>
        <div className="config-row">
          <ThemeToggle />
          <div className="config-group">
            <span className="config-label">Mode</span>
            <div className="n-btns">
              {(['forward', 'backward'] as const).map(m => (
                <button key={m} className={`n-btn${mode === m ? ' active' : ''}`}
                  style={{ width: 'auto', padding: '0 10px' }}
                  onClick={() => setMode(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="config-group">
            <span className="config-label">Scenario</span>
            <div className="n-btns">
              {(Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]).map(s => (
                <button key={s} className={`n-btn${scenarioKey === s ? ' active' : ''}`}
                  style={{ width: 'auto', padding: '0 10px' }}
                  onClick={() => setScenarioKey(s)}>{SCENARIOS[s].label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="tracer-grid">
        <CodePanel
          source={mode === 'forward' ? SOURCE_FORWARD : SOURCE_BACKWARD}
          activeLine={ev.line}
          activeClass={TYPE_TO_CLASS[ev.type] ?? ''}
          filename={mode === 'forward' ? 'forward_chain.py' : 'backward_chain.py'}
          vars={{ goal: scenario.goal, derived: ev.derived.length, mode }}
        />
        <div className="panel">
          <div className="panel-head">
            <span className="name">Knowledge graph</span>
            <span className="name" style={{
              color: ev.type === 'goal-reached' ? 'var(--green)'
                : ev.type === 'fail' ? 'var(--coral)'
                : ev.type === 'derive' ? 'var(--teal)'
                : 'var(--teal)'
            }}>
              {ev.type.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="viz-body" style={{ overflow: 'hidden', padding: '10px 12px' }}>
            <ChainingViz ev={ev} scenario={scenario} mode={mode} />
          </div>
          <div className="log-panel">
            <div className="log-body" ref={logRef}>
              {trace.slice(0, idx + 1).map((e, i) => (
                <div key={i} className={`log-entry ${LOG_CLASS[e.type] ?? ''}`}>{e.msg}</div>
              ))}
            </div>
          </div>
          <div className="stat-bar">
            <span className="stat">Derived: <b>{ev.derived.length}</b> facts</span>
            <span className="stat">Goal: <b>{scenario.goal}</b></span>
            <span className="stat">Mode: <b>{mode}</b></span>
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
