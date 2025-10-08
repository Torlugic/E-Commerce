import StaticPage, { type Section } from "./StaticPage";

const sections: Section[] = [
  {
    heading: "Agreement to terms",
    body: (
      <p>
        By accessing our website you agree to abide by these terms and all applicable laws. If you disagree with any part of the
        terms, you may not access the site.
      </p>
    ),
  },
  {
    heading: "Products and pricing",
    body: (
      <p>
        We work to ensure accuracy but reserve the right to correct pricing errors and update availability without prior notice.
        Taxes and shipping are calculated at checkout based on your location.
      </p>
    ),
  },
  {
    heading: "Limitation of liability",
    body: (
      <p>
        E-Commerce and its suppliers are not liable for indirect or consequential damages arising from the use of this site.
        Some jurisdictions do not allow limitations, so these limitations may not apply to you.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <StaticPage
      title="Terms & conditions"
      intro="Review the legal terms that govern use of our website and services."
      sections={sections}
    />
  );
}
