'use client';

import { EmailEditorSandbox } from '~/components/email-editor-sandbox';
export default function PlaygroundClient() {
  return (
    <main className="min-h-screen bg-raised">
      {/* Same gutter as the marketing header above it, so the title sits
          under the brand mark at every width. */}
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Email Editor
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Craft and preview your email templates
          </p>
        </div>
        <EmailEditorSandbox imageUploads={false} autofocus={false} />
      </div>
    </main>
  );
}
