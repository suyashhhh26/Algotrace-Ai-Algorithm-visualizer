import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const algorithms = [
  {
    path: '/nqueens',
    icon: '♛',
    tag: 'Backtracking · Recursion',
    title: 'N-Queens Problem',
    desc: 'Place N queens on an N×N chessboard so no two queens threaten each other. Watch the backtracking algorithm try, fail, and recurse in real time.',
  },
  {
    path: '/8puzzle',
    icon: '🧩',
    tag: 'A* Search · Heuristics',
    title: '8-Puzzle (Misplaced Tiles)',
    desc: 'Solve a sliding tile puzzle using A* search with the misplaced tiles heuristic. See the priority queue, g+h costs, and each state expansion.',
  },
  {
    path: '/tictactoe',
    icon: '⚔️',
    tag: 'Minimax · Game Tree',
    title: 'Tic-Tac-Toe (XO)',
    desc: 'Watch the Minimax algorithm explore every possible game state to find the optimal move. Trace the game tree depth-first, score-by-score.',
  },
  {
    path: '/chaining',
    icon: '🔗',
    tag: 'Forward & Backward Chaining',
    title: 'Inference Engine',
    desc: 'See how rule-based AI derives new facts (data-driven) or proves goals (goal-driven) using a knowledge base of logical rules.',
  },
  {
    path: '/cryptarithmetic',
    icon: '🔠',
    tag: 'Constraint Satisfaction',
    title: 'Cryptarithmetic',
    desc: 'Watch Backtracking Search solve classic puzzles like TO+GO=OUT by assigning unique digits to letters, avoiding conflicts.',
  },
  {
    path: '/graph-search',
    icon: '🕸️',
    tag: 'Graph Traversal · Queue & Stack',
    title: 'BFS & DFS Search',
    desc: 'Compare Breadth-First Search and Depth-First Search side-by-side. Watch the Queue and Stack data structures in action.',
  },
]

export default function Home() {
  return (
    <div className="home-wrap">
      <header className="home-header">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <ThemeToggle />
        </div>
        <p className="home-eyebrow">AI Algorithms · Traced Step-by-Step</p>
        <h1 className="home-title">
          AlgoTrace<br />
          <span>AI Algorithm Visualizer</span>
        </h1>
        <p className="home-subtitle">
          Every line of code mapped to a live animation. Step forward, step back,
          or let it play — built for learners and educators.
        </p>
      </header>

      <div className="algo-grid">
        {algorithms.map((a) => (
          <Link key={a.path} to={a.path} className="algo-card">
            <span className="algo-card-icon">{a.icon}</span>
            <p className="algo-card-tag">{a.tag}</p>
            <h2 className="algo-card-title">{a.title}</h2>
            <p className="algo-card-desc">{a.desc}</p>
            <span className="algo-card-arrow">→</span>
          </Link>
        ))}
      </div>

      <footer style={{
        marginTop: 64,
        padding: '24px 0',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        fontFamily: 'var(--mono)',
        fontSize: '13px',
        color: 'var(--ink-dimmer)'
      }}>
        © {new Date().getFullYear()} AlgoTrace. All rights reserved by Suyash Patil.
      </footer>
    </div>
  )
}
