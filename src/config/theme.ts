import { lightPalette, darkPalette, type Palette } from "./palette";
import { fonts } from "./font";
import { radius } from "./radius";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { sizing } from "./sizing";
import { brand } from "./brand";

export type ThemeTokens = {
  palette: Palette;
  fonts:       typeof fonts;
  radius:      typeof radius;
  typography:  typeof typography;
  spacing:     typeof spacing;
  sizing:      typeof sizing;
   ticker: {
    height: string;
    speedSec: number;
    // any other ticker-related theme tokens
  };
};

export const lightTheme: ThemeTokens = {
  palette: lightPalette,
  fonts,
  radius,
  typography,
  spacing,
  sizing,
  ticker: {
    height: "32px",
    speedSec: 28,
  },
};

export const darkTheme: ThemeTokens = {
  palette: darkPalette,
  fonts,
  radius,
  typography,
  spacing,
  sizing,
  ticker: {
    height: "32px",
    speedSec: 28,
  },
};

export const ticker = {
  height: "32px",
  speedSec: 28,
  // etc.
};

// Utility: apply tokens to CSS variables on <html>
export function applyTheme(theme: ThemeTokens) {
  const r = document.documentElement;
  const p = theme.palette;

  // colors
  r.style.setProperty("--bg", p.bg);
  r.style.setProperty("--surface", p.surface);
  r.style.setProperty("--text", p.text);
  r.style.setProperty("--text-muted", p.textMuted);
  r.style.setProperty("--primary", p.primary);
  r.style.setProperty("--primary-fg", p.primaryFg);
  r.style.setProperty("--accent", p.accent);
  r.style.setProperty("--border", p.border);

  // fonts
  r.style.setProperty("--font-heading", theme.fonts.heading);
  r.style.setProperty("--font-body", theme.fonts.body);

  // radius
  r.style.setProperty("--radius-sm", theme.radius.sm);
  r.style.setProperty("--radius-md", theme.radius.md);
  r.style.setProperty("--radius-lg", theme.radius.lg);
  r.style.setProperty("--radius-xl", theme.radius.xl);
  r.style.setProperty("--radius-pill", theme.radius.pill);

  //typography
  r.style.setProperty("--line-height-base", theme.typography?.baseLineHeight);
  r.style.setProperty("--font-weight-base", theme.typography?.baseWeight);
  r.style.setProperty("--font-weight-heading", theme.typography?.headingWeight);

  // Spacing
  r.style.setProperty("--space-xs", theme.spacing.xs);
  r.style.setProperty("--space-sm", theme.spacing.sm);
  r.style.setProperty("--space-md", theme.spacing.md);
  r.style.setProperty("--space-lg", theme.spacing.lg);
  r.style.setProperty("--space-xl", theme.spacing.xl);
  r.style.setProperty("--space-2xl", theme.spacing["2xl"]);
  r.style.setProperty("--space-3xl", theme.spacing["3xl"]);

  r.style.setProperty("--page-margin", theme.spacing.pageMargin);
  r.style.setProperty("--full-height", theme.spacing.fullHeight);
  r.style.setProperty("--container-max", theme.spacing.containerMax);

  // sizing
  r.style.setProperty("--container-max", theme.sizing.containerMax);
  r.style.setProperty("--sidebar-width", theme.sizing.sidebarWidth);

  r.style.setProperty("--header-height", theme.sizing.headerHeight);
  r.style.setProperty("--footer-height", theme.sizing.footerHeight);

  r.style.setProperty("--min-section-height", theme.sizing.minSectionHeight);
  r.style.setProperty("--full-height", theme.sizing.fullHeight);

  r.style.setProperty("--bp-mobile", theme.sizing.mobile);
  r.style.setProperty("--bp-tablet", theme.sizing.tablet);
  r.style.setProperty("--bp-desktop", theme.sizing.desktop);
  r.style.setProperty("--bp-wide", theme.sizing.wide);

  //ticker
  const tickerHeight = brand.appearance?.tickerHeight ?? theme.ticker.height
  const speed = brand.appearance?.tickerSpeedSec ?? theme.ticker.speedSec;;
  r.style.setProperty("--ticker-height", tickerHeight);
  console.log("Applying ticker-height:", tickerHeight);
  r.style.setProperty("--ticker-speed", speed.toString());
  console.log("Applying ticker-speed:", speed);

}