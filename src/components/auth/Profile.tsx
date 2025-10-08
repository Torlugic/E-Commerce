import React from "react";
import { useThemeCtx } from "../layout/ThemeProvider";
// dummy placeholder — in real app you'd fetch the current user
export default function Profile() {
  const { mode, toggle } = useThemeCtx();
  return (
    <div className="max-w-md mx-auto mt-[var(--space-2xl)] space-y-[var(--space-lg)]">
      <h2 className="text-2xl font-[var(--font-heading)] font-semibold">Profile</h2>
      <p>Logged in as: user@example.com</p>
      <button onClick={toggle} className="btn-primary">
        Toggle Theme (now {mode})
      </button>
      {/* Later: show address book, orders, settings */}
    </div>
  );
}
