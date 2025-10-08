export type Palette = {
    bg: string;        // Page background color
    surface: string;   // cards, header/footer
    text: string;      // primary text color
    textMuted: string; // secondary text color
    primary: string;   // Brand Color
    primaryFg: string; // Brand Color - text on primary
    accent: string;    // Accent/CTA Color
    border: string;    // Border color
};

export const lightPalette: Palette = {
    bg:        "#0b0d12", // <-- Swap Later
    surface:   "#0f172a",
    text:      "#e5e7eb",
    textMuted: "#9ca3af",
    primary:   "#10b981",
    primaryFg: "#052e2b",
    accent:    "#3b82f6",
    border:    "#1f2937",
};

export const darkPalette: Palette = {
    bg:        "#0a0a0a",
    surface:   "#111827",
    text:      "#e5e7eb",
    textMuted: "#9ca3af",
    primary:   "#22d3ee",
    primaryFg: "#06252a",
    accent:    "#a78bfa",
    border:    "#23272f",
};
