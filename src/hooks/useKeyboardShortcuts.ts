import { useEffect, useState } from 'react';

interface KeyboardShortcutOptions {
  onTriggerConvert?: () => void;
  onEscape?: () => void;
  isConvertEnabled?: boolean;
}

export function useKeyboardShortcuts({
  onTriggerConvert,
  onEscape,
  isConvertEnabled = true
}: KeyboardShortcutOptions) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const platform = navigator.platform || (navigator as any).userAgentData?.platform || '';
      setIsMac(/Mac|iPhone|iPod|iPad/i.test(platform));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (isConvertEnabled && onTriggerConvert) {
          e.preventDefault();
          onTriggerConvert();
        }
      }

      // Escape
      if (e.key === 'Escape') {
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerConvert, onEscape, isConvertEnabled]);

  const modKeySymbol = isMac ? '⌘' : 'Ctrl+';
  const enterKeySymbol = isMac ? '↵' : 'Enter';

  return { isMac, modKeySymbol, enterKeySymbol };
}
