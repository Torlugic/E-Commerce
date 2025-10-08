import StaticPage, { type Section } from "./StaticPage";

const sections: Section[] = [
  {
    heading: "Delivery options",
    body: (
      <ul className="list-disc pl-6 space-y-[var(--space-xs)]">
        <li>Standard ground shipping (3-5 business days) via national carriers.</li>
        <li>Expedited 2-day delivery available in major Canadian cities.</li>
        <li>Free in-store pickup for local customers within 24 hours.</li>
      </ul>
    ),
  },
  {
    heading: "Order processing",
    body: (
      <p>
        Orders placed before 3 p.m. Atlantic Time ship the same business day. Tracking details are emailed as soon as your
        package leaves our warehouse.
      </p>
    ),
  },
  {
    heading: "Shipping rates",
    body: (
      <p>
        Shipping is calculated at checkout based on destination, weight, and delivery speed. Orders over $99 automatically qualify
        for free ground shipping across Canada.
      </p>
    ),
  },
];

export default function ShippingPage() {
  return (
    <StaticPage
      title="Shipping information"
      intro="Learn how we fulfill and deliver your orders across Canada."
      sections={sections}
    />
  );
}
