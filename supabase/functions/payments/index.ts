import Stripe from "https://esm.sh/stripe@12?target=deno";
import { AdapterError, assert } from "../_shared/errors.ts";
import { getEnv, getRequiredEnv } from "../_shared/env.ts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const ALLOWED_PAYMENT_METHODS = [
  "card",
  "afterpay_clearpay",
  "klarna",
  "sezzle",
] as const;

type PaymentMethodType = (typeof ALLOWED_PAYMENT_METHODS)[number];

type CaptureMethod = "automatic" | "manual";

interface OrderItemInput {
  sku: string;
  quantity: number;
  unitAmount: number;
  description?: string;
}

interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ShippingInput {
  name: string;
  phone?: string;
  address: ShippingAddressInput;
}

interface CustomerInput {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
}

interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  captureMethod?: CaptureMethod;
  paymentMethodTypes?: PaymentMethodType[];
  metadata?: Record<string, string>;
  receiptEmail?: string;
  statementDescriptorSuffix?: string;
  customer?: CustomerInput;
  shipping?: ShippingInput;
  orderId?: string;
  orderItems?: OrderItemInput[];
  idempotencyKey?: string;
}

const METHOD_CURRENCIES: Record<PaymentMethodType, ReadonlySet<string>> = {
  card: new Set(),
  afterpay_clearpay: new Set(["AUD", "CAD", "NZD", "GBP", "USD"]),
  klarna: new Set(["AUD", "CAD", "DKK", "EUR", "GBP", "NOK", "SEK", "USD"]),
  sezzle: new Set(["CAD", "USD"]),
};

const ASYNC_METHODS: ReadonlySet<PaymentMethodType> = new Set([
  "afterpay_clearpay",
  "klarna",
  "sezzle",
]);

function resolveDefaultPaymentMethods(): PaymentMethodType[] {
  const configured = getEnv("STRIPE_PAYMENT_METHOD_TYPES");
  if (!configured) {
    return [...ALLOWED_PAYMENT_METHODS];
  }

  const methods = configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) as string[];

  const normalized: PaymentMethodType[] = [];
  for (const method of methods) {
    if (!ALLOWED_PAYMENT_METHODS.includes(method as PaymentMethodType)) {
      throw new AdapterError(`Unsupported payment method type configured: ${method}`, {
        status: 500,
      });
    }
    if (!normalized.includes(method as PaymentMethodType)) {
      normalized.push(method as PaymentMethodType);
    }
  }

  if (normalized.length === 0) {
    throw new AdapterError("STRIPE_PAYMENT_METHOD_TYPES must include at least one supported payment method", {
      status: 500,
    });
  }

  return normalized;
}

const DEFAULT_PAYMENT_METHOD_TYPES = resolveDefaultPaymentMethods();

const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCurrency(value: string): string {
  assert(/^[A-Za-z]{3}$/.test(value), "currency must be a 3-letter ISO code");
  return value.toUpperCase();
}

function validateAmount(amount: number): number {
  assert(Number.isInteger(amount), "amount must be an integer representing the smallest currency unit");
  assert(amount >= 100, "amount must be at least 100 (e.g. $1.00)");
  return amount;
}

function sanitizeMetadata(metadata: unknown): Record<string, string> | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  assert(isRecord(metadata), "metadata must be an object", 400);
  const entries: [string, string][] = [];
  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    assert(typeof rawKey === "string" && rawKey.length > 0 && rawKey.length <= 40, "metadata keys must be 1-40 characters", 400);
    assert(
      typeof rawValue === "string" && rawValue.length <= 500,
      "metadata values must be strings up to 500 characters",
      400,
    );
    entries.push([rawKey, rawValue]);
  }
  assert(entries.length <= 50, "metadata must not exceed 50 entries", 400);
  return Object.fromEntries(entries);
}

