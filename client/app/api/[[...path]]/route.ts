import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// The API binds to IPv4 loopback only, so address it explicitly rather than via
// `localhost`, which resolves to ::1 first on macOS.
const API_TARGET = 'http://127.0.0.1:3001';

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const pathStr = path ? path.join('/') : '';
  const search = request.nextUrl.search;

  const { userId } = await auth();
  const targetUrl = pathStr ? `${API_TARGET}/api/${pathStr}${search}` : `${API_TARGET}/api${search}`;

  // Forward all relevant headers
  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
    'Cookie': request.headers.get('Cookie') || '',
    'Authorization': request.headers.get('Authorization') || '',
    'x-user-id': userId || '',
    // Proves to the API that this forwarded user id came from our own proxy.
    'x-internal-token': process.env.INTERNAL_API_SECRET || '',
  };

  const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const data = await res.text();
  const response = new NextResponse(data, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
    },
  });

  // Forward any Set-Cookie the API returns so cookie-setting routes work through
  // the proxy; getSetCookie keeps multiple cookies intact.
  const setCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie') as string]
        : [];
  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
