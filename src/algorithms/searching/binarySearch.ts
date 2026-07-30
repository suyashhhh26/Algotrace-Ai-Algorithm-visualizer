import type { AlgorithmConfig, AlgorithmStep, ArrayElement } from '@/algorithms/types';
import { registerAlgorithmConfig } from '@/pages/AlgorithmPage';

const generateBinarySearchSteps = (input: any): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const arr: number[] = input.arr;
  const target: number = input.target;
  const n = arr.length;
  
  const createArrayElements = (
    left: number,
    right: number,
    mid: number = -1,
    foundIdx: number = -1,
    eliminated: number[] = []
  ): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement['state'] = 'default';
      let label: string | undefined = undefined;

      if (idx === foundIdx) state = 'found';
      else if (eliminated.includes(idx) || idx < left || idx > right) state = 'eliminated';
      else if (idx === mid) state = 'pointer-mid';
      else if (idx === left && idx === right) state = 'current'; // left and right on same
      
      if (idx === left && idx !== right) label = 'L';
      if (idx === right && idx !== left) label = 'R';
      if (idx === mid) label = label ? label + ', M' : 'M';
      if (idx === left && idx === right && idx === mid) label = 'L, M, R';
      if (idx === left && idx === right && idx !== mid) label = 'L, R';

      return { value: val, state, label };
    });
  };

  let left = 0;
  let right = n - 1;
  let stepId = 0;

  steps.push({
    id: stepId++,
    description: 'Initial state',
    explanation: `Looking for target value ${target} in a sorted array. We initialize Left (L) to 0 and Right (R) to ${n - 1}.`,
    highlightLines: [2, 3],
    variables: { left, right, target },
    array: createArrayElements(left, right),
    comparisons: 0,
    complexity: { time: 'O(log n)', space: 'O(1)' }
  });

  let comparisons = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    steps.push({
      id: stepId++,
      description: `Calculate Mid point`,
      explanation: `Mid = floor((${left} + ${right}) / 2) = ${mid}. Array value at Mid is ${arr[mid]}.`,
      highlightLines: [5],
      variables: { left, right, mid, 'arr[mid]': arr[mid], target },
      array: createArrayElements(left, right, mid),
      comparisons,
      complexity: { time: 'O(log n)', space: 'O(1)' }
    });

    comparisons++;
    if (arr[mid] === target) {
      steps.push({
        id: stepId++,
        description: `Target found!`,
        explanation: `The value at Mid (${arr[mid]}) matches our target (${target}). Search is complete.`,
        highlightLines: [6, 7],
        variables: { left, right, mid, target, found: true },
        array: createArrayElements(left, right, mid, mid),
        comparisons,
        complexity: { time: 'O(log n)', space: 'O(1)' }
      });
      return steps;
    }

    comparisons++;
    if (arr[mid] < target) {
      const oldLeft = left;
      left = mid + 1;
      steps.push({
        id: stepId++,
        description: `Value is less than target`,
        explanation: `Since ${arr[mid]} < ${target}, we know the target must be in the right half. We update Left = Mid + 1 = ${left}.`,
        highlightLines: [8, 9],
        variables: { left, right, mid, target },
        array: createArrayElements(left, right, -1),
        comparisons,
        complexity: { time: 'O(log n)', space: 'O(1)' }
      });
    } else {
      right = mid - 1;
      steps.push({
        id: stepId++,
        description: `Value is greater than target`,
        explanation: `Since ${arr[mid]} > ${target}, we know the target must be in the left half. We update Right = Mid - 1 = ${right}.`,
        highlightLines: [10, 11],
        variables: { left, right, mid, target },
        array: createArrayElements(left, right, -1),
        comparisons,
        complexity: { time: 'O(log n)', space: 'O(1)' }
      });
    }
  }

  steps.push({
    id: stepId++,
    description: `Target not found`,
    explanation: `Left pointer (${left}) is now greater than Right pointer (${right}). The target ${target} is not in the array.`,
    highlightLines: [12],
    variables: { left, right, target, found: false },
    array: createArrayElements(left, right), // All eliminated
    comparisons,
    complexity: { time: 'O(log n)', space: 'O(1)' }
  });

  return steps;
};

export const binarySearchConfig: AlgorithmConfig = {
  id: 'binary-search',
  name: 'Binary Search',
  category: 'searching',
  description: 'An efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item.',
  difficulty: 'easy',
  visualizationType: 'array',
  defaultInput: { arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 },
  generateRandomInput: () => {
    const arr = Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)).sort((a, b) => a - b);
    const target = Math.random() > 0.3 ? arr[Math.floor(Math.random() * arr.length)] : Math.floor(Math.random() * 100);
    return { arr, target };
  },
  generateSteps: generateBinarySearchSteps,
  theory: {
    introduction: 'Binary Search is a search algorithm that finds the position of a target value within a sorted array. Binary search compares the target value to the middle element of the array.',
    working: '1. Compare target with middle element.\n2. If target matches with middle element, we return the mid index.\n3. Else If target is greater than the mid element, then target can only lie in right half subarray after the mid element. So we recur for right half.\n4. Else (target is smaller) recur for the left half.',
    applications: ['Search operations in databases', 'Dictionary implementations', 'Finding elements in sorted datasets'],
    advantages: ['Much faster than linear search', 'Logarithmic time complexity O(log n)', 'Optimal for searching in sorted arrays'],
    disadvantages: ['Requires the array to be sorted first', 'Cannot be used on unsorted data'],
    timeComplexity: {
      best: 'O(1)',
      average: 'O(log n)',
      worst: 'O(log n)'
    },
    spaceComplexity: 'O(1)',
    pseudocode: `function binary_search(A, n, T)
    L := 0
    R := n − 1
    while L <= R do
        m := floor((L + R) / 2)
        if A[m] < T then
            L := m + 1
        else if A[m] > T then
            R := m − 1
        else:
            return m
    return unsuccessful`,
  },
  code: {
    python: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    cpp: `int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x)
            return m;
        if (arr[m] < x)
            l = m + 1;
        else
            r = m - 1;
    }
    return -1;
}`,
    java: `int binarySearch(int arr[], int x) {
    int l = 0, r = arr.length - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x)
            return m;
        if (arr[m] < x)
            l = m + 1;
        else
            r = m - 1;
    }
    return -1;
}`,
    javascript: `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
  }
};

registerAlgorithmConfig(binarySearchConfig.id, binarySearchConfig);
