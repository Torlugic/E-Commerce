import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useThemeContext } from "../../hooks/useThemeContext";

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const { mode, toggle } = useThemeContext();

  const joined = useMemo(() => {
    if (!user?.createdAt) return null;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(user.createdAt));
  }, [user?.createdAt]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-[var(--space-2xl)] space-y-[var(--space-md)]">
        <h2 className="text-2xl font-[var(--font-heading)] font-semibold">Profile</h2>
        <p className="text-[var(--text-muted)]">
          You need to sign in to view your profile.
        </p>
        <Link to="/login" className="btn-primary inline-flex justify-center px-4 py-2">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-[var(--space-2xl)] space-y-[var(--space-lg)]">
      <header>
        <h2 className="text-3xl font-[var(--font-heading)] font-semibold">Welcome back, {user.name ?? user.email}</h2>
        {joined && <p className="text-[var(--text-muted)]">Member since {joined}</p>}
      </header>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-lg)] space-y-[var(--space-sm)]">
        <div className="flex flex-col gap-[var(--space-xs)]">
          <span className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Email</span>
          <span className="text-lg font-medium">{user.email}</span>
        </div>
        {user.name && (
          <div className="flex flex-col gap-[var(--space-xs)]">
            <span className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Name</span>
            <span className="text-lg font-medium">{user.name}</span>
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-[var(--space-md)]">
        <button
          type="button"
          className="btn-primary px-4 py-2"
          onClick={toggle}
        >
          Toggle Theme (now {mode})
        </button>
        <button
          type="button"
          onClick={() => logout()}
          className="border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 hover:bg-[var(--surface)]"
          disabled={loading}
        >
          {loading ? "Signing out..." : "Sign out"}
        </button>
      </section>
    </div>
  );
}
