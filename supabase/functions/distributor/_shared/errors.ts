export class AdapterError extends Error {
  readonly status: number;
  readonly expose: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      status?: number;
      expose?: boolean;
      cause?: unknown;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.status = options.status ?? 500;
    this.expose = options.expose ?? false;
    this.details = options.details;
  }
}

export function assert(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) {
    throw new AdapterError(message, { status, expose: true });
  }
}