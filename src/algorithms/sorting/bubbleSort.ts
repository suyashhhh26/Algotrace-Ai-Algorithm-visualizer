import type { AlgorithmConfig, AlgorithmStep, SortingBar } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

const generateBubbleSortSteps = (input: any): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const arr = [...input];
  const n = arr.length;
  
  const createBars = (
    currentArr: number[],
    comparing: number[] = [],
    swapping: number[] = [],
    sorted: number[] = [],
    current: number = -1
  ): SortingBar[] => {
    return currentArr.map((val, idx) => {
      let state: SortingBar['state'] = 'default';
      if (sorted.includes(idx)) state = 'sorted';
      else if (swapping.includes(idx)) state = 'swapping';
      else if (comparing.includes(idx)) state = 'comparing';
      else if (idx === current) state = 'current';

      return {
        value: val,
        state,
        originalIndex: idx, // Not tracking original index perfectly here for simplicity, assuming visualizer doesn't strictly need it to animate if we use layout correctly
      };
    });
  };

  steps.push({
    id: 0,
    description: 'Initial state',
    explanation: 'We start with an unsorted array. Bubble sort will repeatedly step through the list, compare adjacent elements and swap them if they are in the wrong order.',
    highlightLines: [1, 2],
    variables: { i: 0, j: 0, n },
    bars: createBars(arr),
    comparisons: 0,
    swaps: 0,
    complexity: { time: 'O(n²)', space: 'O(1)' }
  });

  let comparisons = 0;
  let swaps = 0;
  let stepId = 1;
  const sortedIndices: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      
      steps.push({
        id: stepId++,
        description: `Comparing elements at index ${j} and ${j + 1}`,
        explanation: `Comparing ${arr[j]} and ${arr[j+1]}.`,
        highlightLines: [4],
        variables: { i, j, 'arr[j]': arr[j], 'arr[j+1]': arr[j+1] },
        bars: createBars(arr, [j, j + 1], [], sortedIndices),
        comparisons,
        swaps,
        complexity: { time: 'O(n²)', space: 'O(1)' }
      });

      if (arr[j] > arr[j + 1]) {
        swaps++;
        // Swap
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;

        steps.push({
          id: stepId++,
          description: `Swapped ${arr[j+1]} and ${arr[j]}`,
          explanation: `Since ${arr[j+1]} > ${arr[j]}, we swap them.`,
          highlightLines: [5, 6, 7],
          variables: { i, j, temp: arr[j] },
          bars: createBars(arr, [], [j, j + 1], sortedIndices),
          comparisons,
          swaps,
          complexity: { time: 'O(n²)', space: 'O(1)' }
        });
      }
    }
    sortedIndices.push(n - i - 1);
    steps.push({
      id: stepId++,
      description: `Element at index ${n - i - 1} is in its final sorted position.`,
      explanation: `The largest unsorted element has bubbled up to the correct position.`,
      highlightLines: [2, 3],
      variables: { i, sorted: n - i - 1 },
      bars: createBars(arr, [], [], sortedIndices),
      comparisons,
      swaps,
      complexity: { time: 'O(n²)', space: 'O(1)' }
    });
  }
  
  sortedIndices.push(0);
  steps.push({
    id: stepId++,
    description: 'Array is fully sorted',
    explanation: 'All elements are in their correct positions.',
    highlightLines: [9],
    variables: { completed: true },
    bars: createBars(arr, [], [], sortedIndices),
    comparisons,
    swaps,
    complexity: { time: 'O(n²)', space: 'O(1)' }
  });

  return steps;
};

export const bubbleSortConfig: AlgorithmConfig = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  category: 'sorting',
  description: 'A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
  difficulty: 'easy',
  visualizationType: 'bars',
  defaultInput: [45, 23, 11, 89, 77, 98, 4, 28, 65, 43],
  generateRandomInput: () => Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1),
  generateSteps: generateBubbleSortSteps,
  theory: {
    introduction: 'Bubble Sort is the simplest sorting algorithm that works by repeatedly swapping the adjacent elements if they are in the wrong order. This algorithm is not suitable for large data sets as its average and worst-case time complexity is quite high.',
    working: '1. Start from the first index, compare the first and the second elements.\n2. If the first element is greater than the second element, they are swapped.\n3. Now, compare the second and the third elements. Swap them if they are not in order.\n4. The above process goes on until the last element.\n5. The same process goes on for the remaining iterations. After each iteration, the largest element among the unsorted elements is placed at the end.',
    applications: ['Educational purposes', 'Sorting small arrays', 'When the array is almost sorted (modified bubble sort)'],
    advantages: ['Easy to understand and implement', 'Does not require any additional memory space (In-place)', 'Stable sorting algorithm'],
    disadvantages: ['High time complexity (O(n²))', 'Slow for large datasets', 'Many swaps required'],
    timeComplexity: {
      best: 'O(n)',
      average: 'O(n²)',
      worst: 'O(n²)'
    },
    spaceComplexity: 'O(1)',
    pseudocode: `procedure bubbleSort( A : list of sortable items )
    n = length(A)
    repeat
        swapped = false
        for i = 1 to n-1 inclusive do
            /* if this pair is out of order */
            if A[i-1] > A[i] then
                /* swap them and remember something changed */
                swap( A[i-1], A[i] )
                swapped = true
            end if
        end for
    until not swapped
end procedure`,
  },
  code: {
    python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap elements
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
    cpp: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
    java: `void bubbleSort(int arr[]) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
    javascript: `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}`
  }
};

registerAlgorithmConfig(bubbleSortConfig.id, bubbleSortConfig);
