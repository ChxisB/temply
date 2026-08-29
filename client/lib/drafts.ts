/**
 * Unsaved editor work, kept in the browser.
 *
 * Deliberately not on the server: the public render API serves the template
 * row, so autosaving into it would hand a half-finished email to whatever
 * backend asked for one. The row keeps meaning "the version its author
 * published"; everything between saves lives here.
 */

export type Draft = {
  subject: string;
  previewText: string;
  fromName: string;
  replyTo: string;
  /** The editor's JSON. */
  content: unknown;
  /** RendererThemeOptions. */
  theme: unknown;
  /** When this draft was written, as epoch milliseconds. */
  savedAt: number;
};

/**
 * The playground has no template row, so it stores its draft under this fixed
 * key. Safe from collision because real template ids come from
 * crypto.randomUUID(); two playground tabs sharing it (last writer wins) is
 * accepted.
 */
export const PLAYGROUND_DRAFT_ID = 'playground';

const key = (templateId: string) => `temply:draft:${templateId}`;

/**
 * Every entry point swallows its own failures. Storage throws for reasons that
 * have nothing to do with the draft — a full quota, private browsing, a policy
 * that blocks it — and none of them are a reason to take the editor down.
 */
export function readDraft(templateId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key(templateId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // A hand-edited or half-written entry is worse than none: whatever this
    // returns goes straight into the editor and the theme panel, so every
    // field is checked, not just the timestamp.
    if (typeof parsed !== 'object' || parsed === null) return null;
    const d = parsed as Record<string, unknown>;
    const isRecord = (v: unknown) => typeof v === 'object' && v !== null;
    if (typeof d.savedAt !== 'number') return null;
    if (
      typeof d.subject !== 'string' ||
      typeof d.previewText !== 'string' ||
      typeof d.fromName !== 'string' ||
      typeof d.replyTo !== 'string'
    ) {
      return null;
    }
    if (!isRecord(d.content) || !isRecord(d.theme)) return null;
    return d as Draft;
  } catch {
    return null;
  }
}

export function writeDraft(templateId: string, draft: Draft): void {
  try {
    window.localStorage.setItem(key(templateId), JSON.stringify(draft));
  } catch {
    // Nothing to tell the author: the alternative to a stored draft is the
    // behaviour they already had.
  }
}

export function clearDraft(templateId: string): void {
  try {
    window.localStorage.removeItem(key(templateId));
  } catch {
    // Ignored for the same reason.
  }
}

/** Whether a draft holds work the saved row does not. */
export function isNewerThan(draft: Draft, updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return true;
  const rowSavedAt = new Date(updatedAt).getTime();
  return Number.isFinite(rowSavedAt) ? draft.savedAt > rowSavedAt : true;
}
