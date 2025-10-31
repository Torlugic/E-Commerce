import CanadaTireSearch from '../components/product/CanadaTireSearch';

export default function CanadaTirePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Canada Tire Integration</h1>
        <p className="text-[var(--text-muted)]">
          Test the Canada Tire API integration by searching for products using the form below.
        </p>
      </div>
      <CanadaTireSearch />
    </div>
  );
}
