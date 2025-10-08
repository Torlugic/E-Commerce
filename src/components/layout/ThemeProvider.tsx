import type { PropsWithChildren } from "react";
import { ThemeContext } from "../../contexts/themeContext";
import { useTheme } from "../../hooks/useTheme";
import { useThemeContext } from "../../hooks/useThemeContext";

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useTheme();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Optional: a simple toggle button you can drop anywhere
export function ThemeToggle() {
  const { mode, toggle } = useThemeContext();
  return (
    <button
      onClick={toggle}
      className="rounded-[var(--radius-sm)] px-3 py-1 border border-[var(--border)] 
                 text-[var(--text)] hover:bg-[var(--surface)]"
      aria-label="Toggle theme"
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
