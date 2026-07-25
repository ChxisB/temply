import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { FileTextIcon } from 'lucide-react';
import { NewTemplateButton } from '~/components/dashboard/new-template-button';
import { TemplateActions } from '~/components/dashboard/template-actions';
import { serverFetch } from '~/lib/server-fetch';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const { userId } = await auth();

  if (!userId) redirect('/login');

  const res = await serverFetch('/api/v1/templates');
  const { templates = [] } = res.ok ? await res.json() : { templates: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Manage your email templates.
          </p>
        </div>
        <NewTemplateButton />
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-zinc-700">
          <FileTextIcon className="mx-auto mb-4 h-10 w-10 text-gray-400" />
          <h3 className="text-base font-medium text-gray-900 dark:text-white">No templates yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
            Create your first template and it will show up here.
          </p>
          <div className="mt-6">
            <NewTemplateButton />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: any) => (
            <div
              key={template.id}
              className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-zinc-600"
            >
              <a href={`/templates/${template.id}`} className="block">
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
              </a>
              <div className="mt-3 border-t border-gray-100 pt-3 dark:border-zinc-800">
                <TemplateActions templateId={template.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
