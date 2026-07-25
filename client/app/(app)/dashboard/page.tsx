import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileTextIcon } from 'lucide-react';
import { NewTemplateButton } from '~/components/dashboard/new-template-button';
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

  const { templates = [] } = templatesRes.ok ? await templatesRes.json() : { templates: [] };
  const billing = billingRes?.ok ? await billingRes.json() : null;

  const count = templates.length;
  const recentTemplates = templates.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Here&apos;s an overview of your templates.
          </p>
        </div>
        <NewTemplateButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <FileTextIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">API Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{billing?.usage?.apiKeys ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Plan</p>
              <p className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{billing?.plan ?? 'Free'}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Templates</h2>
          {count > 0 && (
            <Link
              href="/dashboard/templates"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              View all
            </Link>
          )}
        </div>

        {recentTemplates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-zinc-700">
            <FileTextIcon className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">No templates yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Create your first template to get started.
            </p>
            <div className="mt-4">
              <NewTemplateButton />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentTemplates.map((template: any) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-400/30"
              >
                <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                  {template.title}
                </h3>
                {template.preview_text && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-zinc-400">
                    {template.preview_text}
                  </p>
                )}
                <p className="mt-3 text-xs text-gray-400 dark:text-zinc-500">
                  Updated {new Date(template.updated_at ?? '').toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
