'use client';

import { Suspense } from 'react';
import { CheckIcon, CreditCardIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { httpGet, httpPost } from '~/lib/http';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

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

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      { text: '3 templates', included: true },
      { text: '0 API keys', included: true },
      { text: 'No versioning', included: true },
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
    id: 'scale' as const,
    name: 'Scale',
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
      toast.success('Subscription updated successfully!');
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Checkout was canceled.');
    }
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => httpGet<PlanInfo>('/api/v1/billing', {}),
  });

  const { mutateAsync: createCheckout, isPending: isCheckoutLoading } = useMutation({
    mutationFn: (plan: 'pro' | 'scale') =>
      httpPost<CheckoutResponse>('/api/v1/billing/checkout', { plan }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to start checkout'),
  });

  const { mutateAsync: createPortal, isPending: isPortalLoading } = useMutation({
    mutationFn: () => httpPost<CheckoutResponse>('/api/v1/billing/portal', {}),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to open billing portal'),
  });

  const plan = data?.plan ?? 'free';
  const usage = data?.usage ?? { templates: 0, apiKeys: 0 };
  const hasSubscription = plan !== 'free';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Billing</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Manage your subscription and billing information.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Current Usage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Templates</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{usage.templates}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">API Keys</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{usage.apiKeys}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Plans</h2>
          {hasSubscription && (
            <button
              onClick={() => createPortal()}
              disabled={isPortalLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {isPortalLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Manage Subscription
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((p) => {
            const isCurrentPlan = plan === p.id;
            const isUpgrade = p.id === 'pro' && plan === 'free';
            const isDowngrade = p.id === 'free' && plan !== 'free';
            const isAnotherPlan = p.id !== plan && p.id !== 'free' && plan !== 'free';

            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-6 ${
                  isCurrentPlan
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-400/5'
                    : 'border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]'
                }`}
              >
                {isCurrentPlan && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-medium text-white">
                    Current Plan
                  </span>
                )}

                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{p.price}</span>
                  <span className="text-sm text-gray-500 dark:text-zinc-400">{p.period}</span>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {p.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <CheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <XIcon className="h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600" />
                      )}
                      <span className={feature.included ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-400 dark:text-zinc-500'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400 dark:border-zinc-700 dark:text-zinc-500"
                    >
                      Current Plan
                    </button>
                  ) : isDowngrade ? (
                    <button
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Downgrade
                    </button>
                  ) : isAnotherPlan ? (
                    <button
                      onClick={() => createPortal()}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Switch Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => createCheckout(p.id as 'pro' | 'scale')}
                      disabled={isCheckoutLoading}
                      className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      {isCheckoutLoading ? (
                        <Loader2Icon className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        'Upgrade'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
