import { useEffect, useState, useCallback } from "react";
import { applyTheme, lightTheme, darkTheme, type ThemeTokens } from "../config/theme";

export type ThemeMode = "light" | "dark";

export type ThemeContextValue = {
  mode: ThemeMode;
  toggle: () => void;
  set: (mode: ThemeMode) => void;
  theme: ThemeTokens;
};

const STORAGE_KEY = "theme-mode";

function readStoredMode(): ThemeMode | null {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    console.warn("Unable to read stored theme preference", error);
  }

  return null;
}

function detectPreferredScheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme(): ThemeContextValue {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return readStoredMode() ?? detectPreferredScheme();
  });

  const theme: ThemeTokens = mode === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    // apply variables + set data attribute for easy CSS targeting
    applyTheme(theme);
    document.documentElement.setAttribute("data-theme", mode);

    if (typeof window !== "undefined" && "localStorage" in window) {
      try {
        window.localStorage.setItem(STORAGE_KEY, mode);
      } catch (error) {
        console.warn("Unable to persist theme preference", error);
      }
    }
  }, [mode, theme]);

  const toggle = useCallback(() => setMode(m => (m === "dark" ? "light" : "dark")), []);
  const set = useCallback((m: ThemeMode) => setMode(m), []);

  return { mode, toggle, set, theme };
}
