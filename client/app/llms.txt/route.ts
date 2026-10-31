import { PUBLIC_PAGES } from '~/lib/seo';
import { PRODUCTION_SITE_URL } from '~/lib/site';

/**
 * llms.txt (llmstxt.org): a plain-text map of the site for assistants that
 * read one before answering about a product. It carries the same facts the
 * pages do — what Temply is, that it builds the email and does not send it,
 * and where the docs and pricing are — so an assistant quotes the site
 * rather than a guess. Built from the same PUBLIC_PAGES the sitemap uses, so
 * a page added there appears here too. Static, like the sitemap.
 */
export const dynamic = 'force-static';

function link(path: keyof typeof PUBLIC_PAGES): string {
  const page = PUBLIC_PAGES[path];
  const url = `${PRODUCTION_SITE_URL}${path === '/' ? '' : path}`;
  return `- [${page.title}](${url}): ${page.description}`;
}

export function GET() {
  const body = `# Temply

> Temply builds transactional email templates without code. You arrange blocks in the editor, and Temply renders the HTML and plain text. Your app fetches a template through the API and sends it with your own email provider.

Temply generates the email; it does not send it. The render endpoint returns the HTML and plain text with your data already in place, ready to hand to a provider such as Resend, Postmark, or Amazon SES. A marketer can edit and publish a template in the dashboard without a code change, and the API serves the published copy, or a version you pin.

## Pages
${link('/')}
${link('/docs')}
${link('/playground')}

## Terms
${link('/terms')}
${link('/privacy')}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
