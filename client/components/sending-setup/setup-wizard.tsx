'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  RotateCcwIcon,
  SendIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Badge, Card } from '~/components/ui/surfaces';
import { httpPost } from '~/lib/http';
import { cn } from '~/lib/classname';
import {
  domainDone,
  sendingStatusQueryOptions,
  stageOne,
} from './sending-status';

// Named where the user actually goes. Resend is the only provider, so we say so
// plainly — no logo, no pitch, just the link that gets them to the right page.
const RESEND = {
  signup: 'https://resend.com/signup',
  keys: 'https://resend.com/api-keys',
  domains: 'https://resend.com/domains',
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-sm font-medium text-accent-ink underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="size-3.5" />
    </a>
  );
}

function StepRow({
  n,
  title,
  done,
  skipped,
  owner,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  skipped?: boolean;
  owner?: 'temply';
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2Icon className="size-5 text-accent-ink" />
        ) : skipped ? (
          <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-line text-2xs text-faint">
            –
          </span>
        ) : (
          <span className="flex size-5 items-center justify-center rounded-full border border-line text-2xs font-semibold text-muted">
            {n}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium', done ? 'text-muted' : 'text-ink')}>{title}</p>
          {owner === 'temply' ? <Badge tone="accent">In Temply</Badge> : null}
        </div>
        {children ? <div className="mt-2">{children}</div> : null}
      </div>
    </li>
  );
}

function pluralSteps(n: number) {
  return `${n} step${n === 1 ? '' : 's'}`;
}

