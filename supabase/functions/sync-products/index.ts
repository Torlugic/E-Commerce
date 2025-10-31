//supabase>functions>sync-products>index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProductRow {
  partNumber: string;
  name: string;
  performanceCategory: string;
  brand: string;
  model: string;
  size: string;
  isWinter: boolean;
  isRunFlat: boolean;
  isTire: boolean;
  isWheel: boolean;
  cost: string;
  msrp: string;
  inventory: Array<{ location: string; quantity: number }>;
}

interface TireDimensions {
  width: number | null;
  aspectRatio: number | null;
  rimSize: number | null;
}

function parseTireSize(size: string): TireDimensions {
  const match = size.match(/(\d+)\/(\d+)R(\d+)/);
  if (!match) {
    return { width: null, aspectRatio: null, rimSize: null };
  }
  return {
    width: parseInt(match[1]),
    aspectRatio: parseInt(match[2]),
    rimSize: parseInt(match[3]),
  };
}

function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const dollars = parseFloat(cleaned);
  return Math.round(dollars * 100);
}

function calculateTargetSellPrice(wholesalePrice: number, msrpPrice: number): number {
  const markup = 1.35;
  const calculatedPrice = Math.round(wholesalePrice * markup);
  const minPrice = Math.round(msrpPrice * 0.95);
  const maxPrice = Math.round(msrpPrice * 1.15);
  
  if (calculatedPrice < minPrice) return minPrice;
  if (calculatedPrice > maxPrice) return maxPrice;
  return calculatedPrice;
}

function determineSeasonType(isWinter: boolean, performanceCategory: string): string {
  if (isWinter) return "winter";
  
  const category = performanceCategory.toLowerCase();
  if (category.includes("all-season") || category.includes("all season")) {
    return "all-season";
  }
  if (category.includes("summer") || category.includes("performance")) {
    return "summer";
  }
  
  return "all-season";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: logData, error: logError } = await supabase
      .from("sync_logs")
      .insert({
        sync_type: "full",
        status: "started",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    }

    const logId = logData?.id;

    const distributorUrl = `${supabaseUrl}/functions/v1/distributor`;
    const distributorResponse = await fetch(distributorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        vendor: "canadaTire",
        action: "searchProducts",
        payload: {
          filters: {
            isTire: true,
          },
        },
      }),
    });

    if (!distributorResponse.ok) {
      const errorText = await distributorResponse.text();
      throw new Error(`Distributor API failed: ${distributorResponse.status} - ${errorText}`);
    }

    const distributorData = await distributorResponse.json();

    if (!distributorData.success || !distributorData.data) {
      throw new Error(`Distributor API error: ${distributorData.error?.errorMsg || "Unknown error"}`);
    }

    const products: ProductRow[] = distributorData.data;

    const { data: categories } = await supabase
      .from("categories")
      .select("id, slug");

    const categoryMap = new Map(
      categories?.map((c) => [c.slug, c.id]) || []
    );

    let productsAdded = 0;
    let productsUpdated = 0;

    for (const product of products) {
      const dimensions = parseTireSize(product.size);
      const wholesalePrice = parsePrice(product.cost);
      const msrpPrice = parsePrice(product.msrp);
      const targetSellPrice = calculateTargetSellPrice(wholesalePrice, msrpPrice);
      const seasonType = determineSeasonType(product.isWinter, product.performanceCategory);
      const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);

      let categoryId = null;
      if (seasonType === "winter") {
        categoryId = categoryMap.get("winter-tires");
      } else if (seasonType === "summer") {
        categoryId = categoryMap.get("summer-tires");
      } else {
        categoryId = categoryMap.get("all-season-tires");
      }

      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("part_number", product.partNumber)
        .maybeSingle();

      const productData = {
        part_number: product.partNumber,
        title: product.name,
        description: `${product.brand} ${product.model} - ${product.performanceCategory}`,
        brand: product.brand,
        category_id: categoryId,
        tire_width: dimensions.width,
        aspect_ratio: dimensions.aspectRatio,
        rim_size: dimensions.rimSize,
        tire_size: product.size,
        season_type: seasonType,
        wholesale_price: wholesalePrice,
        target_sell_price: targetSellPrice,
        currency: "CAD",
        stock_quantity: totalStock,
        is_active: totalStock > 0,
        metadata: {
          model: product.model,
          performanceCategory: product.performanceCategory,
          isRunFlat: product.isRunFlat,
          inventory: product.inventory,
        },
        last_synced_at: new Date().toISOString(),
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", existing.id);

        if (updateError) {
          console.error(`Failed to update product ${product.partNumber}:`, updateError);
        } else {
          productsUpdated++;
        }
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(productData);

        if (insertError) {
          console.error(`Failed to insert product ${product.partNumber}:`, insertError);
        } else {
          productsAdded++;
        }
      }
    }

    if (logId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "completed",
          products_synced: products.length,
          products_added: productsAdded,
          products_updated: productsUpdated,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          productsProcessed: products.length,
          productsAdded,
          productsUpdated,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Sync failed",
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
