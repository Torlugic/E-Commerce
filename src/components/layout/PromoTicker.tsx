import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { usePromoVisibility } from "../../hooks/usePromoVisibility";
import { tickerConfig } from "../../config/ticker";

type PromoItem = { id: string | number; text: string; href?: string };
type Props = {
  items: PromoItem[];
  speedSec?: number; // total loop time (lower = faster)
  className?: string;
  dismissKey?: string; // unique key for this ticker
  ttlMs?: number; // how long to hide after dismissal (default: 24hrs)
  height?: string;
};

export default function PromoTicker({
  items,
  speedSec = tickerConfig.speedSec,
  className = "",
  dismissKey = tickerConfig.dismissKey,
  ttlMs = tickerConfig.ttlMs,
  height = tickerConfig.height,
}: Props) {
  const safeItems = Array.isArray(items) ? items : [];
  const { visible, dismiss } = usePromoVisibility(safeItems, dismissKey, ttlMs);
  if (!safeItems.length || !visible) return null;

  const entryDurationSec = Math.min(Math.max(speedSec * 0.2, 1.5), 6);

  // prepare the row (duplicated) as before
  const row = (
    <div className="flex flex-none gap-[var(--space-xl)] min-w-max pr-[var(--space-xl)]">
      {safeItems.map((p) => {
        if (!p.href) {
          return (
            <span key={p.id} className="text-[var(--text)]">
              {p.text}
            </span>
          );
        }

        if (p.href.startsWith("/")) {
          return (
            <Link key={p.id} to={p.href} className="text-[var(--text)] hover:text-[var(--accent)]">
              {p.text}
            </Link>
          );
        }

        return (
          <a key={p.id} href={p.href} className="text-[var(--text)] hover:text-[var(--accent)]">
            {p.text}
          </a>
        );
      })}
    </div>
  );

  const tickerStyle: CSSProperties & Record<string, string> = {
    height,
    "--ticker-entry-duration": `${entryDurationSec}s`,
    "--ticker-speed": `${speedSec}s`,
  };

  return (
    <div
      className={`ticker relative overflow-hidden border-b border-[var(--border)] bg-[color-mix(in oklab,var(--surface) 85%, transparent)] ${className}`}
      style={tickerStyle}
      aria-label="Promotions"
    >
      <div className="ticker__inner" aria-hidden="true">
        <div className="ticker__track flex items-center will-change-transform">
          {row}
          {row}
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {safeItems.map((p) => (
          <span key={p.id}>{p.text}</span>
        ))}
      </div>
      <button
        onClick={dismiss}
        className="absolute right-[var(--space-md)] top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-[var(--space-xs)]"
        aria-label="Dismiss promotions"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
