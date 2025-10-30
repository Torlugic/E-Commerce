import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          part_number: string;
          title: string;
          description: string;
          brand: string;
          category_id: string | null;
          tire_width: number | null;
          aspect_ratio: number | null;
          rim_size: number | null;
          tire_size: string | null;
          season_type: 'winter' | 'summer' | 'all-season';
          load_index: string | null;
          speed_rating: string | null;
          wholesale_price: number;
          target_sell_price: number;
          currency: string;
          image_url: string | null;
          stock_quantity: number;
          low_stock_threshold: number;
          is_active: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
    };
  };
}
