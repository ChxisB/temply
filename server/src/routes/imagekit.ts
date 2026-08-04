import { Elysia } from 'elysia';
import ImageKit from 'imagekit';
import { json, unauthorized } from '../lib/errors';

let client: ImageKit | null = null;

/** Built lazily so the server still boots when image uploads are not
 *  configured — pasting a URL does not need ImageKit. */
function getImageKit(): ImageKit | null {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!publicKey || !privateKey || !urlEndpoint) return null;
  if (!client) client = new ImageKit({ publicKey, privateKey, urlEndpoint });
  return client;
}

export const imagekitRoutes = new Elysia().get('/api/v1/imagekit-auth', async (ctx: any) => {
  if (!ctx.userId) return unauthorized();

  const ik = getImageKit();
  if (!ik) {
    return json({ status: 500, message: 'Image uploads are not configured', errors: ['IMAGEKIT env missing'] }, 500);
  }

  // token/expire/signature are the client-upload credentials, signed with the
  // private key. publicKey + urlEndpoint are public and safe to hand back.
  const auth = ik.getAuthenticationParameters();
  return json({
    token: auth.token,
    expire: auth.expire,
    signature: auth.signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    userId: ctx.userId,
  });
});
