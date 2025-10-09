import { useEffect, useMemo, useState, useCallback } from "react";

type PromoItem = { id: string | number; text: string; href?: string };

type Stored = {
  visible: boolean;
  hash: string;      // promo content hash at time of store
  expiresAt?: number; // ms epoch
};

function computeHash(items: PromoItem[]) {
  // Stable-ish hash: id|text string; cryptographic hash not needed here
  const key = items.map(i => `${i.id}|${i.text}`).join("||");
  // simple djb2
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h) + key.charCodeAt(i);
  return String(h >>> 0); // unsigned
}

export function usePromoVisibility(
  items: PromoItem[],
  storageKey: string,
  ttlMs?: number // e.g. 24*60*60*1000 for 24h
) {
  const currentHash = useMemo(() => computeHash(items), [items]);
  const [visible, setVisible] = useState<boolean>(true);

  // read from storage once
  useEffect(() => {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      setVisible(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setVisible(true);
        return;
      }
      const parsed: Stored = JSON.parse(raw);
      const now = Date.now();

      // If content changed → reset to visible
      if (parsed.hash !== currentHash) {
        setVisible(true);
        return;
      }

      // If expired → reset to visible
      if (parsed.expiresAt && parsed.expiresAt <= now) {
        setVisible(true);
        return;
      }

      // Otherwise honor stored visibility
      setVisible(parsed.visible);
    } catch (error) {
      console.warn("Failed to restore promo dismissal state", error);
      setVisible(true);
    }
  }, [storageKey, currentHash]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return;
    }

    try {
      const rec: Stored = {
        visible: false,
        hash: currentHash,
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(rec));
    } catch (error) {
      console.warn("Failed to persist promo dismissal", error);
    }
  }, [storageKey, currentHash, ttlMs]);

  const reset = useCallback(() => {
    setVisible(true);
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return;
    }

    try {
      const rec: Stored = { visible: true, hash: currentHash };
      window.localStorage.setItem(storageKey, JSON.stringify(rec));
    } catch (error) {
      console.warn("Failed to reset promo dismissal", error);
    }
  }, [storageKey, currentHash]);

  return { visible, dismiss, reset };
}