function sanitizeOrderItems(items: unknown): OrderItemInput[] | undefined {
  if (items === undefined) {
    return undefined;
  }
  assert(Array.isArray(items), "orderItems must be an array", 400);
  const sanitized: OrderItemInput[] = [];
  for (const item of items) {
    assert(isRecord(item), "each order item must be an object", 400);
    const { sku, quantity, unitAmount, description } = item;
    assert(typeof sku === "string" && sku.trim().length > 0, "order item sku must be a non-empty string", 400);
    assert(Number.isInteger(quantity) && quantity > 0 && quantity <= 9999, "order item quantity must be between 1 and 9999", 400);
    assert(
      Number.isInteger(unitAmount) && unitAmount > 0,
      "order item unitAmount must be an integer greater than 0",
      400,
    );
    if (description !== undefined) {
      assert(typeof description === "string" && description.length <= 500, "order item description must be <= 500 characters", 400);
    }
    sanitized.push({ sku, quantity, unitAmount, description: description as string | undefined });
  }
  assert(sanitized.length > 0, "orderItems must include at least one entry", 400);
  return sanitized;
}

function sanitizeShipping(shipping: unknown): ShippingInput | undefined {
  if (shipping === undefined) {
    return undefined;
  }
  assert(isRecord(shipping), "shipping must be an object", 400);
  const { name, phone, address } = shipping;
  assert(typeof name === "string" && name.trim().length > 0, "shipping.name is required", 400);
  if (phone !== undefined) {
    assert(typeof phone === "string" && phone.length <= 30, "shipping.phone must be a string", 400);
  }
  assert(isRecord(address), "shipping.address is required", 400);
  const { line1, line2, city, state, postalCode, country } = address;
  assert(typeof line1 === "string" && line1.trim().length > 0, "shipping.address.line1 is required", 400);
  if (line2 !== undefined) {
    assert(typeof line2 === "string" && line2.length <= 255, "shipping.address.line2 must be a string", 400);
  }
  assert(typeof city === "string" && city.trim().length > 0, "shipping.address.city is required", 400);
  assert(typeof state === "string" && state.trim().length > 0, "shipping.address.state is required", 400);
  assert(/^[A-Za-z0-9- ]{2,15}$/.test(state), "shipping.address.state must be alphanumeric", 400);
  assert(typeof postalCode === "string" && postalCode.trim().length > 0, "shipping.address.postalCode is required", 400);
  assert(/^[A-Za-z0-9 -]{3,20}$/.test(postalCode), "shipping.address.postalCode has an invalid format", 400);
  assert(typeof country === "string" && /^[A-Za-z]{2}$/.test(country), "shipping.address.country must be a 2-letter code", 400);
  return {
    name: name.trim(),
    phone: phone as string | undefined,
    address: {
      line1: line1.trim(),
      line2: line2 === undefined ? undefined : line2.trim(),
      city: city.trim(),
      state: state.toUpperCase(),
      postalCode: postalCode.toUpperCase(),
      country: country.toUpperCase(),
    },
  };
}

function sanitizeCustomer(customer: unknown): CustomerInput | undefined {
  if (customer === undefined) {
    return undefined;
  }
  assert(isRecord(customer), "customer must be an object", 400);
  const { id, email, name, phone } = customer;
  if (id !== undefined) {
    assert(typeof id === "string" && id.startsWith("cus_"), "customer.id must be a Stripe customer ID", 400);
  }
  if (email !== undefined) {
    assert(typeof email === "string" && email.includes("@"), "customer.email must be a valid email", 400);
  }
  if (name !== undefined) {
    assert(typeof name === "string" && name.trim().length > 0, "customer.name must be a string", 400);
  }
  if (phone !== undefined) {
    assert(typeof phone === "string" && phone.length <= 30, "customer.phone must be a string", 400);
  }
  return {
    id: id as string | undefined,
    email: email as string | undefined,
    name: name as string | undefined,
    phone: phone as string | undefined,
  };
}

