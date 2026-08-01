import { useEffect, type RefObject, useRef } from 'react';
import { MailOpenIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '~/lib/classname';
import { Button } from './ui/button';

type EmailPreviewIFrameProps = {
  innerHTML: string;
  isServer?: boolean;
  showOpenInNewTab?: boolean;
  wrapperClassName?: string;
  /** Render the email the way a client that forces dark mode would. */
  forceDark?: boolean;
} & React.HTMLProps<HTMLIFrameElement>;

/**
 * Approximates an aggressive client-side dark-mode transform. It is not a
 * reproduction of any particular email client — different clients invert,
 * blend, or leave the message alone, and several ignore CSS entirely. This is
 * the worst case: if a design survives here, the gentler transforms are safe.
 *
 * The counter-filter on media matters. Without it every image renders as a
 * negative, which would make the preview lie in the other direction.
 */
const FORCE_DARK_STYLE = `
  html {
    filter: invert(1) hue-rotate(180deg);
    background-color: #ffffff;
  }
  img, video, picture, svg, [style*="background-image"] {
    filter: invert(1) hue-rotate(180deg);
  }
`;

function renderHTMLToIFrame(
  ref: RefObject<HTMLIFrameElement | null>,
  html: string,
  forceDark = false
) {
  if (!ref || !ref?.current) {
    return;
  }

  const doc = ref.current.contentDocument;
  if (!doc) {
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
        ${forceDark ? `<style>${FORCE_DARK_STYLE}</style>` : ''}
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  doc.close();
}

export function EmailPreviewIFrame(props: EmailPreviewIFrameProps) {
  const {
    innerHTML,
    isServer,
    showOpenInNewTab = true,
    wrapperClassName,
    forceDark = false,
    ...defaultProps
  } = props;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || isServer) {
      return;
    }

    renderHTMLToIFrame(iframeRef, innerHTML, forceDark);
  }, [innerHTML, iframeRef, isServer, forceDark]);

  function handleOpen() {
    if (innerHTML.trim().length === 0) {
      toast.error('There is no data to preview.');
      return;
    }

    const newWindow = window.open('about:blank', '_blank');
    newWindow?.focus();

    const newDoc = newWindow?.document;
    if (!newDoc) {
      toast.error('Something went wrong.');
      return;
    }

    newDoc.open();
    newDoc.write(innerHTML);
    newDoc.close();
  }

  return (
    <div className={cn('relative', wrapperClassName)}>
      <iframe
        title="Email preview"
        {...defaultProps}
        onLoad={() => {
          if (isServer) {
            return;
          }

          renderHTMLToIFrame(iframeRef, innerHTML, forceDark);
        }}
        ref={iframeRef}
        srcDoc={isServer ? innerHTML : ''}
      />

      {showOpenInNewTab ? (
        <Button
          className="absolute right-0 bottom-0 h-8 gap-1.5 rounded-none rounded-tl-md border-t border-l border-line text-sm font-normal"
          onClick={handleOpen}
          type="button"
          variant="secondary"
        >
          <MailOpenIcon className="h-3.5 w-3.5 shrink-0" />
          <span>Open in new tab</span>
        </Button>
      ) : null}
    </div>
  );
}
