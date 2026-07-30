import type { AlgorithmConfig, AlgorithmStep, BoardCell } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

const generateNQueensSteps = (n: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  
  const createBoard = (board: number[]): BoardCell[][] => {
      const grid: BoardCell[][] = [];
      for(let r = 0; r < n; r++) {
          const row: BoardCell[] = [];
          for(let c = 0; c < n; c++) {
              let state: BoardCell['state'] = 'empty';
              let value = null;
              if (board[r] === c) {
                  state = 'placed';
                  value = 'Q';
              }
              row.push({ row: r, col: c, state, value });
          }
          grid.push(row);
      }
      return grid;
  };

  const cloneBoardAndMark = (board: number[], r: number, c: number, state: BoardCell['state']): BoardCell[][] => {
       const grid = createBoard(board);
       grid[r][c].state = state;
       if(state === 'trying' || state === 'conflict') {
           grid[r][c].value = 'Q';
       }
       return grid;
  };

  let stepId = 0;
  const board: number[] = new Array(n).fill(-1); // board[i] = col of queen in row i
  
  steps.push({
      id: stepId++,
      description: `Start N-Queens (${n}x${n})`,
      explanation: `Place ${n} queens on an ${n}x${n} chessboard so that no two queens threaten each other.`,
      highlightLines: [1, 2],
      variables: { n, row: 0 },
      board: createBoard(board),
      complexity: { time: 'O(N!)', space: 'O(N)' }
  });

  const isSafe = (row: number, col: number): boolean => {
      for (let i = 0; i < row; i++) {
          // Check column and diagonals
          if (board[i] === col || Math.abs(board[i] - col) === Math.abs(i - row)) {
              return false;
          }
      }
      return true;
  };

  const solve = (row: number): boolean => {
      if (row === n) {
          steps.push({
              id: stepId++,
              description: `Solution Found!`,
              explanation: `All ${n} queens have been placed successfully.`,
              highlightLines: [15, 16],
              variables: { row },
              board: createBoard(board),
              complexity: { time: 'O(N!)', space: 'O(N)' }
          });
          return true;
      }

      for (let col = 0; col < n; col++) {
          steps.push({
              id: stepId++,
              description: `Trying Queen at (${row}, ${col})`,
              explanation: `Checking if it's safe to place a queen at row ${row}, column ${col}.`,
              highlightLines: [4, 5],
              variables: { row, col },
              board: cloneBoardAndMark(board, row, col, 'trying'),
              complexity: { time: 'O(N!)', space: 'O(N)' }
          });

          if (isSafe(row, col)) {
              board[row] = col;
              steps.push({
                  id: stepId++,
                  description: `Queen placed at (${row}, ${col})`,
                  explanation: `Safe! Place the queen and recursively try to place queens in the next row.`,
                  highlightLines: [6, 7],
                  variables: { row, col },
                  board: createBoard(board),
                  complexity: { time: 'O(N!)', space: 'O(N)' }
              });

              const res = solve(row + 1);
              if (res) return true; // Stop after first solution for visualization purposes

              // Backtrack
              board[row] = -1;
              steps.push({
                  id: stepId++,
                  description: `Backtrack from (${row}, ${col})`,
                  explanation: `Placing queen at (${row}, ${col}) didn't lead to a solution. Remove it.`,
                  highlightLines: [9, 10],
                  variables: { row, col },
                  board: cloneBoardAndMark(board, row, col, 'removed'),
                  complexity: { time: 'O(N!)', space: 'O(N)' }
              });
          } else {
               steps.push({
                  id: stepId++,
                  description: `Conflict at (${row}, ${col})`,
                  explanation: `Unsafe. A previously placed queen attacks this position.`,
                  highlightLines: [4, 11],
                  variables: { row, col },
                  board: cloneBoardAndMark(board, row, col, 'conflict'),
                  complexity: { time: 'O(N!)', space: 'O(N)' }
              });
          }
      }
      return false;
  };

  solve(0);
  return steps;
};