function parseRequest(body: unknown): CreatePaymentIntentInput {
  assert(isRecord(body), "Request body must be an object", 400);
  const {
    amount,
    currency,
    captureMethod,
    paymentMethodTypes,
    metadata,
    receiptEmail,
    statementDescriptorSuffix,
    customer,
    shipping,
    orderId,
    orderItems,
    idempotencyKey,
  } = body;

  assert(typeof amount === "number", "amount is required and must be a number", 400);
  assert(typeof currency === "string", "currency is required and must be a string", 400);

  let capture: CaptureMethod | undefined;
  if (captureMethod !== undefined) {
    assert(captureMethod === "automatic" || captureMethod === "manual", "captureMethod must be automatic or manual", 400);
    capture = captureMethod;
  }

  let methods: PaymentMethodType[] | undefined;
  if (paymentMethodTypes !== undefined) {
    assert(Array.isArray(paymentMethodTypes), "paymentMethodTypes must be an array", 400);
    methods = paymentMethodTypes.map((method) => {
      assert(typeof method === "string", "payment method types must be strings", 400);
      assert(ALLOWED_PAYMENT_METHODS.includes(method as PaymentMethodType), "unsupported payment method type requested", 400);
      return method as PaymentMethodType;
    });
    assert(new Set(methods).size === methods.length, "paymentMethodTypes must not contain duplicates", 400);
  }

  if (receiptEmail !== undefined) {
    assert(typeof receiptEmail === "string" && receiptEmail.includes("@"), "receiptEmail must be a valid email", 400);
  }

  if (statementDescriptorSuffix !== undefined) {
    assert(
      typeof statementDescriptorSuffix === "string" && statementDescriptorSuffix.length <= 22,
      "statementDescriptorSuffix must be a string up to 22 characters",
      400,
    );
  }

  if (orderId !== undefined) {
    assert(typeof orderId === "string" && orderId.length <= 64, "orderId must be a string up to 64 characters", 400);
  }

  if (idempotencyKey !== undefined) {
    assert(typeof idempotencyKey === "string" && idempotencyKey.length <= 255, "idempotencyKey must be a string", 400);
  }

  return {
    amount: validateAmount(amount),
    currency: normalizeCurrency(currency),
    captureMethod: capture,
    paymentMethodTypes: methods,
    metadata: sanitizeMetadata(metadata),
    receiptEmail: receiptEmail as string | undefined,
    statementDescriptorSuffix: statementDescriptorSuffix as string | undefined,
    customer: sanitizeCustomer(customer),
    shipping: sanitizeShipping(shipping),
    orderId: orderId as string | undefined,
    orderItems: sanitizeOrderItems(orderItems),
    idempotencyKey: idempotencyKey as string | undefined,
  };
}

function ensureMethodCurrencyCompatibility(methods: PaymentMethodType[], currency: string) {
  for (const method of methods) {
    const allowed = METHOD_CURRENCIES[method];
    if (allowed.size > 0 && !allowed.has(currency)) {
      throw new AdapterError(`${method} does not support currency ${currency}`, {
        status: 400,
        expose: true,
      });
    }
  }
}

function ensureShippingForAsyncMethods(methods: PaymentMethodType[], shipping: ShippingInput | undefined) {
  if (methods.some((method) => ASYNC_METHODS.has(method))) {
    assert(shipping !== undefined, "shipping details are required for buy-now-pay-later methods", 400);
  }
}

function ensureCaptureMethodCompatibility(methods: PaymentMethodType[], captureMethod: CaptureMethod | undefined) {
  if (!captureMethod || captureMethod === "automatic") {
    return;
  }

  if (methods.some((method) => method !== "card")) {
    throw new AdapterError("Manual capture is only supported for card payments", {
      status: 400,
      expose: true,
    });
  }
}

