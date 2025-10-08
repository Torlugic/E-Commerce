export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-[var(--font-heading)] font-bold">Page not found</h1>
      <p className="mt-[var(--space-sm)] text-[var(--text-muted)]">
        The page you’re looking for doesn’t exist.
      </p>
      <a href="/" className="btn-primary inline-block mt-[var(--space-lg)] px-5 py-2">
        Go Home
      </a>
    </div>
  );
}
