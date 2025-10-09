import StaticPage, { type Section } from "./StaticPage";

const sections: Section[] = [
  {
    heading: "Customer support",
    body: (
      <p>
        Reach our support specialists at <a href="mailto:support@example.com" className="text-[var(--accent)]">support@example.com</a>
        or call +1 (506) 555-0123 Monday through Friday, 9 a.m. – 6 p.m. Atlantic Time.
      </p>
    ),
  },
  {
    heading: "Wholesale inquiries",
    body: (
      <p>
        Interested in stocking our catalogue in your store? Email <a href="mailto:wholesale@example.com" className="text-[var(--accent)]">wholesale@example.com</a>
        with your business details and we'll connect you with an account manager.
      </p>
    ),
  },
  {
    heading: "Visit us",
    body: (
      <p>
        Our showroom is located at 123 Main Street, Moncton, NB. Book an appointment to get personalized recommendations from our
        product experts.
      </p>
    ),
  },
];

export default function ContactPage() {
  return (
    <StaticPage
      title="Contact us"
      intro="We're here to help with orders, product advice, and partnership opportunities."
      sections={sections}
    />
  );
}
