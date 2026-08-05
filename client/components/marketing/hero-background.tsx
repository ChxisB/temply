/** The hero's indigo glow. Purely decorative, so it is aria-hidden and sits
 *  behind the content. The dot texture that used to live here moved to the
 *  page-wide fixed field in page.tsx — two dot layers moving against each
 *  other during scroll produced moiré, so the hero keeps only the light. */
export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-[-10%] h-[520px] w-[920px] -translate-x-1/2 rounded-full opacity-85 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in oklab, var(--ds-accent) 60%, transparent), transparent 70%)',
        }}
      />
    </div>
  );
}
