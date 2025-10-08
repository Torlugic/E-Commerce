export const tickerConfig = {
  // CSS variable-friendly default height
  height: "var(--ticker-height, 32px)",

  // animation loop time (lower = faster)
  speedSec: 28,

  // localStorage key for dismiss state
  dismissKey: "promo-ticker",

  // re-show after this many ms if dismissed (24h)
  ttlMs: 1 * 60 * 60 * 1000,
};
