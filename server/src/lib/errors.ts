export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * A client error raised from anywhere in a route and answered in one place by
 * the global onError. It carries the envelope's parts: the HTTP status, the one
 * human sentence, the extra fields a few errors add, and the headers a 429
 * needs. Throwing it unwinds the handler, so the helpers below return `never`
 * and a guard reads `throw unauthorized()` or stays `return unauthorized()` —
 * the throw wins either way.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly extra: Record<string, unknown> = {},
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function unauthorized(message = 'Unauthorized'): never {
  throw new HttpError(401, message);
}

export function notFound(message = 'Not found'): never {
  throw new HttpError(404, message);
}

/** It was here and has been removed for good; a client that cached its
 *  address should stop asking, which a plain 404 does not tell it. */
export function gone(message: string): never {
  throw new HttpError(410, message);
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}

/** The request was well-formed, but the thing it acts on is not in a state
 *  that allows it. */
export function conflict(message: string): never {
  throw new HttpError(409, message);
}

/** The request was well-formed but the data cannot be used as sent. */
export function unprocessable(message: string, extra: Record<string, unknown> = {}): never {
  throw new HttpError(422, message, extra);
}

export function paymentRequired(message: string): never {
  throw new HttpError(402, message);
}

/**
 * A limit that clears by itself. Retry-After is what a well-behaved client
 * sleeps on; the body says which limit so the integrator knows whether to
 * back off or upgrade.
 */
export function tooManyRequests(message: string, retryAfterSeconds: number): never {
  throw new HttpError(429, message, {}, { 'Retry-After': String(retryAfterSeconds) });
}

/**
 * Maps a raised error onto the JSON error envelope, in the global onError. An
 * HttpError thrown by the helpers above carries its own status, extra fields
 * and headers. Otherwise it is an Elysia code: a routing miss, a schema
 * failure, or a body that won't parse is the client's error, not a server
 * fault — everything else stays a 500.
 */
export function errorResponse(code: string | number, error: unknown): Response {
  if (error instanceof HttpError) {
    return new Response(
      JSON.stringify({ status: error.status, message: error.message, errors: [error.message], ...error.extra }),
      { status: error.status, headers: { 'Content-Type': 'application/json', ...error.headers } },
    );
  }
  // A ValidationError's .message is its whole diagnostic JSON; the `summary`
  // field inside is the one human sentence, which is what a toast should show.
  let message = error instanceof Error ? error.message : 'Internal Server Error';
  if (code === 'VALIDATION' && message.startsWith('{')) {
    try {
      const parsed = JSON.parse(message) as { summary?: unknown };
      if (typeof parsed.summary === 'string') message = parsed.summary;
    } catch {
      // Not the JSON shape we expected — the raw message is still truthful.
    }
  }
  const status =
    code === 'NOT_FOUND' ? 404 : code === 'VALIDATION' || code === 'PARSE' ? 400 : 500;
  return json({ status, message, errors: [message] }, status);
}
