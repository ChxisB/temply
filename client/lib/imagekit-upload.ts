import { toast } from 'sonner';
import { httpGet } from './http';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
// Email-safe: no f-auto (WebP breaks Outlook). w-1200 = 2x the 600px email
// width; q-80 halves the bytes at good quality.
const TRANSFORM = 'tr=w-1200,q-80';

// SVG is excluded on purpose: Gmail/Outlook strip inline SVG, so it never
// renders in a real email.
export const UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
  userId: string;
};

/** Returns an `onImageUpload` for the editor: uploads straight to ImageKit
 *  using server-signed params, and returns the CDN URL with the email-safe
 *  transform appended. Throws (and toasts) on rejection so the editor's image
 *  node shows its error state. */
export function createImageKitUploader(): (file: Blob) => Promise<string> {
  return async function onImageUpload(file: Blob): Promise<string> {
    const named = file as File;
    if (named.size > MAX_BYTES) {
      toast.error('Image must be under 5MB.');
      throw new Error('Image exceeds 5MB');
    }

    let auth: ImageKitAuth;
    try {
      auth = await httpGet<ImageKitAuth>('/api/v1/imagekit-auth', {});
    } catch (err: any) {
      toast.error(err?.message || 'Could not start the upload.');
      throw err;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('fileName', named.name || 'image');
    form.append('publicKey', auth.publicKey);
    form.append('signature', auth.signature);
    form.append('expire', String(auth.expire));
    form.append('token', auth.token);
    // The ImageKit signature authenticates the request, not these fields — folder
    // and fileName are organizational only, not an access boundary.
    form.append('folder', `/temply/${auth.userId}`);
    form.append('useUniqueFileName', 'true');

    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      toast.error('Image upload failed. Please try again.');
      throw new Error(`ImageKit upload failed: ${res.status}`);
    }

    const data = (await res.json()) as { url: string };
    const sep = data.url.includes('?') ? '&' : '?';
    return `${data.url}${sep}${TRANSFORM}`;
  };
}
