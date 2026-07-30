import type { AlgorithmConfig, AlgorithmStep, SortingBar } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

const generateQuickSortSteps = (input: any): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const arr = [...input];
  const n = arr.length;
  
  const createBars = (
    currentArr: number[],
    comparing: number[] = [],
    swapping: number[] = [],
    sorted: number[] = [],
    pivot: number = -1,
    leftPointer: number = -1,
    rightPointer: number = -1
  ): SortingBar[] => {
    return currentArr.map((val, idx) => {
      let state: SortingBar['state'] = 'default';
      if (sorted.includes(idx)) state = 'sorted';
      else if (idx === pivot) state = 'pivot';
      else if (swapping.includes(idx)) state = 'swapping';
      else if (comparing.includes(idx)) state = 'comparing';
      else if (idx === leftPointer || idx === rightPointer) state = 'current';

      return {
        value: val,
        state,
        originalIndex: idx,
      };
    });
  };

  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [];

  steps.push({
    id: stepId++,
    description: 'Initial state',
    explanation: 'Quick sort selects a pivot element and partitions the array around the pivot, placing smaller elements to the left and larger elements to the right.',
    highlightLines: [2],
    variables: { n },
    bars: createBars(arr),
    comparisons,
    swaps,
    complexity: { time: 'O(n log n)', space: 'O(log n)' }
  });

  const partition = (low: number, high: number): number => {
    const pivot = arr[high];
    
    steps.push({
        id: stepId++,
        description: `Selected pivot: ${pivot}`,
        explanation: `Choosing the last element (${pivot}) as the pivot.`,
        highlightLines: [15],
        variables: { low, high, pivot },
        bars: createBars(arr, [], [], sortedIndices, high),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(log n)' }
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      comparisons++;
      
      steps.push({
        id: stepId++,
        description: `Comparing with pivot`,
        explanation: `Is ${arr[j]} < ${pivot}?`,
        highlightLines: [18, 19],
        variables: { j, 'arr[j]': arr[j], pivot, i },
        bars: createBars(arr, [j], [], sortedIndices, high, i, j),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(log n)' }
      });

      if (arr[j] < pivot) {
        i++;
        swaps++;
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        
        steps.push({
            id: stepId++,
            description: `Element is smaller than pivot`,
            explanation: `Swapping ${arr[j]} and ${arr[i]}.`,
            highlightLines: [20, 21],
            variables: { i, j },
            bars: createBars(arr, [], [i, j], sortedIndices, high),
            comparisons,
            swaps,
            complexity: { time: 'O(n log n)', space: 'O(log n)' }
        });
      }
    }
    
    swaps++;
    const temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    sortedIndices.push(i + 1);

    steps.push({
        id: stepId++,
        description: `Place pivot in correct position`,
        explanation: `Swap pivot ${arr[i+1]} with element at index ${i+1}. It is now in its final sorted position.`,
        highlightLines: [25, 26],
        variables: { pivotIndex: i + 1 },
        bars: createBars(arr, [], [i + 1, high], sortedIndices),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(log n)' }
    });

    return i + 1;
  };

  const quickSort = (low: number, high: number) => {
    if (low < high) {
      const pi = partition(low, high);
      
      steps.push({
        id: stepId++,
        description: `Recursively sort sub-arrays`,
        explanation: `Sort left of pivot [${low}, ${pi-1}] and right of pivot [${pi+1}, ${high}].`,
        highlightLines: [3, 4],
        variables: { low, high, pi },
        bars: createBars(arr, [], [], sortedIndices),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(log n)' }
      });

      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
        if (!sortedIndices.includes(low)) sortedIndices.push(low);
    }
  };

  quickSort(0, n - 1);
  
  // Ensure all are marked sorted at the end
  for(let i=0; i<n; i++) if(!sortedIndices.includes(i)) sortedIndices.push(i);

  steps.push({
    id: stepId++,
    description: 'Array is fully sorted',
    explanation: 'Quick sort is complete.',
    highlightLines: [9],
    variables: { completed: true },
    bars: createBars(arr, [], [], sortedIndices),
    comparisons,
    swaps,
    complexity: { time: 'O(n log n)', space: 'O(log n)' }
  });

  return steps;
};

export const quickSortConfig: AlgorithmConfig = {
  id: 'quick-sort',
  name: 'Quick Sort',
  category: 'sorting',
  description: 'An efficient, in-place sorting algorithm that in practice is faster than MergeSort and HeapSort. It is a divide-and-conquer algorithm based on partitioning arrays into smaller sub-arrays.',
  difficulty: 'medium',
  visualizationType: 'bars',
  defaultInput: [24, 9, 29, 14, 19, 27, 43, 34, 49, 39],
  generateRandomInput: () => Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1),
  generateSteps: generateQuickSortSteps,
  theory: {
    introduction: 'QuickSort is a Divide and Conquer algorithm. It picks an element as pivot and partitions the given array around the picked pivot. There are many different versions of quickSort that pick pivot in different ways.',
    working: '1. Pick an element, called a pivot, from the array.\n2. Partitioning: reorder the array so that all elements with values less than the pivot come before the pivot, while all elements with values greater than the pivot come after it. After this partitioning, the pivot is in its final position.\n3. Recursively apply the above steps to the sub-array of elements with smaller values and separately to the sub-array of elements with greater values.',
    applications: ['Commercial computing used in various language libraries', 'Information search', 'When average case time is important'],
    advantages: ['Often faster in practice than other O(N log N) algorithms', 'In-place sorting algorithm (requires very little extra space)', 'Cache friendly'],
    disadvantages: ['Worst-case time complexity is O(N²)', 'Not a stable sort'],
    timeComplexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n²)'
    },
    spaceComplexity: 'O(log n)',
    pseudocode: `algorithm quicksort(A, lo, hi) is
    if lo < hi then
        p := partition(A, lo, hi)
        quicksort(A, lo, p - 1)
        quicksort(A, p + 1, hi)

algorithm partition(A, lo, hi) is
    pivot := A[hi]
    i := lo
    for j := lo to hi - 1 do
        if A[j] < pivot then
            swap A[i] with A[j]
            i := i + 1
    swap A[i] with A[hi]
    return i`,
  },
  code: {
    python: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)
    return arr`,
    cpp: `int partition (int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
    java: `int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1); // index of smaller element
    for (int j = low; j < high; j++) {
        // If current element is smaller than the pivot
        if (arr[j] < pivot) {
            i++;
            // swap arr[i] and arr[j]
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    // swap arr[i+1] and arr[high] (or pivot)
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
    javascript: `function partition(arr, low, high) {
    let pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}

function quickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        let pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
    return arr;
}`
  }
};

registerAlgorithmConfig(quickSortConfig.id, quickSortConfig);
