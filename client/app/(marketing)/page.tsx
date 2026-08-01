import { ArrowRightIcon, BoxIcon, EyeIcon, PaintbrushIcon, PanelRightOpenIcon, PuzzleIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';
import { EmailArtifact } from '~/components/marketing/email-artifact';
import { Button } from '~/components/ui/button';

const features = [
  {
    icon: PuzzleIcon,
    title: 'Block-based editor',
    desc: 'Drag, drop, and arrange content blocks — no HTML, no frustration. Just point-and-click email building.',
  },
  {
    icon: EyeIcon,
    title: 'Live preview',
    desc: 'See exactly how your email renders across clients before hitting send. What you build is what they get.',
  },
  {
    icon: PaintbrushIcon,
    title: 'Dark mode support',
    desc: 'Templates that respect reader preferences. Built-in dark mode handling out of the box.',
  },
  {
    icon: BoxIcon,
    title: 'Pre-built components',
    desc: 'Headers, footers, buttons, spacers, columns — grab a component and customise it in seconds.',
  },
  {
    icon: ZapIcon,
    title: 'Variable injections',
    desc: 'Drop dynamic placeholders anywhere. Names, links, unsubscribe URLs — fill them at send time.',
  },
  {
    icon: PanelRightOpenIcon,
    title: 'Resend integration',
    desc: 'Connect your Resend API key and send straight from the editor. No extra plumbing needed.',
  },
];

// Only components that exist. "Social Links" used to be listed here; the block
// it referred to shipped a stranger's personal profiles into users' mail and
// has been removed, so the claim went with it.
const components = [
  'Logo', 'Buttons', 'Variables', 'Text formatting', 'Images',
  'Alignment', 'Dividers', 'Spacers', 'Headers & footers',
  'Lists', 'Quotes', 'Custom HTML', 'Sections', 'Columns',
  'Repeat blocks', 'Show-if conditions',
];

export default function Home() {
  return (
    <div className="bg-surface">
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-20 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Build the email, not the table layout.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted">
            Temply is a block editor for transactional email. Compose at the
            600&nbsp;pixels every inbox gives you, then send it from your own app.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <Link href="/playground">
                Open the editor
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/login">Sign in to save</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted">
            No account needed to try it. Create one when you want to keep your work.
          </p>
        </div>

        <div className="mt-14">
          <EmailArtifact />
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Everything you need to build emails
          </h2>
          <p className="mt-1.5 max-w-xl text-base text-muted">
            No coding. No templates that break in Outlook. Just a clean block
            editor that produces rock-solid HTML.
          </p>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-raised p-5">
                  <Icon className="size-4 text-accent-ink" />
                  <h3 className="mt-3 text-sm font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Blocks in the box</h2>
          <p className="mt-1.5 text-base text-muted">
            Press <kbd className="rounded-xs border border-line bg-raised px-1 font-mono text-xs">/</kbd>{' '}
            in the editor to reach any of them.
          </p>

          <ul className="mt-6 flex flex-wrap gap-1.5">
            {components.map((component) => (
              <li
                key={component}
                className="rounded-sm border border-line bg-raised px-2.5 py-1 text-sm text-muted"
              >
                {component}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} Temply</p>
          <Link href="/playground" className="text-accent-ink underline-offset-4 hover:underline">
            Open the editor
          </Link>
        </div>
      </footer>
    </div>
  );
}
