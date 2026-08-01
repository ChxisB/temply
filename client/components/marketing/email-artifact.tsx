/**
 * The hero is the thing itself: an email at the width every email is bound to,
 * sitting on the same workbench the editor uses. It is static markup, not the
 * editor — mounting the real editor here would have taken this route from
 * ~107 kB to ~407 kB to show something that never changes.
 *
 * The canvas is white in both themes because that is how a mail client renders
 * it. That is the whole premise of the design: bench and artifact.
 */
export function EmailArtifact() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-8">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-mono text-2xs tracking-wide text-faint uppercase">
          Container 600px
        </span>
        <span className="font-mono text-2xs text-faint">tpl_welcome_01</span>
      </div>

      <div
        className="mx-auto w-full max-w-[600px] overflow-hidden rounded-lg bg-canvas shadow-canvas"
        // The artifact is theme-invariant, so its text colour has to be too.
        style={{ color: 'var(--ds-canvas-ink)' }}
      >
        <div className="px-10 py-10">
          <div className="flex size-8 items-center justify-center rounded-md bg-[#12141a] text-sm font-semibold text-white">
            T
          </div>

          <h2 className="mt-7 text-2xl font-semibold tracking-tight">Your API key is ready</h2>

          <p className="mt-3 text-base leading-relaxed text-[#4a5160]">
            Hi Sam — the key you asked for is active. Drop it into your server
            environment and your first send will go out on the next deploy.
          </p>

          <div className="mt-5 rounded-md bg-[#f4f5f7] px-4 py-3 font-mono text-sm text-[#12141a]">
            tply_live_8f2c…9d41
          </div>

          {/* Deliberately not a link: this is a depiction of an email, and a
              button here that did nothing would be a small lie. */}
          <span className="mt-6 inline-flex h-10 items-center rounded-md bg-[#346fe4] px-6 text-sm font-medium text-white">
            Open the dashboard
          </span>

          <p className="mt-8 border-t border-[#e8eaee] pt-5 text-sm text-[#767d8c]">
            You are receiving this because you created a key on Temply.
          </p>
        </div>
      </div>
    </div>
  );
}
