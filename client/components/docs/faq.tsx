import { INCLUDED, PRICES_USD, TRIAL_DAYS, formatUsd } from '@temply/shared/plans';
import { H2, H3 } from './docs-content';

/** The anchor a question gets, so a link — or an AI answer — can land on the
 *  one it quotes. */
export function faqId(question: string): string {
  return `faq-${question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

/**
 * The questions a developer asks before wiring Temply in, answered where the
 * docs read without an account. The same text feeds the page and the FAQPage
 * schema the docs route emits, so each answer stays one self-contained
 * paragraph: edit it here and the page and the schema move together. The two
 * must match, or the structured data describes a page that does not exist.
 */
export const DOCS_FAQ: { q: string; a: string }[] = [
  {
    q: 'Do I need to know HTML to build an email in Temply?',
    a: 'No. You arrange blocks in the editor, and Temply generates the HTML and a plain-text copy. The HTML is built from tables and inline styles, so it holds up across email clients. A marketer can write and lay out the content without touching code.',
  },
  {
    q: 'Does Temply send the email?',
    a: 'No. Temply stops at the finished email; your own provider delivers it. The render call returns the HTML and plain text, ready to hand to a provider such as Resend, Postmark, or Amazon SES. Resend is what Temply itself sends through.',
  },
  {
    q: 'How does my app get the finished email?',
    a: "Your app calls the render endpoint with a template's short code and a data object of the values to fill in. Temply returns the HTML and plain text with your data already in place. One call gives you both parts, ready to send.",
  },
  {
    q: 'Can I change a template without redeploying my app?',
    a: 'Yes. You edit and publish in the dashboard, and the API serves the copy you last published; your app keeps calling the same short code. Pin a version when you want a template to change only when you say so, not on the next publish.',
  },
  {
    q: 'Does Temply handle dark mode email?',
    a: 'Yes. A template renders for light and dark inboxes, and a brand can be set to auto dark or forced dark. The colours are checked to stay readable in forced dark mode, where some clients invert the email on their own.',
  },
  {
    q: 'What happens when I hit the rate limit?',
    a: "The API answers 429 with a Retry-After header in seconds. A per-minute burst refusal is not counted, so waiting that long and trying again costs nothing. On the trial, a 429 can also mean the month's live calls are spent; that clears next month or when someone subscribes.",
  },
  {
    q: 'What does it cost to start?',
    a: `The trial runs ${TRIAL_DAYS} days with no card, and includes ${INCLUDED.apiCalls.toLocaleString('en-GB')} live API calls a month. After it a paid plan carries on, and calls past the included amount are ${formatUsd(PRICES_USD.overagePer1000Calls)} per 1,000. The full pricing is on the home page.`,
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq" className="flex flex-col gap-8">
      <H2 id="faq">Common questions</H2>
      {DOCS_FAQ.map(({ q, a }) => (
        <div key={q}>
          <H3 id={faqId(q)}>{q}</H3>
          <p className="mt-2 text-lg text-pretty text-muted">{a}</p>
        </div>
      ))}
    </section>
  );
}
