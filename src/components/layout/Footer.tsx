import { brand } from "../../config/brand";

export default function Footer() {
  return (
    <footer className="h-[var(--footer-height)] bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] text-sm px-[var(--space-lg)]">
      <div className="w-full max-w-[var(--container-max)] flex items-center justify-between">
        <p>&copy; {new Date().getFullYear()} {brand.company.legalName}</p>
        <div className="flex gap-[var(--space-md)]">
          {brand.links.privacy && <a href={brand.links.privacy} className="hover:text-[var(--accent)]">Privacy</a>}
          {brand.links.terms && <a href={brand.links.terms} className="hover:text-[var(--accent)]">Terms</a>}
          {brand.links.contact && <a href={brand.links.contact} className="hover:text-[var(--accent)]">Contact</a>}
        </div>
      </div>
    </footer>
  );
}