export function SetupWizard() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: status, isLoading, isError, refetch, isFetching } = useQuery(
    sendingStatusQueryOptions()
  );

  const s1 = stageOne(status);
  const domainReady = domainDone(status);

  const [keyInput, setKeyInput] = useState('');
  const [showKeyField, setShowKeyField] = useState(false);
  const [testTo, setTestTo] = useState('');

  // Default the test recipient to the signed-in address, but leave it editable
  // — the onboarding sender only delivers to the Resend account's own email,
  // which may differ from the Temply login.
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) setTestTo((prev) => prev || email);
  }, [user]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['sending-status'] });

  const saveKey = useMutation({
    mutationFn: () =>
      httpPost('/api/v1/config', { provider: 'resend', apiKey: keyInput.trim() }),
    onSuccess: () => {
      setKeyInput('');
      setShowKeyField(false);
      queryClient.invalidateQueries({ queryKey: ['api-key-config'] });
      invalidate();
      toast.success('Key connected');
    },
    onError: (e: any) => toast.error(e?.message || 'Could not save the key'),
  });

  const sendTest = useMutation({
    mutationFn: () => httpPost('/api/v1/emails/send-test', { to: testTo.trim() }),
    onSuccess: () => {
      invalidate();
      toast.success('Test email sent — check your inbox');
    },
    onError: (e: any) =>
      toast.error(e?.message || 'Could not send the test. Check the address and key.'),
  });

  const setup = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      httpPost('/api/v1/sending/setup', payload),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message || 'Could not update the checklist'),
  });

  const heading = isLoading
    ? 'Set up sending'
    : !s1.ready
      ? `${pluralSteps(s1.total - s1.done)} to send your first Temply email`
      : !domainReady
        ? 'One step left to send to your customers'
        : "You're all set to send";

  const subheading = !s1.ready
    ? 'Connect a sending account, then send yourself a test to prove it works.'
    : !domainReady
      ? 'You can already send test emails. Verify your own domain to send from your own address.'
      : 'Your sending is connected and your domain is verified.';

  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{heading}</h1>
        <p className="mt-0.5 text-sm text-muted">{subheading}</p>
      </div>

      {isError ? (
        <Card className="bg-danger-wash">
          <p className="text-sm font-medium text-danger-ink">Could not load your setup status</p>
          <p className="mt-0.5 text-sm text-muted">This does not change anything you already connected.</p>
          <Button className="mt-3" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      ) : (
        <>
          {/* Stage 1 — send your first email */}
          <Card>
            <div className="flex items-center gap-2">
              <SendIcon className="size-4 text-muted" />
              <h2 className="text-sm font-semibold text-ink">Send your first email</h2>
              {s1.ready ? <Badge tone="success">Done</Badge> : (
                <span className="ml-auto text-xs text-muted tabular-nums">{s1.done}/{s1.total}</span>
              )}
            </div>

            <ul className="mt-3 divide-y divide-line">
              <StepRow n={1} title="Create your Resend account" done={s1.account}>
                {!s1.account ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <ExtLink href={RESEND.signup}>Sign up at Resend</ExtLink>
                    <Button
                      size="sm"
                      onClick={() => setup.mutate({ account: true })}
                      disabled={setup.isPending}
                    >
                      Mark as done
                    </Button>
                  </div>
                ) : null}
              </StepRow>

              <StepRow n={2} title="Get your API key" done={s1.key}>
                {!s1.key ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <ExtLink href={RESEND.keys}>Open your Resend API keys</ExtLink>
                    <Button
                      size="sm"
                      onClick={() => setup.mutate({ key: true })}
                      disabled={setup.isPending}
                    >
                      Mark as done
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Copy the key that starts with <code className="rounded-xs bg-hover px-1 py-0.5 font-mono text-xs">re_</code></p>
                )}
              </StepRow>

              <StepRow n={3} title="Paste your key into Temply" done={s1.pasted} owner="temply">
                {s1.pasted && !showKeyField ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-success-ink">
                      <CheckCircle2Icon className="size-4" /> Connected
                    </span>
                    <button
                      type="button"
                      className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                      onClick={() => setShowKeyField(true)}
                    >
                      Update key
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (keyInput.trim()) saveKey.mutate();
                    }}
                  >
                    <input
                      type="password"
                      spellCheck={false}
                      placeholder="re_..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="h-8 w-56 rounded-sm border border-line bg-raised px-2.5 text-sm text-ink placeholder:text-faint"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={!keyInput.trim() || saveKey.isPending}
                    >
                      {saveKey.isPending ? <Loader2Icon className="animate-spin" /> : null}
                      Save key
                    </Button>
                    {showKeyField ? (
                      <button
                        type="button"
                        className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                        onClick={() => {
                          setShowKeyField(false);
                          setKeyInput('');
                        }}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </form>
                )}
              </StepRow>

              <StepRow n={4} title="Send a test to yourself" done={s1.tested} owner="temply">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={testTo}
                      onChange={(e) => setTestTo(e.target.value)}
                      className="h-8 w-56 rounded-sm border border-line bg-raised px-2.5 text-sm text-ink placeholder:text-faint disabled:opacity-50"
                      disabled={!s1.pasted}
                    />
                    <Button
                      variant={s1.tested ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => testTo.trim() && sendTest.mutate()}
                      disabled={!s1.pasted || !testTo.trim() || sendTest.isPending}
                    >
                      {sendTest.isPending ? <Loader2Icon className="animate-spin" /> : null}
                      {s1.tested ? 'Send again' : 'Send test email'}
                    </Button>
                  </div>
                  {!s1.pasted ? (
                    <p className="text-xs text-faint">Connect your key first.</p>
                  ) : s1.tested && status?.testSentAt ? (
                    <p className="text-xs text-muted">
                      Last sent {new Date(status.testSentAt).toLocaleString()}. Sent from Resend's shared address — verify your domain to send from your own.
                    </p>
                  ) : (
                    <p className="text-xs text-muted">Goes to the email you signed up to Resend with.</p>
                  )}
                </div>
              </StepRow>
            </ul>
          </Card>

          {/* Stage 2 — send to your customers */}
          <Card>
            <div className="flex items-center gap-2">
              <GlobeIcon className="size-4 text-muted" />
              <h2 className="text-sm font-semibold text-ink">Send to your customers</h2>
              {status?.domain?.verified ? (
                <Badge tone="success">Verified</Badge>
              ) : status?.domainSkipped ? (
                <Badge tone="neutral">Skipped</Badge>
              ) : (
                <Badge tone="neutral">Optional</Badge>
              )}
            </div>

            <ul className="mt-3 divide-y divide-line">
              <StepRow
                n={5}
                title="Verify your own domain"
                done={Boolean(status?.domain?.verified)}
                skipped={status?.domainSkipped && !status?.domain?.verified}
              >
                <div className="space-y-2">
                  {status?.domainError ? (
                    <p className="text-sm text-danger-ink">
                      Couldn't check your domain: {status.domainError}
                    </p>
                  ) : status?.domain?.verified ? (
                    <p className="text-sm text-success-ink">
                      {status.domain.name} is verified. You can send from your own address.
                    </p>
                  ) : status?.domain ? (
                    <p className="text-sm text-muted">
                      {status.domain.name} is <span className="font-medium text-ink">{status.domain.status}</span> — its DNS records aren't confirmed yet.
                    </p>
                  ) : (
                    <p className="text-sm text-muted">
                      No domain added yet. Add one in Resend and copy its DNS records into your domain host.
                    </p>
                  )}

                  {status?.domainSkipped && !status?.domain?.verified ? (
                    <p className="text-xs text-faint">
                      Skipped for now — you can still send test emails. Verify your domain when you're ready to email real customers from your own address.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <ExtLink href={RESEND.domains}>
                      {status?.domain ? 'Finish in Resend' : 'Add your domain in Resend'}
                    </ExtLink>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                    >
                      {isFetching ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
                      Refresh status
                    </button>
                    {!status?.domain?.verified ? (
                      status?.domainSkipped ? (
                        <button
                          type="button"
                          onClick={() => setup.mutate({ domainSkipped: false })}
                          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                        >
                          Undo skip
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setup.mutate({ domainSkipped: true })}
                          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                        >
                          Skip for now
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </StepRow>
            </ul>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {status?.dismissed ? (
              <button
                type="button"
                onClick={() => {
                  setup.mutate({ dismissed: false });
                  toast.success('Reminders back on');
                }}
                className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                <BellIcon className="size-3.5" />
                Show reminders
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setup.mutate({ dismissed: true });
                  toast.success('Reminders hidden — reopen any time from Get sending');
                }}
                className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                <CheckCircle2Icon className="size-3.5" />
                I've got it — hide reminders
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset the checklist? This clears what you marked done. Your key and verified domain stay connected.')) {
                  setup.mutate({ reset: true });
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              <RotateCcwIcon className="size-3.5" />
              Reset checklist
            </button>
          </div>
        </>
      )}
    </div>
  );
}