export const nQueensConfig: AlgorithmConfig = {
  id: 'n-queens',
  name: 'N-Queens',
  category: 'backtracking',
  description: 'The N Queen is the problem of placing N chess queens on an N×N chessboard so that no two queens attack each other.',
  difficulty: 'medium',
  visualizationType: 'board',
  defaultInput: 4, // 4x4 board for quicker visualization
  generateRandomInput: () => [4, 5, 6, 8][Math.floor(Math.random() * 4)],
  generateSteps: (n) => generateNQueensSteps(n as number),
  theory: {
    introduction: 'The N-Queens problem asks to place N queens on an NxN chessboard such that no two queens attack each other. A queen attacks horizontally, vertically, and diagonally.',
    working: 'We use Backtracking:\n1. Start in the leftmost column (or top row).\n2. If all queens are placed, return true.\n3. Try all rows in the current column. For each row:\n   a. If the queen can be placed safely, mark this cell and recursively check if this leads to a solution.\n   b. If it leads to a solution, return true.\n   c. If not, unmark this cell (backtrack) and go to step 3(a) with the next row.',
    applications: ['Resource allocation', 'Constraint satisfaction problems', 'AI search algorithms'],
    advantages: ['Finds all possible solutions', 'Memory efficient compared to brute force'],
    disadvantages: ['Factorial time complexity makes it very slow for large N (N > 15)'],
    timeComplexity: {
      best: 'O(N!)',
      average: 'O(N!)',
      worst: 'O(N!)'
    },
    spaceComplexity: 'O(N)',
    pseudocode: `function solveNQueens(board, col):
    if col >= N:
        return true  // All queens placed
        
    for row from 0 to N-1:
        if isSafe(board, row, col):
            board[row][col] = 1  // Place queen
            
            if solveNQueens(board, col + 1):
                return true
                
            board[row][col] = 0  // Backtrack (Remove queen)
            
    return false`,
  },
  code: {
    python: `def solveNQueens(n):
    board = [-1] * n
    solutions = []
    
    def is_safe(row, col):
        for i in range(row):
            if board[i] == col or abs(board[i] - col) == abs(i - row):
                return False
        return True
        
    def solve(row):
        if row == n:
            solutions.append(board[:])
            return
            
        for col in range(n):
            if is_safe(row, col):
                board[row] = col
                solve(row + 1)
                board[row] = -1 # backtrack
                
    solve(0)
    return solutions`,
    cpp: `bool isSafe(vector<int>& board, int row, int col) {
    for (int i = 0; i < row; i++) {
        if (board[i] == col || abs(board[i] - col) == abs(i - row))
            return false;
    }
    return true;
}

bool solve(vector<int>& board, int row, int n) {
    if (row == n) return true;
    
    for (int col = 0; col < n; col++) {
        if (isSafe(board, row, col)) {
            board[row] = col;
            if (solve(board, row + 1, n))
                return true; // Return first solution
            board[row] = -1; // Backtrack
        }
    }
    return false;
}`,
    java: `boolean isSafe(int[] board, int row, int col) {
    for (int i = 0; i < row; i++) {
        if (board[i] == col || Math.abs(board[i] - col) == Math.abs(i - row))
            return false;
    }
    return true;
}

boolean solve(int[] board, int row, int n) {
    if (row == n) return true;
    
    for (int col = 0; col < n; col++) {
        if (isSafe(board, row, col)) {
            board[row] = col;
            if (solve(board, row + 1, n)) return true;
            board[row] = -1; // backtrack
        }
    }
    return false;
}`,
    javascript: `function solveNQueens(n) {
    const board = new Array(n).fill(-1);
    const res = [];
    
    function isSafe(row, col) {
        for (let i = 0; i < row; i++) {
            if (board[i] === col || Math.abs(board[i] - col) === Math.abs(i - row)) return false;
        }
        return true;
    }
    
    function solve(row) {
        if (row === n) {
            res.push([...board]);
            return;
        }
        for (let col = 0; col < n; col++) {
            if (isSafe(row, col)) {
                board[row] = col;
                solve(row + 1);
                board[row] = -1;
            }
        }
    }
    solve(0);
    return res;
}`
  }
};

registerAlgorithmConfig(nQueensConfig.id, nQueensConfig);
