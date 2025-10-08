import { useState, useEffect, useCallback } from "react";

/**
 * Manages a boolean dismiss flag stored in localStorage.
 * @param key unique key under which we store the dismissal state
 * @param defaultValue whether it's shown by default
 */
export function useDismissable(key: string, defaultValue = true) {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return defaultValue;
      return stored === "true";
    } catch {
      return defaultValue;
    }
  });

  // persist when visible changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, visible.toString());
    } catch {
      // ignore localStorage failures
    }
  }, [key, visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const reset = useCallback(() => {
    setVisible(true);
  }, []);

  return { visible, dismiss, reset };
}
