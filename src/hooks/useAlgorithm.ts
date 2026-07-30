import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgorithmStep } from '@/algorithms/types';

interface UseAlgorithmOptions {
  steps: AlgorithmStep[];
  speed?: number;
  onComplete?: () => void;
}

interface UseAlgorithmReturn {
  currentStepIndex: number;
  currentStep: AlgorithmStep | null;
  isPlaying: boolean;
  speed: number;
  totalSteps: number;
  progress: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  goToStep: (index: number) => void;
  setSpeed: (speed: number) => void;
}

export function useAlgorithm({ steps, speed: initialSpeed = 1, onComplete }: UseAlgorithmOptions): UseAlgorithmReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(initialSpeed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= stepsRef.current.length - 1) {
        setIsPlaying(false);
        clearTimer();
        onComplete?.();
        return prev;
      }
      return prev + 1;
    });
  }, [clearTimer, onComplete]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
    setCurrentStepIndex(0);
  }, [clearTimer]);

  const goToStep = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, stepsRef.current.length - 1));
    setCurrentStepIndex(clampedIndex);
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      clearTimer();
      const interval = 1000 / speed;
      intervalRef.current = setInterval(() => {
        nextStep();
      }, interval);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, speed, nextStep, clearTimer, steps.length]);

  // Reset when steps change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    clearTimer();
  }, [steps, clearTimer]);

  const currentStep = steps.length > 0 ? steps[currentStepIndex] ?? null : null;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return {
    currentStepIndex,
    currentStep,
    isPlaying,
    speed,
    totalSteps,
    progress,
    play,
    pause,
    togglePlay,
    nextStep,
    prevStep,
    reset,
    goToStep,
    setSpeed,
  };
}
