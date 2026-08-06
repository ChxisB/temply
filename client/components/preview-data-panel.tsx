'use client';

import type { TemplateDataKeys } from '@temply/shared/template-data';

/**
 * The data a preview should render with.
 *
 * Conditions are booleans keyed by "Show if" name; variables are the text a
 * `{{pill}}` resolves to. A variable left empty is omitted from the payload
 * entirely, so it keeps passing through as `{{name}}` the way an unrendered
 * template does.
 */
export type PreviewData = {
  conditions: Record<string, boolean>;
  variables: Record<string, string>;
};

/** Every condition starts on, so the first preview is the complete email. */
export function initialPreviewData(keys: TemplateDataKeys): PreviewData {
  return {
    conditions: Object.fromEntries(keys.conditions.map((key) => [key, true])),
    variables: Object.fromEntries(keys.variables.map((key) => [key, ''])),
  };
}

/** Flattens the panel state into the payload the renderer reads. */
export function toPayload(data: PreviewData): Record<string, unknown> {
  const filledVariables = Object.entries(data.variables).filter(([, value]) => value !== '');
  return { ...data.conditions, ...Object.fromEntries(filledVariables) };
}

export function PreviewDataPanel({
  keys,
  data,
  onChange,
}: {
  keys: TemplateDataKeys;
  data: PreviewData;
  onChange: (next: PreviewData) => void;
}) {
  if (keys.conditions.length === 0 && keys.variables.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-line bg-raised p-3">
      <div>
        <p className="text-sm font-medium text-ink">Preview data</p>
        <p className="text-xs text-muted">
          The values your app would send. Nothing here is saved with the template.
        </p>
      </div>

      {keys.conditions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-2xs font-medium tracking-wide text-faint uppercase">Conditions</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {keys.conditions.map((key) => (
              <label key={key} className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={data.conditions[key] ?? true}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      conditions: { ...data.conditions, [key]: event.target.checked },
                    })
                  }
                  className="size-3.5 accent-accent"
                />
                <span className="font-mono text-xs">{key}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {keys.variables.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-2xs font-medium tracking-wide text-faint uppercase">Variables</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {keys.variables.map((key) => (
              <label key={key} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate font-mono text-xs text-muted">{key}</span>
                <input
                  type="text"
                  value={data.variables[key] ?? ''}
                  placeholder={`{{${key}}}`}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      variables: { ...data.variables, [key]: event.target.value },
                    })
                  }
                  className="h-7 min-w-0 flex-1 rounded-xs border border-line bg-raised px-2 text-sm text-ink placeholder:text-faint"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
