import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onPlayPause?: () => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onReset?: () => void;
  onFullscreen?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or Monaco editor
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('role') === 'textbox' ||
        target.closest('.monaco-editor')
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          shortcuts.onPlayPause?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          shortcuts.onNextStep?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          shortcuts.onPrevStep?.();
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            shortcuts.onReset?.();
          }
          break;
        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            shortcuts.onFullscreen?.();
          }
          break;
        case 'BracketRight':
          e.preventDefault();
          shortcuts.onSpeedUp?.();
          break;
        case 'BracketLeft':
          e.preventDefault();
          shortcuts.onSpeedDown?.();
          break;
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
