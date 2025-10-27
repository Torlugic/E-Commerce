import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

serve(async (req) => {
  try {
    // Accept filters object for flexible product search
    const { filters } = await req.json();

    // Base URL - use -sb1 suffix for sandbox, remove it for production
    const baseUrl = "https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl";
    const script = "customscript_item_search_rl";
    const deploy = "customdeploy_item_search_rl";

    // Build OAuth 1.0 signature for Canada Tire
    const nonce = globalThis.crypto.randomUUID().replace(/-/g, "");
    const timestamp = Math.floor(Date.now() / 1000);

    // All parameters that need to be signed (OAuth params + query params)
    const allParams: Record<string, string> = {
      deploy,
      script,
      oauth_consumer_key: Deno.env.get("CANADA_TIRE_CONSUMER_KEY")!,
      oauth_token: Deno.env.get("CANADA_TIRE_TOKEN_ID")!,
      oauth_signature_method: "HMAC-SHA256",
      oauth_timestamp: timestamp.toString(),
      oauth_nonce: nonce,
      oauth_version: "1.0",
    };

    // Create OAuth 1.0 signature base string: METHOD&URL&PARAMS
    const paramString = Object.keys(allParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
      .join("&");

    const signatureBaseString = `POST&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

    // Generate HMAC-SHA256 signature
    // Note: The signing key is NOT URL-encoded per OAuth 1.0 spec
    const signingKey =
      `${Deno.env.get("CANADA_TIRE_CONSUMER_SECRET")!}&${Deno.env.get("CANADA_TIRE_TOKEN_SECRET")!}`;

    const encoder = new TextEncoder();
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "raw",
      encoder.encode(signingKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await globalThis.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(signatureBaseString)
    );

    const signature = base64Encode(signatureBytes);

    // Build OAuth header (only OAuth params, not query params)
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: allParams.oauth_consumer_key,
      oauth_token: allParams.oauth_token,
      oauth_signature_method: allParams.oauth_signature_method,
      oauth_timestamp: allParams.oauth_timestamp,
      oauth_nonce: allParams.oauth_nonce,
      oauth_version: allParams.oauth_version,
      oauth_signature: signature,
    };

    const oauthHeader =
      "OAuth " + Object.entries(oauthParams).map(([k, v]) => `${k}="${v}"`).join(", ");

    // Make the API request
    const url = `${baseUrl}?script=${script}&deploy=${deploy}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: Deno.env.get("CANADA_TIRE_CUSTOMER_ID"),
        customerToken: Deno.env.get("CANADA_TIRE_CUSTOMER_TOKEN"),
        filters: filters || {},
      }),
    });

    const data = await response.json();
    console.log("Canada Tire API response:", data);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error calling Canada Tire API:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
