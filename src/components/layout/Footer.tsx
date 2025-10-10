import { Link } from "react-router-dom";
import { brand } from "../../config/brand";

export default function Footer() {
  const { privacy, terms, contact } = brand.links;
  const privacyIsInternal = privacy?.startsWith("/");
  const termsIsInternal = terms?.startsWith("/");
  const contactIsInternal = contact?.startsWith("/");

  return (
    <footer className="h-[var(--footer-height)] bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] text-sm px-[var(--space-lg)]">
      <div className="w-full max-w-[var(--container-max)] flex items-center justify-between">
        <p>&copy; {new Date().getFullYear()} {brand.company.legalName}</p>
        <div className="flex gap-[var(--space-md)]">
          {privacy && (
            privacyIsInternal ? (
              <Link to={privacy} className="hover:text-[var(--accent)]">Privacy</Link>
            ) : (
              <a href={privacy} className="hover:text-[var(--accent)]">Privacy</a>
            )
          )}
          {terms && (
            termsIsInternal ? (
              <Link to={terms} className="hover:text-[var(--accent)]">Terms</Link>
            ) : (
              <a href={terms} className="hover:text-[var(--accent)]">Terms</a>
            )
          )}
          {contact && (
            contactIsInternal ? (
              <Link to={contact} className="hover:text-[var(--accent)]">Contact</Link>
            ) : (
              <a href={contact} className="hover:text-[var(--accent)]">Contact</a>
            )
          )}
        </div>
      </div>
    </footer>
  );
}
