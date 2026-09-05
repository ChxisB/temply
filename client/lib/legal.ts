/**
 * The facts the legal pages are written around. One place, so a change of
 * operator, address or law is a one-line edit and both pages agree.
 * Confirm these before launch: the governing law in particular is a
 * placeholder for the operator's own jurisdiction.
 */
export const LEGAL = {
  /** The name the contract is with. */
  operator: 'Temply',
  product: 'Temply',
  site: 'https://temply.app',
  contactEmail: 'hello@temply.app',
  governingLaw: 'England and Wales',
  /** ISO date; shown as "Last updated". Bump it when the text changes. */
  updated: '2026-09-05',
} as const;

/** The services personal data passes through, named so the privacy policy
 *  is honest about who else holds it and why. */
export const PROCESSORS = [
  { name: 'Clerk', purpose: 'sign-in, accounts and team membership', site: 'https://clerk.com' },
  { name: 'Stripe', purpose: 'payments and invoices; card details never reach us', site: 'https://stripe.com' },
  { name: 'Resend', purpose: 'the email we send: test sends from the editor and contact-form delivery', site: 'https://resend.com' },
  { name: 'ImageKit', purpose: 'storing the images you upload for your templates', site: 'https://imagekit.io' },
  { name: 'Sentry', purpose: 'error reports when something in the product breaks', site: 'https://sentry.io' },
] as const;
