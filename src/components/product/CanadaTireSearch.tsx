import { useState } from 'react';
import { searchProducts, type CanadaTireProductFilters, type CanadaTireProduct } from '../../services/canadaTire';
import toast from 'react-hot-toast';

export default function CanadaTireSearch() {
  const [filters, setFilters] = useState<CanadaTireProductFilters>({
    isTire: true,
  });
  const [products, setProducts] = useState<CanadaTireProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchProducts(filters);
      setProducts(results);
      toast.success(`Found ${results.length} products`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search products';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CanadaTireProductFilters, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({ isTire: true });
    setProducts([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-6 border border-[var(--border)]">
        <h2 className="text-2xl font-bold mb-6">Canada Tire Product Search</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Brand</label>
            <input
              type="text"
              value={filters.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              placeholder="e.g., PIRELLI"
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Width</label>
            <input
              type="number"
              value={filters.width || ''}
              onChange={(e) => handleFilterChange('width', e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g., 225"
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rim Size</label>
            <input
              type="number"
              value={filters.rimSize || ''}
              onChange={(e) => handleFilterChange('rimSize', e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g., 17"
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <input
              type="number"
              value={filters.aspectRatio || ''}
              onChange={(e) => handleFilterChange('aspectRatio', e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g., 45"
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <input
              type="text"
              value={filters.size || ''}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              placeholder="e.g., 225/45R17"
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Search Key</label>
            <input
              type="text"
              value={filters.searchKey || ''}
              onChange={(e) => handleFilterChange('searchKey', e.target.value)}
              placeholder="Search term"
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.isWinter || false}
              onChange={(e) => handleFilterChange('isWinter', e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm">Winter</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.isRunFlat || false}
              onChange={(e) => handleFilterChange('isRunFlat', e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm">Run Flat</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.isTire !== undefined ? filters.isTire : true}
              onChange={(e) => handleFilterChange('isTire', e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm">Tire</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.isWheel || false}
              onChange={(e) => handleFilterChange('isWheel', e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm">Wheel</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={clearFilters}
            disabled={loading}
            className="px-6 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] hover:bg-[var(--bg)]"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-md)] p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-6 border border-[var(--border)]">
          <h3 className="text-xl font-bold mb-4">Results ({products.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4">Part Number</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Brand</th>
                  <th className="text-left py-3 px-4">Size</th>
                  <th className="text-right py-3 px-4">Cost</th>
                  <th className="text-right py-3 px-4">MSRP</th>
                  <th className="text-left py-3 px-4">Type</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                    <td className="py-3 px-4 font-mono text-xs">{product.partNumber}</td>
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4">{product.brand}</td>
                    <td className="py-3 px-4">{product.size}</td>
                    <td className="py-3 px-4 text-right">${product.cost}</td>
                    <td className="py-3 px-4 text-right">${product.msrp}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {product.isTire && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Tire</span>}
                        {product.isWheel && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Wheel</span>}
                        {product.isWinter && <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded">Winter</span>}
                        {product.isRunFlat && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Run Flat</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-6 border border-[var(--border)] text-center text-[var(--text-muted)]">
          <p>No products found. Try searching with different filters.</p>
        </div>
      )}
    </div>
  );
}
