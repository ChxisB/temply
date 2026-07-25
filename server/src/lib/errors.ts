import type { ZodError } from 'zod';

export function serializeZodError(error: ZodError) {
  const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return new Response(JSON.stringify({ status: 400, message: 'Validation error', errors }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function unauthorized(message = 'Unauthorized') {
  return new Response(JSON.stringify({ status: 401, message, errors: [message] }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function notFound(message = 'Not found') {
  return new Response(JSON.stringify({ status: 404, message, errors: [message] }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function paymentRequired(message: string) {
  return new Response(JSON.stringify({ status: 402, message, errors: [message] }), {
    status: 402,
    headers: { 'Content-Type': 'application/json' },
  });
}
