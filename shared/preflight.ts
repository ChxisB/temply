/**
 * Preflight: the checks a test send or export runs against the editor state.
 *
 * Everything here is pure so both the panel and its tests can run the same
 * code. The editor JSON is the source of truth for links — the renderer
 * substitutes '#' for an empty href (engine.tsx), so by the time HTML exists
 * a deliberate '#' and a forgotten one look identical.
 */

import type { TemplateDataKeys } from './template-data';

export type PreflightIssue = {
  id: string;
  severity: 'error' | 'warn';
  message: string;
  detail?: string;
};

/** Gmail clips messages whose HTML exceeds ~102KB; warn while approaching. */
export const GMAIL_CLIP_BYTES = 102 * 1024;
export const SIZE_WARN_BYTES = 90 * 1024;

type Mark = {
  type?: string;
  attrs?: Record<string, unknown> | null;
};

/** Same document shape template-data.ts walks, plus text and marks. */
type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  marks?: Mark[] | null;
  content?: Node[] | null;
};

/**
 * The subject gates the send route itself (it rejects an empty one), so an
 * empty subject is an error here rather than a surprise 400 there. Preview
 * text is only inbox polish — a warning.
 */
export function checkFields(subject: string, previewText: string): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  if (!subject.trim()) {
    issues.push({
      id: 'subject-empty',
      severity: 'error',
      message: 'The subject is empty — the send needs one.',
    });
  }
  if (!previewText.trim()) {
    issues.push({
      id: 'preview-text-empty',
      severity: 'warn',
      message: 'No preview text — inboxes will show the first line of the email instead.',
    });
  }
  return issues;
}

/**
 * mailto: and tel: are fine destinations the URL constructor also accepts;
 * they are named here so nobody "tightens" the check into rejecting them.
 * Everything else must parse as an absolute URL — 'example.com' without a
 * protocol throws, which is exactly the mistake worth catching before send.
 */
function urlProblem(url: string): 'empty' | 'invalid' | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return 'empty';
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return null;
  try {
    new URL(trimmed);
    return null;
  } catch {
    return 'invalid';
  }
}

/**
 * One walk over the document for everything content-shaped: link
 * destinations and image alt text. Variable URLs ({{url}} pills) are exempt
 * everywhere — they resolve at render time from the payload.
 */
export function collectContentFindings(content: unknown): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  // A link mark spanning styled and plain text splits into several text
  // nodes carrying the same mark; a contiguous run is one link and reports
  // once. The run ends at the first node without the mark, so three separate
  // "#" anchors in a paragraph are three findings, not one.
  let runHref: string | null = null;
  let counter = 0;

  const linkIssue = (
    kind: string,
    problem: 'empty' | 'invalid',
    url: string,
    subject: string,
    emptyMessage: string,
    detail?: string,
  ) => {
    issues.push({
      id: `${kind}-${counter++}`,
      severity: 'error',
      message:
        problem === 'empty' ? emptyMessage : `${subject} URL doesn't parse: "${url.trim()}"`,
      detail,
    });
  };

  const walk = (node: Node | null | undefined) => {
    if (!node || typeof node !== 'object') return;
    const attrs = node.attrs ?? {};

    const linkMark = (node.marks ?? []).find((mark) => mark.type === 'link');
    if (linkMark) {
      const href = typeof linkMark.attrs?.href === 'string' ? linkMark.attrs.href : '';
      if (href !== runHref) {
        runHref = href;
        if (!linkMark.attrs?.isUrlVariable) {
          const problem = urlProblem(href);
          if (problem) {
            linkIssue(
              'link',
              problem,
              href,
              "A link's",
              'A link in the text has no destination yet.',
              node.text,
            );
          }
        }
      }
    } else {
      runHref = null;
    }

    if (node.type === 'button' && !attrs.isUrlVariable) {
      const url = typeof attrs.url === 'string' ? attrs.url : '';
      const problem = urlProblem(url);
      if (problem) {
        linkIssue(
          'button',
          problem,
          url,
          "A button's",
          'A button has no URL yet.',
          typeof attrs.text === 'string' ? attrs.text : undefined,
        );
      }
    }

    if (node.type === 'linkCard') {
      const link = typeof attrs.link === 'string' ? attrs.link : '';
      const problem = urlProblem(link);
      if (problem) {
        linkIssue(
          'link-card',
          problem,
          link,
          "A link card's",
          'A link card has no URL yet.',
          typeof attrs.title === 'string' ? attrs.title : undefined,
        );
      }
    }

    if (node.type === 'image' || node.type === 'inlineImage') {
      // An empty externalLink is a plain, unlinked image — only a non-empty
      // one that fails to parse is a mistake.
      const externalLink = typeof attrs.externalLink === 'string' ? attrs.externalLink : '';
      if (externalLink.trim() && !attrs.isExternalLinkVariable && urlProblem(externalLink) === 'invalid') {
        linkIssue('image-link', 'invalid', externalLink, "An image link's", '');
      }

      // The renderer falls back alt || title, so either one covers screen
      // readers and image-blocking clients; the logo node supplies its own.
      const alt = typeof attrs.alt === 'string' ? attrs.alt.trim() : '';
      const title = typeof attrs.title === 'string' ? attrs.title.trim() : '';
      if (!alt && !title) {
        issues.push({
          id: `image-alt-${counter++}`,
          severity: 'warn',
          message: 'An image has no alt text — clients that block images show nothing in its place.',
        });
      }
    }

    for (const child of node.content ?? []) walk(child);
  };

  walk(content as Node);
  return issues;
}

/**
 * Variable pills whose preview value is missing or empty. toPayload drops
 * empty values, so these render as literal {{name}} in a send — usually a
 * value nobody typed, occasionally deliberate, hence surfaced not blocked.
 */
export function unresolvedVariables(
  keys: TemplateDataKeys,
  values: Record<string, string>,
): string[] {
  return keys.variables.filter((key) => !values[key]);
}

/**
 * The as-sent HTML measured in bytes. Copy stays on the right side of
 * certainty: near the mark is "approaching", past it states where Gmail's
 * documented limit sits — clipping is the client's call, not ours.
 */
export function assessSize(bytes: number): PreflightIssue | null {
  const kb = Math.round(bytes / 1024);
  if (bytes >= GMAIL_CLIP_BYTES) {
    return {
      id: 'size-over',
      severity: 'error',
      message: `The email is ~${kb} KB — past the 102 KB mark where Gmail clips messages.`,
    };
  }
  if (bytes >= SIZE_WARN_BYTES) {
    return {
      id: 'size-near',
      severity: 'warn',
      message: `The email is ~${kb} KB — approaching the 102 KB mark where Gmail clips messages.`,
    };
  }
  return null;
}
