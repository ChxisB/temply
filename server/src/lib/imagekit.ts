import ImageKit from 'imagekit';

let client: ImageKit | null = null;

/** Built lazily so the server still boots when image uploads are not
 *  configured — listing and deleting the library never needs the keys, and
 *  a URL pasted into the editor never touches ImageKit at all. */
export function getImageKit(): ImageKit | null {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!publicKey || !privateKey || !urlEndpoint) return null;
  if (!client) client = new ImageKit({ publicKey, privateKey, urlEndpoint });
  return client;
}

/** Test-only: clears the cached client so a test can flip the env vars and
 *  observe `getImageKit()` return null again, instead of the previous
 *  test's cached instance. */
export function resetImageKitForTests(): void {
  client = null;
}

/** Organisational only — the private key is the access boundary, the folder
 *  just keeps one user's files together in the ImageKit console. */
export function assetFolder(userId: string): string {
  return `/temply/${userId}`;
}
