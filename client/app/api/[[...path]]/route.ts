import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const API_TARGET = 'http://localhost:3001';

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
  };

  const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
    },
  });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
