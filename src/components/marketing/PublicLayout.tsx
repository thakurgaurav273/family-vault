import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { isSignedIn } from '../../utils/session';
import { ContactEmail } from './Placeholder';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <a href="/" className={`flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`} aria-label={`${siteConfig.name} home`}>
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
      <ShieldCheck className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
    </span>
    <span className="text-base font-bold tracking-tight text-slate-900">{siteConfig.name}</span>
  </a>
);

const NAV = [
  { href: '/#features', label: 'Features' },
  { href: '/#privacy', label: 'Privacy' },
  { href: '/#about', label: 'About' },
];

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const signedIn = isSignedIn();
  const cta = signedIn ? { href: '/', label: 'Open vault' } : { href: siteConfig.signInPath, label: 'Sign in' };
  const link = 'rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => <a key={n.href} href={n.href} className={link}>{n.label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={cta.href} className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">{cta.label}</a>
          </div>
        </div>
        <nav aria-label="Primary mobile" className="flex justify-center gap-6 border-t border-slate-100 py-2 md:hidden">
          {NAV.map((n) => <a key={n.href} href={n.href} className={link}>{n.label}</a>)}
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">{siteConfig.tagline}</p>
          </div>
          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold text-slate-900">Legal</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href={siteConfig.privacyPath} className="text-slate-600 hover:text-slate-900">Privacy Policy</a></li>
              <li><a href={siteConfig.termsPath} className="text-slate-600 hover:text-slate-900">Terms of Service</a></li>
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
            <p className="mt-3 text-sm text-slate-600"><ContactEmail /></p>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {siteConfig.name}. An invite-only family utility.
        </div>
      </footer>
    </div>
  );
};

export const PrimaryLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
    {children}<ArrowRight className="h-4 w-4" aria-hidden="true" />
  </a>
);
export const SecondaryLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="inline-flex h-12 items-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">{children}</a>
);

/** Shared shell for long-form legal text. */
export const LegalPage: React.FC<{ title: string; intro?: React.ReactNode; toc: { id: string; title: string }[]; children: React.ReactNode }> = ({ title, intro, toc, children }) => (
  <PublicLayout>
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {siteConfig.legalLastUpdated}</p>
        {intro && <div className="mt-5 text-base leading-relaxed text-slate-700">{intro}</div>}
      </header>
      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">On this page</h2>
          <ol className="mt-3 space-y-1.5 text-sm">
            {toc.map((t, i) => (
              <li key={t.id}><a href={`#${t.id}`} className="text-slate-600 hover:text-blue-600">{i + 1}. {t.title}</a></li>
            ))}
          </ol>
        </nav>
        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">{children}</div>
      </div>
    </div>
  </PublicLayout>
);

export const Section: React.FC<{ id: string; n: number; title: string; children: React.ReactNode }> = ({ id, n, title, children }) => (
  <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-b border-slate-100 py-7 first:pt-0 last:border-0 last:pb-0">
    <h2 id={`${id}-h`} className="text-xl font-semibold tracking-tight text-slate-900">{n}. {title}</h2>
    <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>
  </section>
);
