'use client';

import { useRef, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { TemplateActions } from '~/components/dashboard/template-actions';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { EmptyState } from '~/components/ui/surfaces';
import { filterTemplates, type TemplateListItem } from '~/lib/template-search';

type TemplateListProps = {
  /** Already ordered by the API (most recently updated first) — never re-sort. */
  templates: TemplateListItem[];
  canDuplicate: boolean;
};

export function TemplateList({ templates, canDuplicate }: TemplateListProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = filterTemplates(templates, query);

  // Both clear controls unmount themselves on click; without this, keyboard
  // focus falls back to <body> and a keyboard user re-tabs from the top.
  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates…"
          aria-label="Search templates"
          // WebKit draws its own × on search inputs; suppress it so ours is
          // the only clear control.
          className="pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={clearSearch}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <XIcon />
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No templates match"
          description={`Nothing matches “${query.trim()}”. Try a different title, preview text, or short code.`}
          action={
            <Button variant="secondary" onClick={clearSearch}>
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-raised">
          {filtered.map((template) => (
            <li
              key={template.id}
              className="group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-hover"
            >
              <Link href={`/templates/${template.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink group-hover:text-accent-ink">
                  {template.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {template.preview_text || 'No preview text'}
                </p>
              </Link>

              {template.updated_at ? (
                <span className="hidden shrink-0 text-xs text-muted tabular-nums sm:block">
                  {new Date(template.updated_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              ) : null}

              <TemplateActions templateId={template.id} canDuplicate={canDuplicate} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
