/**
 * The public API's paths, in one place, so the server's routes, the docs and
 * the snippets on the keys page cannot drift from each other. The docs test
 * checks every snippet against these.
 */
export const PUBLIC_API_PREFIX = '/api/public/v1';

/** Route pattern for the server (":shortCode" stays a parameter). */
export const PUBLIC_TEMPLATE_ROUTE = `${PUBLIC_API_PREFIX}/templates/:shortCode`;
export const PUBLIC_RENDER_ROUTE = `${PUBLIC_TEMPLATE_ROUTE}/render`;

export function publicTemplatePath(shortCode: string): string {
  return `${PUBLIC_API_PREFIX}/templates/${shortCode}`;
}

export function publicRenderPath(shortCode: string): string {
  return `${publicTemplatePath(shortCode)}/render`;
}
