import { INCLUDED, PRICES_USD, TEMPLATE_PACK, TRIAL_DAYS, formatUsd } from '@temply/shared/plans';
import { PRODUCTION_SITE_URL } from '~/lib/site';

/**
 * A plain-text pricing sheet for AI buying agents, which compare tools before
 * a person visits and skip pricing they cannot read. The numbers come from the
 * same plans module the dashboard bills on, so this file cannot drift from what
 * a customer is charged. The home page carries the same tiers for a reader.
 */
export const dynamic = 'force-static';

export function GET() {
  const calls = INCLUDED.apiCalls.toLocaleString('en-GB');
  const body = `# Pricing — Temply

Temply builds the email and your own provider sends it, so there is no per-email fee here. Prices are in US dollars.

## Free trial
- Price: free for ${TRIAL_DAYS} days, no card
- Included: ${calls} live API calls a month, ${INCLUDED.templates} templates, ${INCLUDED.versionsPerTemplate} versions each
- After the trial: nothing is charged until you subscribe

## Team
- Price: ${formatUsd(PRICES_USD.seat)} per person a month
- Included: ${calls} live API calls a month across the workspace
- Overage: ${formatUsd(PRICES_USD.overagePer1000Calls)} per 1,000 calls past the included amount
- Template pack: ${formatUsd(PRICES_USD.templatePack)} a month each, adds ${TEMPLATE_PACK.templates} templates and ${TEMPLATE_PACK.versionsPerTemplate} versions per template

## Enterprise
- Price: custom
- For more seats, higher limits, or a dedicated agreement; contact us from the home page

Full pricing and the current plan are at ${PRODUCTION_SITE_URL}.
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
