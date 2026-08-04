'use client';

import { Suspense, useEffect } from 'react';
import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { httpGet, httpPost } from '~/lib/http';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { Badge, Card, ErrorState, PageHeader, StatTile } from '~/components/ui/surfaces';
import { cn } from '~/lib/classname';

type PlanInfo = {
  plan: string;
  status: string;
  usage: {
    templates: number;
    apiKeys: number;
  };
};

type CheckoutResponse = {
  url: string;
};

/**
 * `included: false` means the plan does not have this. Restrictions used to be
 * listed as `included: true` — "0 API keys" and "No versioning" rendered with
 * the same green tick as a real benefit, which read as three inclusions on a
 * plan that has one.
 */
const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      { text: '3 templates', included: true },
      { text: 'API keys', included: false },
      { text: 'Version history', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$12',
    period: '/month',
    features: [
      { text: 'Unlimited templates', included: true },
      { text: '5 API keys', included: true },
      { text: '10 versions per template', included: true },
      { text: '10k API calls/month', included: true },
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: '$29',
    period: '/month',
    features: [
      { text: 'Unlimited templates', included: true },
      { text: 'Unlimited API keys', included: true },
      { text: '25 versions per template', included: true },
      { text: '100k API calls/month', included: true },
    ],
  },
];

function BillingContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated');
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Checkout canceled');
    }
  }, [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['billing'],
    queryFn: () => httpGet<PlanInfo>('/api/v1/billing', {}),
  });

  const { mutateAsync: createCheckout, isPending: isCheckoutLoading } = useMutation({
    mutationFn: (plan: 'pro' | 'enterprise') =>
      httpPost<CheckoutResponse>('/api/v1/billing/checkout', { plan }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => toast.error(error?.message || 'Could not start checkout'),
  });

  const { mutateAsync: createPortal, isPending: isPortalLoading } = useMutation({
    mutationFn: () => httpPost<CheckoutResponse>('/api/v1/billing/portal', {}),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => toast.error(error?.message || 'Could not open the billing portal'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="size-5 animate-spin text-faint" />
      </div>
    );
  }

  // Previously a failed query fell through to `plan: 'free'`, so a paying
  // customer was shown their account as free.
  if (isError || !data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Billing" description="Your plan and what you have used." />
        <ErrorState
          description="We could not load your plan. Nothing has changed on your account — this is only a display problem."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const plan = data.plan;
  const usage = data.usage;
  const hasSubscription = plan !== 'free';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing"
        description="Your plan and what you have used."
        actions={
          hasSubscription ? (
            <Button onClick={() => createPortal()} disabled={isPortalLoading}>
              {isPortalLoading ? <Loader2Icon className="animate-spin" /> : null}
              Manage subscription
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile label="Templates" value={usage.templates} />
        <StatTile label="API keys" value={usage.apiKeys} />
      </div>

      <section className="space-y-2.5">
        <h2 className="text-sm font-semibold text-ink">Plans</h2>

        <div className="grid gap-3 lg:grid-cols-3">
          {plans.map((p) => {
            const isCurrentPlan = plan === p.id;
            const isDowngrade = p.id === 'free' && plan !== 'free';
            const isAnotherPaidPlan = p.id !== plan && p.id !== 'free' && plan !== 'free';

            return (
              <Card
                key={p.id}
                inset={false}
                className={cn('p-4', isCurrentPlan && 'border-accent')}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{p.name}</h3>
                  {isCurrentPlan ? <Badge tone="accent">Current plan</Badge> : null}
                </div>

                <p className="mt-1.5 flex items-baseline gap-0.5">
                  <span className="text-2xl font-semibold tabular-nums text-ink">{p.price}</span>
                  <span className="text-sm text-muted">{p.period}</span>
                </p>

                <ul className="mt-4 space-y-1.5">
                  {p.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <CheckIcon className="size-4 shrink-0 text-success-ink" aria-hidden />
                      ) : (
                        <XIcon className="size-4 shrink-0 text-faint" aria-hidden />
                      )}
                      <span className={feature.included ? 'text-ink' : 'text-muted line-through'}>
                        {feature.text}
                      </span>
                      <span className="sr-only">{feature.included ? 'included' : 'not included'}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      Current plan
                    </Button>
                  ) : isDowngrade || isAnotherPaidPlan ? (
                    // Both changes happen in the billing portal. The downgrade
                    // control used to render with no handler at all, so every
                    // path that increased spend worked and this one did nothing.
                    <Button
                      className="w-full"
                      onClick={() => createPortal()}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading ? <Loader2Icon className="animate-spin" /> : null}
                      {isDowngrade ? 'Downgrade' : 'Switch plan'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => createCheckout(p.id as 'pro' | 'enterprise')}
                      disabled={isCheckoutLoading}
                    >
                      {isCheckoutLoading ? <Loader2Icon className="animate-spin" /> : null}
                      Upgrade
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}
