import StaticPage, { type Section } from "./StaticPage";

const sections: Section[] = [
  {
    heading: "Personal information we collect",
    body: (
      <p>
        We collect contact details, shipping addresses, payment details, and browsing activity to fulfill orders and improve the
        shopping experience. Sensitive payment data is handled by certified payment providers.
      </p>
    ),
  },
  {
    heading: "How we use your data",
    body: (
      <ul className="list-disc pl-6 space-y-[var(--space-xs)]">
        <li>To process transactions and provide customer support.</li>
        <li>To personalize merchandising and marketing communications.</li>
        <li>To maintain security and prevent fraudulent activity.</li>
      </ul>
    ),
  },
  {
    heading: "Your choices",
    body: (
      <p>
        You can update preferences or request data deletion anytime by contacting our support team at privacy@example.com.
        Marketing emails include an unsubscribe link in every message.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <StaticPage
      title="Privacy policy"
      intro="We respect your privacy and explain how your information is handled."
      sections={sections}
    />
  );
}
