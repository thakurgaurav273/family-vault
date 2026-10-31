// Central configuration for the public pages (landing, privacy, terms).
// VITE_* values are public and inlined at BUILD time. Never put secrets here.
const env = import.meta.env;
const clean = (v?: string) => (v && v.trim()) || undefined;

export const siteConfig = {
  name: 'FamilyVault',
  tagline: 'A private space to preserve family memories and important documents.',
  // Set VITE_APP_URL in production; falls back to the current origin.
  url: (clean(env.VITE_APP_URL) ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, ''),
  // Owner-supplied. When unset, the legal pages show a clearly marked placeholder instead of inventing a value.
  supportEmail: clean(env.VITE_SUPPORT_EMAIL),
  operatorName: clean(env.VITE_OPERATOR_NAME),
  privacyPath: '/privacy',
  termsPath: '/terms',
  logoPath: '/logo.svg',
  signInPath: '/auth',
  legalLastUpdated: 'October 31, 2026',
} as const;

export const googleLinks = {
  permissions: 'https://myaccount.google.com/permissions',
  userDataPolicy: 'https://developers.google.com/terms/api-services-user-data-policy',
};
