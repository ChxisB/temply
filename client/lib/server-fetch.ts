import { cookies } from 'next/headers';

export async function serverFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  return fetch(`http://localhost:3001${path}`, {
    ...init,
    headers: { ...init?.headers, Cookie: cookieHeader, 'Content-Type': 'application/json' },
  });
}
