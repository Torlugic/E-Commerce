/*
  # Create Products and Tire Catalog Schema

  ## Overview
  This migration creates the complete database schema for storing tire products 
  from Canada Tire with retail pricing for the client's e-commerce storefront.

  ## New Tables

  ### 1. `categories`
  Product categories for organizing tires by season type.
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text, unique) - Category name (e.g., "Winter Tires", "Summer Tires")
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `products`
  Main product information for tires with specifications and pricing.
  - `id` (uuid, primary key) - Unique product identifier
  - `part_number` (text, unique) - Canada Tire part number
  - `title` (text) - Product display name
  - `description` (text) - Product description
  - `brand` (text) - Tire brand (e.g., "Michelin", "Goodyear")
  - `category_id` (uuid, foreign key) - Links to categories table
  - `tire_width` (integer) - Tire width in millimeters (e.g., 225)
  - `aspect_ratio` (integer) - Aspect ratio percentage (e.g., 45)
  - `rim_size` (integer) - Rim diameter in inches (e.g., 17)
  - `tire_size` (text) - Full tire size format (e.g., "225/45R17")
  - `season_type` (text) - Season category: "winter", "summer", "all-season"
  - `load_index` (text) - Tire load index
  - `speed_rating` (text) - Speed rating code
  - `wholesale_price` (integer) - Canada Tire price in cents (NOT displayed)
  - `target_sell_price` (integer) - Client retail price in cents
  - `currency` (text) - Price currency code (default: "CAD")
  - `image_url` (text) - Product image URL
  - `stock_quantity` (integer) - Available stock count (default: 0)
  - `low_stock_threshold` (integer) - Threshold for low stock alerts (default: 5)
  - `is_active` (boolean) - Whether product is visible (default: true)
  - `metadata` (jsonb) - Additional product data from Canada Tire API
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `last_synced_at` (timestamptz) - Last sync from Canada Tire API

  ### 3. `product_variants`
  Different SKUs and options for products (for future expansion).
  - `id` (uuid, primary key) - Unique variant identifier
  - `product_id` (uuid, foreign key) - Links to products table
  - `sku` (text, unique) - Stock keeping unit
  - `title` (text) - Variant name
  - `price` (integer) - Variant price in cents
  - `currency` (text) - Price currency (default: "CAD")
  - `stock_quantity` (integer) - Variant stock (default: 0)
  - `is_active` (boolean) - Whether variant is available (default: true)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `sync_logs`
  Logging table for tracking Canada Tire API synchronization.
  - `id` (uuid, primary key) - Unique log identifier
  - `sync_type` (text) - Type of sync: "full", "incremental", "low_stock"
  - `status` (text) - Sync status: "started", "completed", "failed"
  - `products_synced` (integer) - Number of products processed
  - `products_added` (integer) - Number of new products
  - `products_updated` (integer) - Number of updated products
  - `error_message` (text) - Error details if sync failed
  - `started_at` (timestamptz) - Sync start time
  - `completed_at` (timestamptz) - Sync completion time
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public read access for categories, products, and product_variants
  - Admin-only write access (will be configured with future admin system)
  - Sync logs are admin-only access

  ## Indexes
  - Index on products.part_number for fast lookups
  - Index on products.brand for filtering
  - Index on products.season_type for filtering
  - Index on products.tire_size for searching
  - Index on products.is_active for filtering visible products
  - Index on products.stock_quantity for low stock queries
  - Composite index on tire dimensions for size search
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  brand text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  tire_width integer,
  aspect_ratio integer,
  rim_size integer,
  tire_size text,
  season_type text NOT NULL CHECK (season_type IN ('winter', 'summer', 'all-season')),
  load_index text,
  speed_rating text,
  wholesale_price integer NOT NULL DEFAULT 0,
  target_sell_price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  image_url text,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_synced_at timestamptz
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text UNIQUE NOT NULL,
  title text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'low_stock')),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  products_synced integer DEFAULT 0,
  products_added integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_part_number ON products(part_number);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_season_type ON products(season_type);
CREATE INDEX IF NOT EXISTS idx_products_tire_size ON products(tire_size);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_tire_dimensions ON products(tire_width, aspect_ratio, rim_size);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access on categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for public read access on active products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS Policies for public read access on active product variants
CREATE POLICY "Anyone can view active product variants"
  ON product_variants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Winter Tires', 'winter-tires', 'High-performance tires designed for winter conditions with superior grip on snow and ice'),
  ('Summer Tires', 'summer-tires', 'Optimized for warm weather performance with excellent handling and braking'),
  ('All-Season Tires', 'all-season-tires', 'Versatile tires suitable for year-round use in moderate climates')
ON CONFLICT (slug) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
