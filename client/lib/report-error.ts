/**
 * Where a caught error goes. Today the console; when error monitoring is
 * wired this is the one place to send it from, so the error pages do not
 * each learn about the SDK.
 */
export function reportError(error: unknown): void {
  console.error(error);
}