function ensureOrderTotalsMatch(amount: number, items: OrderItemInput[] | undefined) {
  if (!items || items.length === 0) {
    return;
  }
  const total = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  assert(total === amount, "orderItems total must equal amount", 400);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function handleAdapterError(error: AdapterError): Response {
  if (!error.expose) {
    console.error("Stripe adapter error", {
      status: error.status,
      message: error.message,
    });
  }
  return jsonResponse(error.status ?? 500, {
    success: false,
    error: {
      code: error.status ?? 500,
      message: error.expose ? error.message : "An unexpected error occurred.",
    },
  });
}

function handleUnknownError(error: unknown): Response {
  console.error("Stripe handler crashed", error instanceof Error ? { message: error.message, stack: error.stack } : error);
  return jsonResponse(500, {
    success: false,
    error: {
      code: 500,
      message: "An unexpected error occurred.",
    },
  });
}

function buildPaymentIntentParams(payload: CreatePaymentIntentInput): Stripe.PaymentIntentCreateParams {
  const paymentMethodTypes = payload.paymentMethodTypes ?? DEFAULT_PAYMENT_METHOD_TYPES;
  ensureMethodCurrencyCompatibility(paymentMethodTypes, payload.currency);
  ensureShippingForAsyncMethods(paymentMethodTypes, payload.shipping);
  ensureCaptureMethodCompatibility(paymentMethodTypes, payload.captureMethod);
  ensureOrderTotalsMatch(payload.amount, payload.orderItems);

  const shipping = payload.shipping
    ? {
        name: payload.shipping.name,
        phone: payload.shipping.phone,
        address: {
          line1: payload.shipping.address.line1,
          line2: payload.shipping.address.line2,
          city: payload.shipping.address.city,
          state: payload.shipping.address.state,
          postal_code: payload.shipping.address.postalCode,
          country: payload.shipping.address.country,
        },
      }
    : undefined;

  const metadata: Record<string, string> = payload.metadata ? { ...payload.metadata } : {};
  if (payload.orderId) {
    metadata.orderId = payload.orderId;
  }
  if (payload.orderItems) {
    const serialized = JSON.stringify(
      payload.orderItems.map((item) => ({ sku: item.sku, quantity: item.quantity, unitAmount: item.unitAmount })),
    );
    assert(serialized.length <= 500, "orderItems metadata is too large", 400);
    metadata.orderItems = serialized;
  }

  const params: Stripe.PaymentIntentCreateParams = {
    amount: payload.amount,
    currency: payload.currency,
    capture_method: payload.captureMethod ?? "automatic",
    payment_method_types: paymentMethodTypes,
    metadata,
    shipping,
    receipt_email: payload.receiptEmail,
    statement_descriptor_suffix: payload.statementDescriptorSuffix,
  };

  if (payload.customer?.id) {
    params.customer = payload.customer.id;
  } else if (payload.customer?.email) {
    params.customer_email = payload.customer.email;
  }

  if (payload.customer?.name) {
    params.description = payload.customer.name;
  }

  return params;
}

function toSuccessResponse(intent: Stripe.PaymentIntent): Response {
  if (!intent.client_secret) {
    throw new AdapterError("Stripe did not return a client secret", { status: 502 });
  }
  return jsonResponse(200, {
    success: true,
    data: {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      paymentMethodTypes: intent.payment_method_types,
    },
    error: { code: "", message: "" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: { code: 405, message: "Method Not Allowed" },
    });
  }

  let payload: CreatePaymentIntentInput;
  try {
    const body = await request.json();
    payload = parseRequest(body);
  } catch (error) {
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    if (error instanceof SyntaxError) {
      return jsonResponse(400, {
        success: false,
        error: { code: 400, message: "Request body must be valid JSON" },
      });
    }
    return handleUnknownError(error);
  }

  try {
    const params = buildPaymentIntentParams(payload);
    const idempotencyKey = payload.idempotencyKey ?? crypto.randomUUID();
    const intent = await stripe.paymentIntents.create(params, { idempotencyKey });
    return toSuccessResponse(intent);
  } catch (error) {
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as Stripe.StripeRawError;
      const status = stripeError.statusCode ?? 500;
      const expose = typeof stripeError.message === "string";
      return jsonResponse(status, {
        success: false,
        error: {
          code: status,
          message: expose ? stripeError.message : "Payment processing failed.",
        },
      });
    }
    return handleUnknownError(error);
  }
});
