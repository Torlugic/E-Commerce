import { usePromoVisibility } from "../../hooks/usePromoVisibility"
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

  // prepare the row (duplicated) as before
  const row = (
    <div className="flex flex-none gap-[var(--space-xl)] min-w-max pr-[var(--space-xl)]">
      {safeItems.map((p) =>
        p.href ? (
          <a key={p.id} href={p.href} className="text-[var(--text)] hover:text-[var(--accent)]">
            {p.text}
          </a>
        ) : (
          <span key={p.id} className="text-[var(--text)]">{p.text}</span>
        )
      )}
    </div>
  );

  return (
    <div
      className={`ticker relative overflow-hidden border-b border-[var(--border)] bg-[color-mix(in oklab,var(--surface) 85%, transparent)] ${className}`}
      style={{ height, animationDuration: `${speedSec}s` }}
      aria-label="Promotions"
    >
      <div className="ticker__track flex items-right will-change-transform" style={{ animationDuration: `${speedSec}s` }}>
        {row}
        {row}
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
