import { JsonLd } from '~/components/json-ld';
import { Code, H2, H3, P } from '~/components/docs/docs-content';
import { faqId } from '~/components/docs/faq';
import { docsPanelRows } from '~/components/docs/panel';
import { cn } from '~/lib/classname';
import { publicPageMetadata, publicPageSchema } from '~/lib/seo';

export const metadata = publicPageMetadata('/compare');

/**
 * Where Temply sits among email tools, by category rather than by vendor.
 * The named products are examples of a category, not the subject of a claim:
 * every cell is a fact about what that kind of tool does, so the page stays
 * true when a vendor adds a feature or changes a price. An answer engine that
 * cites a page like this cites the categories, which is the honest answer to
 * "Temply vs X" anyway: Temply is not a sender, and it is not a marketing
 * platform, so it replaces neither.
 */
const COLUMNS = ['Temply', 'A sending provider', 'A marketing platform'] as const;

const ROWS: Array<{ what: string; cells: readonly [string, string, string] }> = [
  { what: 'Sends the email', cells: ['No', 'Yes', 'Yes'] },
  {
    what: 'Where the email is designed',
    cells: ['The Temply editor', 'Your code, or its own template feature', 'Its own editor'],
  },
  {
    what: 'Who delivers it',
    cells: ['A provider you choose', 'Itself', 'Itself'],
  },
  {
    what: 'Subscriber lists and campaigns',
    cells: ['No', 'Not the main job', 'Yes'],
  },
  {
    what: 'How your app gets the finished HTML',
    cells: ['One API call per send', 'You pass the HTML in', 'You usually do not; it sends for you'],
  },
];

// Each answer is one self-contained paragraph, because it feeds the FAQPage
// schema below as well as the page: the two must stay the one text.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is Temply an alternative to Resend, Postmark or Amazon SES?',
    a: 'No. Those are sending providers; they deliver the email. Temply builds the template and renders the HTML and plain text, and your app hands that to the provider you already use. The two sit side by side, and you keep your deliverability, domains and sending history where they are.',
  },
  {
    q: 'Is Temply an alternative to Mailchimp, Loops or customer.io?',
    a: 'Not for marketing. A marketing platform manages lists, campaigns and journeys, and sends from its own infrastructure. Temply is for the transactional email your app sends one at a time: receipts, welcome emails, password resets. If you need audiences and broadcasts, a marketing platform is the right tool.',
  },
  {
    q: 'Can I use Temply with the provider I already have?',
    a: 'Yes. The render endpoint returns HTML and plain text with your data filled in, and any provider that accepts raw HTML can send it. Nothing about Temply ties you to one sender; switching providers later does not touch your templates.',
  },
  {
    q: 'What do I give up by not using my provider’s own templates?',
    a: 'Nothing on the sending side; your provider still sends. What changes is where the template lives: in Temply, a marketer edits and publishes it from the dashboard, your app keeps calling the same short code, and you can pin a version when a template should change only when you say so.',
  },
];

