'use client';

import { EmailEditorSandbox } from '~/components/email-editor-sandbox';
export default function PlaygroundClient() {
  return (
    <main className="min-h-screen bg-raised">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Email Editor
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Craft and preview your email templates
          </p>
        </div>
        <EmailEditorSandbox showSaveButton={false} autofocus={false} />
      </div>
    </main>
  );
}
