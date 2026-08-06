import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileTextIcon } from 'lucide-react';
import { NewTemplateButton } from '~/components/dashboard/new-template-button';
import { EmptyState, ErrorState, PageHeader, StatTile } from '~/components/ui/surfaces';
import { serverFetch } from '~/lib/server-fetch';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) redirect('/login');

  const user = await currentUser();

  const [templatesRes, billingRes] = await Promise.all([
    serverFetch('/api/v1/templates'),
    serverFetch('/api/v1/billing').catch(() => null),
  ]);

  // Track the failure rather than folding it into an empty result: "we could
  // not reach the server" and "you have nothing yet" are different messages.
  const templatesFailed = !templatesRes.ok;
  const { templates = [] } = templatesFailed ? { templates: [] } : await templatesRes.json();
  const billing = billingRes?.ok ? await billingRes.json() : null;

  const recentTemplates = templates.slice(0, 5);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}`}
        description="Where your templates and usage stand today."
      />

      {/* The tiles are the navigation: each one opens the page it summarises. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/templates">
          <StatTile
            label="Templates"
            value={templatesFailed ? '—' : templates.length}
            className="transition-colors hover:border-line-strong"
          />
        </Link>
        <Link href="/dashboard/settings/api-keys">
          <StatTile
            label="API keys"
            value={billing?.usage?.apiKeys ?? '—'}
            className="transition-colors hover:border-line-strong"
          />
        </Link>
        <Link href="/dashboard/settings/plan">
          <StatTile
            label="Plan"
            value={<span className="capitalize">{billing?.plan ?? '—'}</span>}
            hint={billing ? undefined : 'Usage could not be loaded'}
            className="h-full transition-colors hover:border-line-strong"
          />
        </Link>
      </div>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink">Recent templates</h2>
          {!templatesFailed && templates.length > 0 ? (
            <Link
              href="/dashboard/templates"
              className="text-sm text-accent-ink underline-offset-4 hover:underline"
            >
              View all
            </Link>
          ) : null}
        </div>

        {templatesFailed ? (
          <ErrorState description="We could not reach the server, so your templates are not shown. This is not a sign that they are gone." />
        ) : recentTemplates.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="No templates yet"
            description="Start one and it will appear here, ready to edit or send."
            action={<NewTemplateButton />}
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-raised">
            {recentTemplates.map((template: any) => (
              <li key={template.id}>
                <Link
                  href={`/templates/${template.id}`}
                  className="group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-hover"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink group-hover:text-accent-ink">
                      {template.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {template.preview_text || 'No preview text'}
                    </span>
                  </span>
                  {template.updated_at ? (
                    <span className="hidden shrink-0 text-xs text-muted tabular-nums sm:block">
                      {new Date(template.updated_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