const faqSchema = {
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function ComparePage() {
  return (
    <div className="overflow-x-clip">
      <JsonLd data={publicPageSchema('/compare', [faqSchema])} />
      <div className="mx-auto max-w-5xl px-5 pt-16 pb-24 sm:pt-20">
        <header className="max-w-2xl">
          <p className="font-mono text-2xs tracking-[0.16em] text-accent-ink uppercase">Compare</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-display text-balance text-ink lg:text-4xl">
            How Temply fits your email stack
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-muted">
            Temply builds and renders email templates. It does not send email,
            and it does not run campaigns. Here is what that means next to the
            tools you may already be weighing it against.
          </p>
        </header>

        <div className="mt-14 flex max-w-3xl flex-col gap-16">
          <section aria-labelledby="what-temply-is">
            <H2 id="what-temply-is">What Temply is</H2>
            <P>
              Temply is an email template builder with a render API. You arrange
              blocks in the editor, add your brand, and publish. Your app then
              calls the render endpoint with a template&apos;s short code and a
              data object, and gets back the finished HTML and plain text with
              your values in place, ready to send.
            </P>
            <P>
              Temply stops at the finished email; your provider delivers it.
              That line is the whole comparison. Anything on the sending side
              of it belongs to another tool, and Temply is built to sit beside
              that tool rather than to replace it.
            </P>
          </section>

          <section aria-labelledby="sending-provider">
            <H2 id="sending-provider">Temply and your sending provider</H2>
            <P>
              A sending provider such as Resend, Postmark or Amazon SES takes an
              email and delivers it: domains, reputation, bounces and the
              sending history live there. Temply hands it the HTML. You keep
              the provider you have, and Temply replaces the part where the
              email&apos;s markup was written by hand and shipped with a
              deploy.
            </P>
            <P>
              In practice your send code changes by one call. Where it built an
              HTML string, it now asks Temply for the rendered template and
              passes the result to the provider&apos;s send method. The
              provider does not know Temply is there.
            </P>
          </section>

          <section aria-labelledby="marketing-platform">
            <H2 id="marketing-platform">Temply vs a marketing platform</H2>
            <P>
              A marketing platform such as Mailchimp, Loops or customer.io is a
              different category again. It holds your audience, runs campaigns
              and journeys, has its own editor, and sends from its own
              infrastructure. It is the right tool when the job is a newsletter
              or a lifecycle series to a list.
            </P>
            <P>
              Temply is for the email your own app sends to one person because
              of something they did: a receipt, a welcome, a password reset.
              There is no list to manage and no campaign to schedule. The
              platform owns the broadcast; Temply owns the template your code
              renders per send.
            </P>
          </section>

          <section aria-labelledby="side-by-side">
            <H2 id="side-by-side">Side by side</H2>
            <P>
              By category, not by vendor. Products within a category differ, so
              a column describes what that kind of tool is for rather than any
              one product&apos;s feature list.
            </P>
            <div className={cn(docsPanelRows, 'mt-5 overflow-x-auto')}>
              {/* Four columns squeezed to a phone read as a list of syllables;
                  the wrapper scrolls instead. */}
              <table className="w-full min-w-[40rem] text-ui">
                <thead>
                  <tr className="border-b border-line text-left text-2xs font-medium tracking-wide text-muted uppercase">
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">What</span>
                    </th>
                    {COLUMNS.map((c) => (
                      <th key={c} className="px-4 py-3 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ROWS.map((row) => (
                    <tr key={row.what} className="align-top">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                        {row.what}
                      </th>
                      {row.cells.map((cell, i) => (
                        <td key={COLUMNS[i]} className="px-4 py-3 text-muted">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="who-for">
            <H2 id="who-for">Who Temply is for</H2>
            <P>
              A product team whose app already sends transactional email through
              a provider, and whose templates are HTML in the codebase that only
              a developer can change. With Temply the marketer edits and
              publishes in the dashboard, the app keeps calling the same short
              code, and the next send carries the change.
            </P>
            <H3 id="who-not-for">Who Temply is not for</H3>
            <P>
              A team that needs to send newsletters or run drip campaigns to a
              list, because Temply has no audience and no scheduler. A team
              with no sending provider yet, because Temply does not deliver.
              And a team happy with the templates their provider already
              offers; the gap Temply fills is the one between code and the
              person who wants to change the words.
            </P>
          </section>

          <section aria-labelledby="faq" className="flex flex-col gap-8">
            <H2 id="faq">Common questions</H2>
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <H3 id={faqId(q)}>{q}</H3>
                <p className="mt-2 text-lg text-pretty text-muted">{a}</p>
              </div>
            ))}
            <p className="text-lg text-pretty text-muted">
              The render call itself is in the{' '}
              <a href="/docs#api-render" className="text-accent-ink underline-offset-4 transition-colors duration-fast ease-out hover:underline motion-reduce:transition-none">
                API documentation
              </a>
              ; the response is one <Code>html</Code> and one <Code>text</Code>{' '}
              string.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
