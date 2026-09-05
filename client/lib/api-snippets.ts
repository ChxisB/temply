import { publicRenderPath, publicTemplatePath } from '@temply/shared/api';
import { SITE_URL } from './site';

/** Where the API lives, as integrators will type it. */
export const API_ORIGIN = SITE_URL;

export type SnippetLanguage = 'curl' | 'javascript' | 'python' | 'ruby';

export const SNIPPET_LANGUAGES: { id: SnippetLanguage; label: string }[] = [
  { id: 'curl', label: 'curl' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'ruby', label: 'Ruby' },
];

const KEY = 'tply_live_…';
const DATA = { firstName: 'Ada', isMember: true };

/**
 * One render call per language, built from the shared path helpers so the
 * docs cannot show a URL the server does not answer. Kept deliberately plain
 * — the standard HTTP client of each language, no SDK, no wrapper.
 */
export function renderSnippets(shortCode: string): Record<SnippetLanguage, string> {
  const url = `${API_ORIGIN}${publicRenderPath(shortCode)}`;
  const data = JSON.stringify({ data: DATA });
  return {
    curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '${data}'`,
    javascript: `const res = await fetch("${url}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${KEY}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify({ data: DATA }, null, 2).replace(/\n/g, '\n  ')}),
});
const { html, text } = await res.json();`,
    python: `import requests

res = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${KEY}"},
    json={"data": {"firstName": "Ada", "isMember": True}},
)
html = res.json()["html"]`,
    ruby: `require "net/http"
require "json"

uri = URI("${url}")
req = Net::HTTP::Post.new(uri, {
  "Authorization" => "Bearer ${KEY}",
  "Content-Type" => "application/json",
})
req.body = { data: { firstName: "Ada", isMember: true } }.to_json
res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
html = JSON.parse(res.body)["html"]`,
  };
}

/** The metadata call, curl only — it is a one-liner in every language. */
export function metaSnippet(shortCode: string): string {
  return `curl -H "Authorization: Bearer ${KEY}" \\
  ${API_ORIGIN}${publicTemplatePath(shortCode)}`;
}
