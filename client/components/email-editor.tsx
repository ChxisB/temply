import type { FocusPosition, Editor as TiptapEditor } from '@tiptap/core';
import { Loader2Icon } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { cn } from '~/lib/classname';
import type { Mail } from '~/db/schema';

const Editor = lazy(() =>
  import('~/core').then((module) => ({
    default: module.Editor,
  }))
);

type EmailEditorProps = {
  defaultContent: Mail['content'];
  setEditor: (editor: TiptapEditor) => void;
  autofocus?: FocusPosition;
  onImageUpload?: (file: Blob) => Promise<string>;
  allowedMimeTypes?: string[];
};

export function EmailEditor(props: EmailEditorProps) {
  const { defaultContent, setEditor, autofocus, onImageUpload, allowedMimeTypes } = props;

  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && (
        <div className="flex w-full items-center justify-center py-10">
          <Loader2Icon className="h-8 w-8 animate-spin stroke-[2.5] text-muted" />
        </div>
      )}

      <Suspense>
        <Editor
          onImageUpload={onImageUpload}
          allowedMimeTypes={allowedMimeTypes}
          config={{
            hasMenuBar: false,
            wrapClassName: cn('editor-wrap', isLoading && 'hidden'),
            bodyClassName: '!mt-0 !border-0 !p-0',
            contentClassName: `editor-content mx-auto max-w-[calc(600px+80px)]! px-10! pt-10! pb-10!`,
            toolbarClassName: 'flex-wrap !items-start',
            spellCheck: false,
            autofocus,
            immediatelyRender: false,
          }}
          contentJson={
            defaultContent
              ? typeof defaultContent === 'string'
                ? JSON.parse(defaultContent)
                : defaultContent
              : null
          }
          onCreate={(editor) => {
            setIsLoading(false);
            setEditor(editor);
          }}
          onUpdate={(editor) => {
            setEditor(editor);
          }}
        />
      </Suspense>
    </>
  );
}
