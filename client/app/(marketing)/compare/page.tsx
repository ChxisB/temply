import { JsonLd } from '~/components/json-ld';
import { Code, H2, H3, P } from '~/components/docs/docs-content';
import { faqId } from '~/components/docs/faq';
import { docsPanelRows } from '~/components/docs/panel';
import { cn } from '~/lib/classname';
import { publicPageMetadata, publicPageSchema } from '~/lib/seo';

export const metadata = publicPageMetadata('/compare');

/**
 * Where Temply sits among email tools. The comparison a buyer actually weighs
 * is against an all-in-one platform that also has an editor, so that is the
 * table: Temply does the one job and keeps your stack, the platform does far
 * more at a price that grows with your list. A sending provider is a
 * complement, not a rival, so it is prose, not a column. Named products are
 * examples of a category, never the subject of a claim, so the page stays true
 * when a vendor adds a feature or changes a price.
 */
const COLUMNS = ['Temply', 'An all-in-one platform'] as const;

const ROWS: Array<{ what: string; cells: readonly [string, string] }> = [
  { what: 'What it does', cells: ['Builds and renders the email template', 'An editor, plus sending, lists and campaigns'] },
  { what: 'Your sending provider', cells: ['Keep the one you use', 'Replaced by its own'] },
  { what: 'Transactional email', cells: ['Its whole job', 'One feature among many'] },
  { what: 'Price', cells: ['Flat, per person', 'Grows with your contact list'] },
  { what: 'A marketer edits the words, no deploy', cells: ['Yes', 'Yes'] },
];

// Each answer is one self-contained paragraph, because it feeds the FAQPage
// schema below as well as the page: the two must stay the one text.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is Temply an alternative to Resend, Postmark or Amazon SES?',
    a: 'No, and it does not try to be. Those are sending providers; they deliver the email. Temply builds the template and renders the HTML and plain text, and your app hands that to the provider you already use. You keep your deliverability, domains and sending history where they are.',
  },
  {
    q: 'Is Temply cheaper than a marketing platform like Mailchimp or Loops?',
    a: 'For transactional email, usually, and simpler. A marketing platform prices by contacts and bundles lists, campaigns and its own sender. Temply is a flat price per person and does one thing: the email your app sends one at a time. If you need audiences and broadcasts, that is a different tool.',
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
            Temply does one thing: it turns your content into the email your app
            sends, and it keeps the stack you already have. Here is how that
            focus compares with the bigger tools you might weigh it against.
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
              That is the whole product. There is no sending to configure, no
              list to manage and no campaign builder to learn, so there is less
              to set up and less to pay for. The one job is the feature.
            </P>
          </section>

          <section aria-labelledby="sending-provider">
            <H2 id="sending-provider">Temply keeps your sending provider</H2>
            <P>
              A sending provider such as Resend, Postmark or Amazon SES takes an
              email and delivers it: domains, reputation, bounces and the
              sending history live there. Temply hands it the HTML, so you keep
              the provider you have. Nothing migrates, and switching providers
              later does not touch your templates.
            </P>
            <P>
              In practice your send code changes by one call. Where it built an
              HTML string, it now asks Temply for the rendered template and
              passes the result to the provider&apos;s send method. The
              provider does not know Temply is there.
            </P>
          </section>

          <section aria-labelledby="marketing-platform">
            <H2 id="marketing-platform">Temply vs an all-in-one platform</H2>
            <P>
              An all-in-one platform such as Mailchimp, Loops or customer.io
              bundles an editor with sending, lists, campaigns and its own
              infrastructure. It is the right tool when the job is a newsletter
              or a lifecycle series to an audience, and you want one account to
              run it from.
            </P>
            <P>
              For the email your own app sends to one person because of
              something they did, that is more tool than the job takes, at a
              price that grows with your list. Temply does only that email, at a
              flat price, and leaves the sending where it is.
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
              <table className="w-full min-w-[32rem] text-ui">
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
                        <td key={COLUMNS[i]} className={cn('px-4 py-3', i === 0 ? 'text-ink-soft' : 'text-muted')}>
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
              A team whose job is newsletters or drip campaigns to a list: that
              wants an audience and a scheduler, which an all-in-one platform
              has and Temply leaves out on purpose. A team with no sending
              provider yet needs one first, since Temply keeps your sender
              rather than being one.
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
