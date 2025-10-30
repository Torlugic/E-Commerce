import { useState, useEffect } from 'react';
import type { ProductFilters } from '../../services/catalog';
import { fetchBrands, fetchTireSizes } from '../../services/catalog';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
}

export default function ProductFilters({ filters, onFiltersChange, onClearFilters }: ProductFiltersProps) {
  const [brands, setBrands] = useState<string[]>([]);
  const [tireSizes, setTireSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [brandsData, sizesData] = await Promise.all([
          fetchBrands(),
          fetchTireSizes(),
        ]);
        setBrands(brandsData);
        setTireSizes(sizesData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  if (loading) {
    return (
      <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-[var(--space-md)] border border-[var(--border)]">
        <p className="text-[var(--text-muted)] text-sm">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-[var(--space-md)] border border-[var(--border)] space-y-[var(--space-md)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm text-[var(--link)] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-[var(--space-sm)]">
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)] mb-1 block">Search</span>
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Search by name or part number..."
            className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </label>
      </div>

      <div className="space-y-[var(--space-sm)]">
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)] mb-1 block">Season Type</span>
          <select
            value={filters.seasonType || ''}
            onChange={(e) => handleFilterChange('seasonType', e.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All Seasons</option>
            <option value="winter">Winter</option>
            <option value="summer">Summer</option>
            <option value="all-season">All-Season</option>
          </select>
        </label>
      </div>

      {brands.length > 0 && (
        <div className="space-y-[var(--space-sm)]">
          <label className="block">
            <span className="text-sm font-medium text-[var(--text)] mb-1 block">Brand</span>
            <select
              value={filters.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {tireSizes.length > 0 && (
        <div className="space-y-[var(--space-sm)]">
          <label className="block">
            <span className="text-sm font-medium text-[var(--text)] mb-1 block">Tire Size</span>
            <select
              value={filters.tireSize || ''}
              onChange={(e) => handleFilterChange('tireSize', e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">All Sizes</option>
              {tireSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
