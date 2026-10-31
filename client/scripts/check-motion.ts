/**
 * Fails the build when app UI reaches past the motion and shadow tokens.
 *
 * The vocabulary lives in app/globals.css: duration-fast / base / slow and
 * ease-out / in / spring, shadows xs through xl. A numeric duration, an
 * arbitrary curve or a Tailwind shadow that is not on the ladder is a colour
 * outside the token layer by another name — it looks right in one place and
 * drifts everywhere else. The editor core is held to the same vocabulary
 * through its `mly:` prefix, and its own stylesheets may only move on the
 * `--ds-*` variables; tw-animate's `animate-in` family runs on its own 150ms,
 * so a floating surface there takes the overlay classes in globals.css
 * instead. Marketing and the docs demos choreograph their own scenes and are
 * left alone.
 *
 * Run: bun run check:motion
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIENT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['app/(app)', 'app/(auth)', 'components', 'hooks', 'core/editor', 'core/styles'];
const SKIP = ['components/marketing', 'components/docs'];

/** Pattern, and what to reach for instead. Class lists, with or without the editor's prefix. */
const CLASS_RULES: Array<[RegExp, string]> = [
  [/\b(?:mly:)?duration-\d+\b/, 'use duration-fast, duration-base or duration-slow'],
  [/\b(?:mly:)?duration-\[/, 'use duration-fast, duration-base or duration-slow'],
  [/\b(?:mly:)?ease-\[/, 'use ease-out, ease-in or ease-spring'],
  [/cubic-bezier\(/, 'use ease-out, ease-in or ease-spring'],
  [/\b(?:mly:)?shadow-(2xl|inner)\b/, 'shadows run xs through xl, or canvas'],
  [/\b(?:mly:)?(?:animate-(?:in|out)|fade-(?:in|out)-\d+|zoom-(?:in|out)-\d+|slide-(?:in|out)-(?:from|to)-)/, 'use overlay-fade or overlay-panel from globals.css'],
];

/** A stylesheet's transition or animation declaration must move on the tokens. */
const CSS_RULES: Array<[RegExp, string]> = [
  [/\b\d+(?:\.\d+)?m?s\b/, 'use var(--ds-motion-fast), -base or -slow'],
  [/cubic-bezier\(/, 'use var(--ds-ease-out), -in or -spring'],
  [/(?:^|[\s,])(?:ease(?:-in(?:-out)?|-out)?|linear)(?=[\s,;])/, 'use var(--ds-ease-out), -in or -spring'],
];
const CSS_DECLARATION = /^\s*(?:transition|animation)(?:-duration|-timing-function|-delay)?\s*:/;

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(?:tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) yield path;
  }
}

let failures = 0;
for (const root of ROOTS) {
  for (const file of walk(join(CLIENT, root))) {
    const rel = relative(CLIENT, file);
    if (SKIP.some((s) => rel.startsWith(s))) continue;
    const css = file.endsWith('.css');
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (css && !CSS_DECLARATION.test(line)) return;
      for (const [pattern, fix] of css ? CSS_RULES : CLASS_RULES) {
        const hit = pattern.exec(line);
        if (hit) {
          failures += 1;
          console.log(`  FAIL  ${rel}:${i + 1}  ${hit[0].trim()} — ${fix}`);
        }
      }
    });
  }
}

if (failures > 0) {
  console.log(`\n${failures} place${failures === 1 ? '' : 's'} move${failures === 1 ? 's' : ''} outside the motion tokens.`);
  process.exit(1);
}
console.log('Every transition and shadow in the app UI and the editor sits on a token.');
