import { createContext } from "react";
import type { ThemeContextValue } from "../hooks/useTheme";

export const ThemeContext = createContext<ThemeContextValue | null>(null);
