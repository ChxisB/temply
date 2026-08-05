import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import { NewTemplateButton } from '~/components/dashboard/new-template-button';
import { PlanLimitBanner } from '~/components/dashboard/plan-limit-banner';
import { TemplateActions } from '~/components/dashboard/template-actions';
import { EmptyState, ErrorState, PageHeader } from '~/components/ui/surfaces';
import { serverFetch } from '~/lib/server-fetch';
import { isLimitReached } from '@temply/shared/plans';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const { userId } = await auth();

  if (!userId) redirect('/login');

  // A failed request used to be coerced into an empty list, which drew the
  // "no templates yet" screen — indistinguishable from an account that really
  // is empty. Keep the two apart.
  const [res, billingRes] = await Promise.all([
    serverFetch('/api/v1/templates'),
    serverFetch('/api/v1/billing').catch(() => null),
  ]);
  const failed = !res.ok;
  const { templates = [] } = failed ? { templates: [] } : await res.json();

  const billing = billingRes?.ok ? await billingRes.json() : null;
  const templateLimit = billing?.limits?.maxTemplates ?? null;
  const atLimit = billing ? isLimitReached(billing.usage?.templates ?? templates.length, templateLimit) : false;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        description="Every email you have built here."
        actions={<NewTemplateButton disabled={atLimit} />}
      />

      {atLimit ? (
        <PlanLimitBanner
          title={`You've used all ${templateLimit} templates on the Free plan.`}
          detail="Upgrade to Pro for unlimited templates."
        />
      ) : null}

      {failed ? (
        <ErrorState description="We could not reach the server, so your templates are not shown. This is not a sign that they are gone." />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="No templates yet"
          description="Start one and it will appear here, ready to edit or send."
          action={<NewTemplateButton />}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-raised">
          {templates.map((template: any) => (
            <li
              key={template.id}
              className="group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-hover"
            >
              <Link href={`/templates/${template.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink group-hover:text-accent-ink">
                  {template.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {template.preview_text || 'No preview text'}
                </p>
              </Link>

              {template.updated_at ? (
                <span className="hidden shrink-0 text-xs text-muted tabular-nums sm:block">
                  {new Date(template.updated_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              ) : null}

              <TemplateActions templateId={template.id} canDuplicate={!atLimit} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
