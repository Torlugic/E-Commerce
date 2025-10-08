import { createContext, useContext } from "react";
import { useTheme } from "../../hooks/useTheme";
import type { PropsWithChildren } from "react";

type Ctx = ReturnType<typeof useTheme>;
const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useTheme();
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeCtx() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useThemeCtx must be used within <ThemeProvider>");
  return ctx;
}

// Optional: a simple toggle button you can drop anywhere
export function ThemeToggle() {
  const { mode, toggle } = useThemeCtx();
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
