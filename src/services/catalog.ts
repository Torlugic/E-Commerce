import type { Product, ProductVariant } from "../models/types";
import { supabase } from "../lib/supabase";

export interface ProductFilters {
  brand?: string;
  seasonType?: 'winter' | 'summer' | 'all-season';
  tireWidth?: number;
  aspectRatio?: number;
  rimSize?: number;
  tireSize?: string;
  searchTerm?: string;
}

type FetchProductsOptions = {
  signal?: AbortSignal;
  filters?: ProductFilters;
  limit?: number;
  offset?: number;
};

type FetchProductOptions = {
  signal?: AbortSignal;
};

function transformDbProductToProduct(dbProduct: {
  id: string;
  part_number: string;
  title: string;
  description: string;
  brand: string;
  tire_size: string | null;
  season_type: string;
  target_sell_price: number;
  currency: string;
  image_url: string | null;
  stock_quantity: number;
}): Product {
  const defaultImage = 'https://images.pexels.com/photos/13861/IMG_3496bfree.jpg?auto=compress&cs=tinysrgb&w=800';

  const variant: ProductVariant = {
    id: `${dbProduct.id}-default`,
    sku: dbProduct.part_number,
    title: 'Standard',
    price: {
      amount: dbProduct.target_sell_price,
      currency: dbProduct.currency,
    },
    image: dbProduct.image_url || defaultImage,
    stock: dbProduct.stock_quantity,
    attributes: {
      size: dbProduct.tire_size || '',
      season: dbProduct.season_type,
    },
  };

  const slug = dbProduct.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    id: dbProduct.id,
    title: dbProduct.title,
    description: dbProduct.description,
    images: [dbProduct.image_url || defaultImage],
    variants: [variant],
    slug,
    tags: [dbProduct.brand, dbProduct.season_type],
    categories: [dbProduct.season_type],
  };
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('id, part_number, title, description, brand, tire_size, season_type, target_sell_price, currency, image_url, stock_quantity, tire_width, aspect_ratio, rim_size')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (options.filters) {
      const { brand, seasonType, tireWidth, aspectRatio, rimSize, tireSize, searchTerm } = options.filters;

      if (brand) {
        query = query.eq('brand', brand);
      }

      if (seasonType) {
        query = query.eq('season_type', seasonType);
      }

      if (tireWidth) {
        query = query.eq('tire_width', tireWidth);
      }

      if (aspectRatio) {
        query = query.eq('aspect_ratio', aspectRatio);
      }

      if (rimSize) {
        query = query.eq('rim_size', rimSize);
      }

      if (tireSize) {
        query = query.eq('tire_size', tireSize);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
      }
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformDbProductToProduct);
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    throw error;
  }
}

export async function fetchProductById(
  id: string,
  _options: FetchProductOptions = {}
): Promise<Product | undefined> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return undefined;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, part_number, title, description, brand, tire_size, season_type, target_sell_price, currency, image_url, stock_quantity')
      .eq('id', trimmedId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      return undefined;
    }

    if (!data) {
      return undefined;
    }

    return transformDbProductToProduct(data);
  } catch (error) {
    console.error('Error in fetchProductById:', error);
    return undefined;
  }
}

export async function fetchBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .eq('is_active', true)
      .order('brand', { ascending: true });

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    const uniqueBrands = [...new Set(data.map((p) => p.brand))];
    return uniqueBrands;
  } catch (error) {
    console.error('Error in fetchBrands:', error);
    return [];
  }
}

export async function fetchTireSizes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('tire_size')
      .eq('is_active', true)
      .not('tire_size', 'is', null)
      .order('tire_size', { ascending: true });

    if (error) {
      console.error('Error fetching tire sizes:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    const uniqueSizes = [...new Set(data.map((p) => p.tire_size).filter((s): s is string => s !== null))];
    return uniqueSizes;
  } catch (error) {
    console.error('Error in fetchTireSizes:', error);
    return [];
  }
}
