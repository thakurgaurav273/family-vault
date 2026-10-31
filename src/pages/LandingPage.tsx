import React from 'react';
import { Archive, FileText, FolderTree, HardDrive, Image as ImageIcon, KeyRound, Lock, Users, Video } from 'lucide-react';
import { PublicLayout, PrimaryLink, SecondaryLink } from '../components/marketing/PublicLayout';
import { usePageMeta } from '../hooks/usePageMeta';
import { googleLinks, siteConfig } from '../config/site';

// Only features that exist in the app today (photos/videos/documents, folders, categories, search,
// per-file visibility, invite-only members, Google Drive storage).
const FEATURES = [
  { icon: Archive, title: 'Family Archive', text: 'Keep your family’s memories together in one shared, organized space instead of scattered across phones and inboxes.' },
  { icon: ImageIcon, title: 'Photo, Video & Document Storage', text: 'Preserve photographs, videos and important documents such as IDs, bills and records.' },
  { icon: HardDrive, title: 'Google Drive Integration', text: 'Files are saved to the Google Drive account the family owner connects. FamilyVault only works with files it creates there.' },
  { icon: Users, title: 'Private Family Access', text: 'Invite-only. The owner invites relatives by email, and each person signs in with their own PIN. Each file can be shared with the family, admins only, or kept private.' },
  { icon: FolderTree, title: 'Simple Organization', text: 'Browse by photos, videos and documents, sort files into folders and categories, and search to find them again.' },
];

const STEPS = [
  { title: 'The owner creates the vault', text: 'One family member sets up the FamilyVault with an email and password.' },
  { title: 'Connect Google Drive', text: 'The owner authorizes limited Google Drive access. FamilyVault creates its own folder there.' },
  { title: 'Invite family & upload', text: 'Relatives are invited by email and sign in with a 6-digit PIN. Anyone permitted can upload photos, videos and documents.' },
  { title: 'Find them whenever needed', text: 'Browse, search and download your preserved memories at any time.' },
];

const HeroArt: React.FC = () => (
  <div className="relative mx-auto h-72 w-full max-w-md sm:h-80" role="img" aria-label="Illustration of a family archive holding photographs, a video and a document">
    <div className="absolute inset-x-4 bottom-0 top-10 rounded-3xl border border-slate-200 bg-white shadow-sm" />
    <div className="absolute left-4 top-3 h-8 w-28 rounded-t-xl border border-b-0 border-slate-200 bg-white" />
    <div className="absolute left-10 top-14 w-36 -rotate-6 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
      <div className="flex h-24 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ImageIcon className="h-9 w-9" aria-hidden="true" /></div>
      <div className="mt-2 h-2 w-16 rounded bg-slate-200" />
    </div>
    <div className="absolute right-10 top-12 w-36 rotate-6 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
      <div className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Video className="h-9 w-9" aria-hidden="true" /></div>
      <div className="mt-2 h-2 w-20 rounded bg-slate-200" />
    </div>
    <div className="absolute bottom-6 left-1/2 w-44 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white"><FileText className="h-5 w-5" aria-hidden="true" /></span>
        <div className="space-y-1.5"><div className="h-2 w-20 rounded bg-slate-300" /><div className="h-2 w-12 rounded bg-slate-200" /></div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Lock className="h-3 w-3" aria-hidden="true" /> Private to your family</div>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  usePageMeta(
    siteConfig.name,
    'One private place for your family to store, organize and preserve important photos, videos and documents, saved in your own Google Drive.',
    '/',
  );
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-blue-600">Invite-only family archive</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">Your Family’s Memories, Safely Preserved.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">One private place for your family to store, organize and preserve important photos, videos and documents.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href={siteConfig.signInPath}>Access FamilyVault</PrimaryLink>
            <SecondaryLink href="#privacy">Learn About Privacy</SecondaryLink>
          </div>
        </div>
        <HeroArt />
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-h" className="scroll-mt-20 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="features-h" className="text-2xl font-bold tracking-tight sm:text-3xl">Everything a family archive needs, nothing it doesn’t</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-h" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 id="how-h" className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
              <h3 className="mt-4 text-base font-semibold text-slate-900"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Privacy */}
      <section id="privacy" aria-labelledby="privacy-h" className="scroll-mt-20 border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="privacy-h" className="text-2xl font-bold tracking-tight sm:text-3xl">Privacy, in plain words</h2>
            <p className="mt-4 text-slate-600">FamilyVault is built so your family stays in control of its own files. Read the <a href={siteConfig.privacyPath} className="font-medium text-blue-600 underline underline-offset-2">full Privacy Policy</a> for the details.</p>
          </div>
          <ul className="space-y-4">
            {[
              ['Google is used to connect Drive', 'Only the family owner connects a Google account, to link Google Drive. Relatives don’t need Google to sign in; they use the PIN from their invitation.'],
              ['A limited Drive permission', 'FamilyVault requests the “drive.file” permission, which covers files and folders the app creates. It does not request access to your entire Drive.'],
              ['Your files stay in your Google account', 'Files live in the owner’s Google Drive, where the owner can see and manage them with Google’s own tools.'],
              ['You can revoke access any time', <>The owner can disconnect Google Drive from the Storage page in FamilyVault, or remove FamilyVault in their <a href={googleLinks.permissions} className="font-medium text-blue-600 underline underline-offset-2" rel="noopener noreferrer">Google Account permissions</a>.</>],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <div><h3 className="text-sm font-semibold text-slate-900">{t}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About */}
      <section id="about" aria-labelledby="about-h" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 text-center sm:px-6">
        <h2 id="about-h" className="text-2xl font-bold tracking-tight sm:text-3xl">Built for one family at a time</h2>
        <p className="mt-4 leading-relaxed text-slate-600">FamilyVault is a private family utility, not a public sharing network. Each vault belongs to a single family and is managed by its owner, who decides who is invited and what they can do.</p>
        <div className="mt-8 flex justify-center"><PrimaryLink href={siteConfig.signInPath}>Access FamilyVault</PrimaryLink></div>
      </section>
    </PublicLayout>
  );
};
