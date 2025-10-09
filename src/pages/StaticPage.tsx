import type { ReactNode } from "react";

export type Section = {
  heading: string;
  body: ReactNode;
};

type Props = {
  title: string;
  intro?: ReactNode;
  sections?: Section[];
};

export default function StaticPage({ title, intro, sections = [] }: Props) {
  return (
    <div className="max-w-[var(--container-max)] mx-auto space-y-[var(--space-xl)]">
      <header className="space-y-[var(--space-xs)]">
        <h1 className="text-4xl font-[var(--font-heading)] font-semibold">{title}</h1>
        {intro && <div className="text-[var(--text-muted)] text-lg">{intro}</div>}
      </header>
      <div className="space-y-[var(--space-lg)]">
        {sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-lg)] space-y-[var(--space-sm)]"
          >
            <h2 className="text-2xl font-[var(--font-heading)] font-semibold">{section.heading}</h2>
            <div className="text-[var(--text-muted)] leading-relaxed space-y-[var(--space-sm)]">{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
