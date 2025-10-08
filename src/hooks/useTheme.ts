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

export function useTheme(): ThemeContextValue {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const theme: ThemeTokens = mode === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    // apply variables + set data attribute for easy CSS targeting
    applyTheme(theme);
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, theme]);

  const toggle = useCallback(() => setMode(m => (m === "dark" ? "light" : "dark")), []);
  const set = useCallback((m: ThemeMode) => setMode(m), []);

  return { mode, toggle, set, theme };
}
