export type Promo = {
  id: string;
  text: string;        // short ticker text
  href?: string;       // optional link
  startAt?: string;    // ISO
  endAt?: string;      // ISO
  priority?: number;   // higher = earlier in ticker
  disclosure?: string; // for BNPL etc.
  channels?: ("ticker" | "homepage" | "pdp")[];
};

export function getActivePromos(now = new Date()): Promo[] {
  const promos: Promo[] = [
    { id: "fall20", text: "🔥 Fall Sale: 20% off", href: "/products?cat=title=1&promo=fall10", startAt: "2025-09-15T00:00:00Z", endAt: "2025-11-30T23:59:59Z", priority: 100, channels: ["ticker","homepage"] },
    { id: "b3g1",   text: "⭐ Buy 3, Get 1 Free on select items", href: "/products?cat=title-2&promo=b3g1", startAt: "2025-10-01T00:00:00Z", endAt: "2025-10-31T23:59:59Z", priority: 90, channels: ["ticker"] },
    { id: "ship499",text: "🚚 Free shipping over $99", href: "/shipping", priority: 50, channels: ["ticker","homepage"] },
    // Example BNPL disclosure placeholder:
    // { id:"klarna", text:"Pay over time with Klarna", href:"/financing", disclosure:"Subject to approval. Terms apply.", channels:["ticker"] }
  ];
  return promos
    .filter(p => (!p.startAt || now >= new Date(p.startAt)) && (!p.endAt || now <= new Date(p.endAt)))
    .sort((a,b) => (b.priority ?? 0) - (a.priority ?? 0));
}
