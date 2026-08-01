/**
 * Guards the email defaults the way check-contrast.ts guards the app tokens.
 *
 * We declare `color-scheme: light` so clients that respect it leave our output
 * alone. Clients that ignore it force an inversion instead, and this asserts
 * the defaults stay readable when that happens.
 *
 * The transform models the CSS filter the preview uses — invert(1) then
 * hue-rotate(180deg) — which is an approximation of an aggressive client
 * transform, not a reproduction of any particular client.
 *
 * Run: bun run check:email-dark
 */
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';

type RGB = { r: number; g: number; b: number };

const toRgb = (hex: string): RGB => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const toHex = (c: RGB) =>
  '#' +
  [c.r, c.g, c.b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('');

/** invert(1) followed by hue-rotate(180deg), per the Filter Effects matrix. */
function forceDark(hex: string): RGB {
  const c = toRgb(hex);
  const r = 255 - c.r;
  const g = 255 - c.g;
  const b = 255 - c.b;
  return {
    r: -0.574 * r + 1.43 * g + 0.144 * b,
    g: 0.426 * r + 0.43 * g + 0.144 * b,
    b: 0.426 * r + 1.43 * g - 0.856 * b,
  };
}

function luminance(c: RGB): number {
  const channel = (raw: number) => {
    const v = Math.min(255, Math.max(0, raw)) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

function contrast(a: RGB, b: RGB): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
}

const theme = DEFAULT_RENDERER_THEME;
const container = theme.container?.backgroundColor ?? '#FFFFFF';

// Text colours the renderer applies over the container. These live in
// engine.tsx's default theme rather than in the shared object.
const CONTENT = {
  heading: '#111827',
  paragraph: '#374151',
  footer: '#64748B',
};

const CHECKS: Array<[string, string, string, number, string]> = [
  ['heading', CONTENT.heading, container, 4.5, 'headings on the container'],
  ['paragraph', CONTENT.paragraph, container, 4.5, 'body copy on the container'],
  ['footer', CONTENT.footer, container, 4.5, 'footer copy on the container'],
  ['link', theme.link?.color ?? '#346FE4', container, 4.5, 'links on the container'],
  [
    'button label',
    theme.button?.color ?? '#FFFFFF',
    theme.button?.backgroundColor ?? '#000000',
    4.5,
    'the button label on its fill',
  ],
];

let failures = 0;

console.log('Email defaults, as sent and after a forced inversion\n');
console.log('  pair                     as sent            forced dark');

for (const [name, fg, bg, min, use] of CHECKS) {
  const asSent = contrast(toRgb(fg), toRgb(bg));
  const dark = contrast(forceDark(fg), forceDark(bg));
  const mark = (r: number) => (r >= min ? 'ok  ' : 'FAIL');
  if (asSent < min || dark < min) failures++;
  console.log(
    `  ${name.padEnd(22)} ${String(asSent).padStart(6)}:1 ${mark(asSent)}  ${String(dark).padStart(6)}:1 ${mark(dark)}   ${use}`,
  );
}

console.log('\n  how the surfaces move');
for (const [label, hex] of [
  ['body', theme.body?.backgroundColor ?? '#F4F4F5'],
  ['container', container],
  ['button fill', theme.button?.backgroundColor ?? '#000000'],
] as const) {
  console.log(`  ${label.padEnd(22)} ${hex}  ->  ${toHex(forceDark(hex))}`);
}

if (failures > 0) {
  console.error(`\n${failures} default(s) stop being readable under a forced inversion.`);
  process.exit(1);
}
console.log('\nEvery default stays readable in both states.');
