import { ArrowRightIcon, BoxIcon, EyeIcon, PaintbrushIcon, PanelRightOpenIcon, PuzzleIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: PuzzleIcon,
    title: 'Block-Based Editor',
    desc: 'Drag, drop, and arrange content blocks — no HTML, no frustration. Just point-and-click email building.',
  },
  {
    icon: EyeIcon,
    title: 'Live Preview',
    desc: 'See exactly how your email renders across clients before hitting send. What you build is what they get.',
  },
  {
    icon: PaintbrushIcon,
    title: 'Dark Mode Support',
    desc: 'Templates that respect reader preferences. Built-in dark mode handling out of the box.',
  },
  {
    icon: BoxIcon,
    title: 'Pre-Built Components',
    desc: 'Headers, footers, buttons, spacers, columns — grab a component and customise it in seconds.',
  },
  {
    icon: ZapIcon,
    title: 'Variable Injections',
    desc: 'Drop dynamic placeholders anywhere. Names, links, unsubscribe URLs — fill them at send time.',
  },
  {
    icon: PanelRightOpenIcon,
    title: 'Resend Integration',
    desc: 'Connect your Resend API key and send straight from the editor. No extra plumbing needed.',
  },
];

const components = [
  'Logo', 'Buttons', 'Variables', 'Text Formatting', 'Images',
  'Alignment', 'Dividers', 'Spacers', 'Headers & Footers',
  'Lists', 'Quotes', 'Code Blocks', 'Sections', 'Columns',
  'Repeat Blocks', 'Visibility Rules', 'Social Links',
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-zinc-800/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent dark:from-zinc-800/20" />

        <div className="relative mx-auto max-w-6xl px-6 pb-32 pt-24 sm:px-10 sm:pt-32 lg:pt-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Open-source email builder
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Email templates,{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-cyan-400">
                built with blocks
              </span>
              .
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-gray-500 dark:text-zinc-400 sm:text-xl">
              Temply is a drag-and-drop email editor that lets you build responsive,
              beautiful templates without touching code. Open-source, privacy-first,
              and ready in minutes.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/playground"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.97] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Try the Editor
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                Sign in to Save
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-gray-200 py-24 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to build emails
            </h2>
            <p className="mt-4 text-gray-500 dark:text-zinc-400">
              No coding. No templates that break in Outlook. Just a clean block editor
              that produces rock-solid HTML.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="border-b border-gray-200 py-24 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pre-Built Components
            </h2>
            <p className="mt-4 text-gray-500 dark:text-zinc-400">
              A growing library of components you can mix, match, and customise.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {components.map((component) => (
              <span
                key={component}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-emerald-400/30 dark:hover:text-emerald-300"
              >
                {component}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Start building, instantly
            </h2>
            <p className="mt-4 text-gray-500 dark:text-zinc-400">
              No sign-up required to try the editor. Create an account only when you
              want to save and send.
            </p>
            <Link
              href="/playground"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.97] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Open the Editor
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-gray-500 sm:px-10 dark:text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Temply. All rights reserved.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-gray-700 dark:hover:text-zinc-300"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
