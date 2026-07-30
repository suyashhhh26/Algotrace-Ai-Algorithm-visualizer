import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NQueens from './pages/NQueens'
import EightPuzzle from './pages/EightPuzzle'
import TicTacToe from './pages/TicTacToe'
import Chaining from './pages/Chaining'
import Cryptarithmetic from './pages/Cryptarithmetic'
import GraphSearch from './pages/GraphSearch'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/nqueens" element={<NQueens />} />
      <Route path="/8puzzle" element={<EightPuzzle />} />
      <Route path="/tictactoe" element={<TicTacToe />} />
      <Route path="/chaining" element={<Chaining />} />
      <Route path="/cryptarithmetic" element={<Cryptarithmetic />} />
      <Route path="/graph-search" element={<GraphSearch />} />
    </Routes>
  )
}
