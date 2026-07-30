import type { AlgorithmConfig, AlgorithmStep, SortingBar } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

const generateMergeSortSteps = (input: any): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const arr = [...input];
  const n = arr.length;
  
  const createBars = (
    currentArr: number[],
    comparing: number[] = [],
    swapping: number[] = [],
    sorted: number[] = [],
    current: number = -1,
    leftPointer: number = -1,
    rightPointer: number = -1
  ): SortingBar[] => {
    return currentArr.map((val, idx) => {
      let state: SortingBar['state'] = 'default';
      if (sorted.includes(idx)) state = 'sorted';
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

  steps.push({
    id: stepId++,
    description: 'Initial state',
    explanation: 'Merge sort is a divide and conquer algorithm. We will recursively divide the array into halves until we have arrays of size 1, then merge them back together in sorted order.',
    highlightLines: [2, 11],
    variables: { n },
    bars: createBars(arr),
    comparisons,
    swaps,
    complexity: { time: 'O(n log n)', space: 'O(n)' }
  });

  const merge = (left: number, mid: number, right: number) => {
    const n1 = mid - left + 1;
    const n2 = right - mid;

    const L = new Array(n1);
    const R = new Array(n2);

    for (let i = 0; i < n1; i++) L[i] = arr[left + i];
    for (let j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

    let i = 0;
    let j = 0;
    let k = left;

    steps.push({
        id: stepId++,
        description: `Merging subarrays`,
        explanation: `Merging left subarray [${L.join(', ')}] and right subarray [${R.join(', ')}].`,
        highlightLines: [15, 16],
        variables: { left, mid, right, L: [...L], R: [...R] },
        bars: createBars(arr, [], [], [], -1, left, right),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(n)' }
    });

    while (i < n1 && j < n2) {
      comparisons++;
      
      steps.push({
        id: stepId++,
        description: `Compare elements from subarrays`,
        explanation: `Comparing ${L[i]} (left) with ${R[j]} (right).`,
        highlightLines: [21, 22],
        variables: { i, j, k, 'L[i]': L[i], 'R[j]': R[j] },
        bars: createBars(arr, [left + i, mid + 1 + j], [], [], -1, left + i, mid + 1 + j),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(n)' }
      });

      if (L[i] <= R[j]) {
        arr[k] = L[i];
        i++;
      } else {
        arr[k] = R[j];
        j++;
      }
      swaps++; // Copying operation
      
      steps.push({
        id: stepId++,
        description: `Place smaller element into merged array`,
        explanation: `Placed ${arr[k]} into the main array at index ${k}.`,
        highlightLines: [23, 26],
        variables: { k, inserted: arr[k] },
        bars: createBars(arr, [], [k]),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(n)' }
      });
      k++;
    }

    while (i < n1) {
      arr[k] = L[i];
      i++;
      k++;
      swaps++;
    }

    while (j < n2) {
      arr[k] = R[j];
      j++;
      k++;
      swaps++;
    }
    
    // Mark merged section as visually distinct (optional, or just update)
    steps.push({
        id: stepId++,
        description: `Merge complete for range [${left}, ${right}]`,
        explanation: `The subarray from index ${left} to ${right} is now sorted.`,
        highlightLines: [31, 35],
        variables: { left, right },
        bars: createBars(arr, [], [], Array.from({length: right - left + 1}, (_, i) => left + i)),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(n)' }
    });
  };

  const mergeSort = (left: number, right: number) => {
    if (left >= right) {
      return;
    }
    const mid = left + Math.floor((right - left) / 2);
    
    steps.push({
        id: stepId++,
        description: `Divide array`,
        explanation: `Dividing array at mid = ${mid}. Range: [${left}, ${right}]`,
        highlightLines: [3, 4],
        variables: { left, right, mid },
        bars: createBars(arr, [], [], [], -1, left, right),
        comparisons,
        swaps,
        complexity: { time: 'O(n log n)', space: 'O(n)' }
    });

    mergeSort(left, mid);
    mergeSort(mid + 1, right);
    merge(left, mid, right);
  };

  mergeSort(0, n - 1);

  steps.push({
    id: stepId++,
    description: 'Array is fully sorted',
    explanation: 'Merge sort is complete.',
    highlightLines: [39],
    variables: { completed: true },
    bars: createBars(arr, [], [], Array.from({length: n}, (_, i) => i)),
    comparisons,
    swaps,
    complexity: { time: 'O(n log n)', space: 'O(n)' }
  });

  return steps;
};

export const mergeSortConfig: AlgorithmConfig = {
  id: 'merge-sort',
  name: 'Merge Sort',
  category: 'sorting',
  description: 'An efficient, general-purpose, and comparison-based sorting algorithm. Most implementations produce a stable sort, which means that the order of equal elements is the same in the input and output.',
  difficulty: 'medium',
  visualizationType: 'bars',
  defaultInput: [38, 27, 43, 3, 9, 82, 10, 19, 50, 5],
  generateRandomInput: () => Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1),
  generateSteps: generateMergeSortSteps,
  theory: {
    introduction: 'Merge Sort is a Divide and Conquer algorithm. It divides the input array into two halves, calls itself for the two halves, and then merges the two sorted halves.',
    working: '1. Divide the unsorted list into n sublists, each containing one element (a list of one element is considered sorted).\n2. Repeatedly merge sublists to produce new sorted sublists until there is only one sorted list remaining. This will be the sorted list.',
    applications: ['Sorting linked lists in O(n log n) time', 'Inversion count problem', 'External sorting'],
    advantages: ['Guaranteed O(n log n) time complexity', 'Stable sorting algorithm', 'Works well for linked lists'],
    disadvantages: ['Requires O(n) auxiliary space', 'Slower than QuickSort for smaller arrays due to overhead'],
    timeComplexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)'
    },
    spaceComplexity: 'O(n)',
    pseudocode: `function merge_sort(list m)
    // Base case. A list of zero or one elements is sorted, by definition.
    if length of m <= 1 then
        return m

    // Recursive case. First, divide the list into equal-sized sublists
    var left := empty list
    var right := empty list
    for each x with index i in m do
        if i < (length of m)/2 then
            add x to left
        else
            add x to right

    // Recursively sort both sublists.
    left := merge_sort(left)
    right := merge_sort(right)

    // Then merge the now-sorted sublists.
    return merge(left, right)`,
  },
  code: {
    python: `def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]

        merge_sort(L)
        merge_sort(R)

        i = j = k = 0

        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1

        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1

        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1
    return arr`,
    cpp: `void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[n1], R[n2];
    
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) { arr[k] = L[i]; i++; k++; }
    while (j < n2) { arr[k] = R[j]; j++; k++; }
}

void mergeSort(int arr[], int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
}`,
    java: `void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[] = new int[n1];
    int R[] = new int[n2];
    
    for (int i = 0; i < n1; ++i) L[i] = arr[l + i];
    for (int j = 0; j < n2; ++j) R[j] = arr[m + 1 + j];
    
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) { arr[k] = L[i]; i++; k++; }
    while (j < n2) { arr[k] = R[j]; j++; k++; }
}

void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
    javascript: `function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
}

function merge(left, right) {
    let result = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
}`
  }
};

registerAlgorithmConfig(mergeSortConfig.id, mergeSortConfig);
