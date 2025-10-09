import StaticPage, { type Section } from "./StaticPage";

const sections: Section[] = [
  {
    heading: "Easy returns",
    body: (
      <p>
        If something isn't right, you have 30 days from delivery to start a return. Items must be unused and in their original
        packaging. Clearance or custom orders are final sale.
      </p>
    ),
  },
  {
    heading: "How to start a return",
    body: (
      <ol className="list-decimal pl-6 space-y-[var(--space-xs)]">
        <li>Log in to your account and open the order you'd like to return.</li>
        <li>Click “Request return” and select the items and reason.</li>
        <li>We'll email a prepaid shipping label once the request is approved.</li>
      </ol>
    ),
  },
  {
    heading: "Refund timing",
    body: (
      <p>
        Refunds are issued to the original payment method within 5 business days after the returned items arrive at our
        warehouse. You'll receive an email confirmation when the refund is processed.
      </p>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <StaticPage
      title="Returns & exchanges"
      intro="Shop confidently knowing you can exchange or return within 30 days."
      sections={sections}
    />
  );
}
