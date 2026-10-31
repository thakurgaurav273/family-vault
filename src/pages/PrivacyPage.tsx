import React from 'react';
import { LegalPage, Section } from '../components/marketing/PublicLayout';
import { ContactEmail, OperatorName } from '../components/marketing/Placeholder';
import { usePageMeta } from '../hooks/usePageMeta';
import { googleLinks, siteConfig } from '../config/site';

const TOC = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'google-authentication', title: 'Google Account Authentication' },
  { id: 'google-drive-access', title: 'Google Drive API Access' },
  { id: 'google-user-data', title: 'Google User Data Usage' },
  { id: 'file-storage', title: 'How Files Are Stored' },
  { id: 'sharing', title: 'Data Sharing and Third Parties' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'deletion', title: 'Data Deletion' },
  { id: 'security', title: 'Security Practices' },
  { id: 'rights', title: 'User Rights and Control' },
  { id: 'children', title: 'Children’s Privacy' },
  { id: 'changes', title: 'Changes to This Policy' },
  { id: 'contact', title: 'Contact Information' },
];

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700">{children}</th>;
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => <td className="border-b border-slate-100 px-3 py-2 align-top text-sm">{children}</td>;
const Table: React.FC<{ head: string[]; rows: React.ReactNode[][] }> = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[480px] border-collapse">
      <thead><tr>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <Td key={j}>{c}</Td>)}</tr>)}</tbody>
    </table>
  </div>
);

// OWNER-CONFIRM: every statement below is derived from the code in server/ and src/. Items that depend on
// deployment choices (hosting provider, logs, backups, deletion requests, children) are marked in the report.
export const PrivacyPage: React.FC = () => {
  usePageMeta('Privacy Policy', 'How FamilyVault handles account information, Google Drive access and family files, including Google user data and Limited Use disclosures.', siteConfig.privacyPath);
  return (
    <LegalPage
      title="Privacy Policy"
      toc={TOC}
      intro={<p>FamilyVault is a private, invite-only application where one family stores photos, videos and documents. This policy explains what information the application handles, why, and the choices you have. It applies to this website and the FamilyVault application.</p>}
    >
      <Section id="introduction" n={1} title="Introduction">
        <p>FamilyVault is operated by <OperatorName />. Each FamilyVault workspace belongs to one family and is managed by a family member called the <strong>owner</strong>. The owner connects a Google Drive account, invites relatives, and decides who can upload, view and delete files.</p>
        <p>FamilyVault hosts separate vaults for many families. Each family’s data is kept apart from every other family’s, and members of one vault cannot see another vault.</p>
        <p>Where this policy says “we”, it means the operator named above.</p>
      </Section>

      <Section id="information-we-collect" n={2} title="Information We Collect">
        <Table
          head={['Category', 'What is stored']}
          rows={[
            ['Profile', 'Name, email address, role (owner, admin or member), relationship label, optional phone number, profile image link, join date and account status.'],
            ['Sign-up verification', 'When you create a vault we email a 6-digit code to confirm the address is yours. Until you enter it, or for at most 10 minutes, we hold your name, email, a salted hash of your password and a hashed copy of the code. If it expires or is not used, it is deleted.'],
            ['Sign-in credentials', 'The owner’s password and each member’s 6-digit PIN are stored only as salted hashes (scrypt), never in readable form. We also keep counters of failed sign-in attempts to lock out guessing.'],
            ['Invitation and reset links', 'Single-use tokens that let a person accept an invitation or reset a PIN or password. They expire and are removed when used or replaced.'],
            ['Session', 'A signed, HTTP-only cookie (fv_session) that keeps you signed in for up to 30 days, or until you sign out of all devices.'],
            ['Workspace data', 'Family name, preferences (such as default visibility and who may upload or delete), folders, and in-app notifications.'],
            ['File records (metadata)', 'For each uploaded file: name, type, size, category, tags, folder, visibility, favourite flag, uploader, upload time and the Google Drive file ID. The file’s contents are not stored in our database.'],
            ['Google connection data', 'The connected Google account’s email, name and profile picture link, an encrypted refresh token, the ID of the FamilyVault folder in Drive, and storage usage figures. See sections 3 to 5.'],
            ['Technical data', 'Your IP address, used to rate-limit sign-in and similar requests. It is kept with a request counter that expires automatically. The hosting provider may also keep standard server logs.'],
            ['On your device', 'To run quickly, the app keeps a copy of your family’s member list and file records, plus your theme choice, in your browser’s local storage.'],
          ]}
        />
      </Section>

      <Section id="google-authentication" n={3} title="Google Account Authentication">
        <p><strong>FamilyVault does not use “Sign in with Google” to log people in.</strong> The owner creates an account with an email address and password. Invited family members sign in with their email and a 6-digit PIN.</p>
        <p>Google’s OAuth consent flow is used only by the owner, to authorize FamilyVault to use their Google Drive. During that flow Google also shares the account’s email address and basic profile (name and picture), which we use to show which Google account is connected. Family members do not need a Google account to use FamilyVault, and they do not grant Google permissions themselves.</p>
      </Section>

      <Section id="google-drive-access" n={4} title="Google Drive API Access">
        <p>FamilyVault requests these Google OAuth scopes:</p>
        <Table
          head={['Scope', 'Purpose']}
          rows={[
            [<code key="a">…/auth/drive.file</code>, 'Per-file access to Google Drive. It covers files and folders that FamilyVault creates, or that a user explicitly opens or selects with the app. FamilyVault only uses it for the folders and files it creates itself.'],
            [<code key="b">…/auth/userinfo.email</code>, 'Shows which Google account is connected.'],
            [<code key="c">…/auth/userinfo.profile</code>, 'Shows the connected account’s name and picture.'],
          ]}
        />
        <p>FamilyVault <strong>does not request access to your entire Google Drive</strong>, and it does not browse, list or read files it did not create.</p>
        <p>With this access the application:</p>
        <ul>
          <li>creates a folder named “FamilyVault - &lt;family name&gt;” and sub-folders that mirror your folders in the app;</li>
          <li>uploads files that family members add, and reads them back so they can be viewed or downloaded;</li>
          <li>deletes a file in Drive when it is deleted in FamilyVault by someone permitted to do so (best effort); and</li>
          <li>reads the connected account’s Drive storage usage and limit to show a storage meter. This figure covers the whole Google account, not only FamilyVault files.</li>
        </ul>
        <p>Because the owner’s authorization is used for the whole family, uploads made by invited members are written to the owner’s Google Drive using the owner’s connection. Access is requested offline, so a refresh token is kept to let the application keep working without the owner signing in to Google each time.</p>
      </Section>

      <Section id="google-user-data" n={5} title="Google User Data Usage">
        <Table
          head={['Google user data', 'How it is used']}
          rows={[
            ['Drive files and folders created by FamilyVault', 'Stored, retrieved and deleted only to provide the family archive features the users ask for.'],
            ['Drive storage quota', 'Displayed in the Storage page.'],
            ['Google account email, name and picture', 'Displayed to show which account is connected.'],
            ['OAuth refresh token', 'Used by our server to call the Drive API on the owner’s behalf. Stored encrypted.'],
          ]}
        />
        <p>FamilyVault’s use and transfer of information received from Google APIs to any other app will adhere to the <a href={googleLinks.userDataPolicy} rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        <p>In line with those requirements:</p>
        <ul>
          <li>We use Google user data only to provide and improve the user-facing features described in this policy.</li>
          <li>We do not sell Google user data, and we do not use it for advertising, including personalized or retargeted ads.</li>
          <li>We do not use Google user data to develop, improve or train generalized artificial intelligence or machine-learning models.</li>
          <li>We do not allow humans to read Google user data unless we have the user’s consent for specific items, it is necessary for security or abuse investigation, it is required by law, or it is aggregated and anonymized for internal operations.</li>
          <li>We do not transfer Google user data to third parties except as needed to provide the service (section 7), to comply with law, or as part of a merger or sale with notice to users.</li>
        </ul>
        <p>Within the family, files are visible to other members according to the visibility the uploader or an admin set (family, admins only, or private). That sharing is controlled by the family, not by us.</p>
      </Section>

      <Section id="file-storage" n={6} title="How Files Are Stored">
        <ul>
          <li><strong>File contents</strong> are stored in the owner’s Google Drive, counted against that account’s storage and governed by Google’s own terms and privacy policy.</li>
          <li><strong>Uploads</strong> are streamed through the FamilyVault server directly into Google Drive. They are not written to the server’s disk.</li>
          <li><strong>Viewing and downloads</strong> are also streamed from Google Drive through the server to your browser; the server does not keep a copy. Your browser may cache a file privately for up to one hour.</li>
          <li><strong>No separate thumbnails</strong> are created or stored. Previews are displayed from the original file.</li>
          <li><strong>Metadata and account data</strong> (section 2) are stored in a PostgreSQL database. If no database is configured, as in local development, they are stored in a local file on the server.</li>
          <li>If the owner connects a different Google account, the file records for the previous account are kept in the database (set aside, not shown) so they reappear if that account is reconnected. The files themselves remain in the original Drive.</li>
        </ul>
      </Section>

      <Section id="sharing" n={7} title="Data Sharing and Third Parties">
        <p>We do not sell personal information or share it for advertising. The application, as configured in its deployment files, relies on these services:</p>
        <Table
          head={['Service', 'Role and data involved']}
          rows={[
            ['Google (Drive API, OAuth)', 'Stores family files and authorizes access, as described above.'],
            ['Neon (PostgreSQL)', 'Hosts the application database: account data, file records and encrypted tokens.'],
            ['Resend', 'Delivers invitation and reset emails. It receives the recipient’s email address, the inviter’s name, the family name and the link.'],
            ['Render', 'Hosts the application server (the reference deployment configuration). Standard request logs may be kept by the host.'],
            ['Google Fonts', 'Your browser loads the site’s fonts from Google, which receives your IP address and browser details.'],
            ['Unsplash', 'Default profile images are loaded by your browser from images.unsplash.com until a member sets their own.'],
          ]}
        />
        <p>We may disclose information if required by law or to protect the safety and rights of users and the service.</p>
      </Section>

      <Section id="retention" n={8} title="Data Retention">
        <p>FamilyVault does not apply automatic retention periods to family data. Account data, file records and files are kept until they are deleted as described in section 9.</p>
        <ul>
          <li>Invitation links expire after 7 days and password or PIN reset links after 30 minutes.</li>
          <li>Sign-in sessions last up to 30 days.</li>
          <li>Unverified sign-ups expire after 10 minutes, and a code allows five attempts.</li>
          <li>Rate-limiting counters expire automatically when their time window ends.</li>
          <li>Retention of server logs and database backups depends on the hosting and database providers’ settings.</li>
        </ul>
      </Section>

      <Section id="deletion" n={9} title="Data Deletion">
        <ul>
          <li><strong>Deleting a file</strong> removes its record from FamilyVault and asks Google Drive to delete the file. If the Drive request fails, the file may remain in Drive and the owner can delete it there directly.</li>
          <li><strong>Removing a family member</strong> removes their profile, sign-in credentials and pending invitations. Files they uploaded remain, still showing their name as uploader, until those files are deleted.</li>
          <li><strong>Disconnecting Google Drive</strong> (Storage page, owner only) revokes the token with Google and deletes the stored token. Files already in Google Drive stay there, and FamilyVault’s file records remain in the database.</li>
          <li><strong>Deleting the whole workspace or your data:</strong> the application has no self-service option for this. Contact us (section 14) and we will handle the request.</li>
        </ul>
        <p>Deleting the “FamilyVault” folder directly in Google Drive also removes those files from Google’s side; FamilyVault will then be unable to display them.</p>
      </Section>

      <Section id="security" n={10} title="Security Practices">
        <p>We take these measures:</p>
        <ul>
          <li>Passwords and PINs are stored as salted scrypt hashes.</li>
          <li>The Google refresh token is encrypted before it is stored (AES-256-GCM), with a key derived from a secret that is not kept in the database.</li>
          <li>Sessions use signed, HTTP-only, same-site cookies, and can be revoked on all devices.</li>
          <li>Sign-in, invitation and reset requests are rate-limited, and repeated failed sign-ins are temporarily locked out.</li>
          <li>In production the application sends HTTP Strict Transport Security and Content Security Policy headers, and user-uploaded files are served with restrictions so they cannot run as web pages.</li>
          <li>Access to a file is checked against its visibility setting on every request, and every request is limited to the signed-in person’s own family vault.</li>
          <li>Owner email addresses are verified with an emailed code before a vault is created.</li>
        </ul>
        <p>No online service can be guaranteed completely secure. Anyone with administrative access to the server, database and secrets could technically access stored data, so access to those is limited to the operator. Please choose a PIN or password that others cannot guess and keep it private.</p>
      </Section>

      <Section id="rights" n={11} title="User Rights and Control">
        <ul>
          <li><strong>Revoke Google access:</strong> the owner can disconnect Drive in FamilyVault, or remove FamilyVault at any time under <a href={googleLinks.permissions} rel="noopener noreferrer">Google Account permissions</a>.</li>
          <li><strong>Your files:</strong> they live in the owner’s Google Drive, where the owner can view, download or delete them using Google’s tools.</li>
          <li><strong>Your profile:</strong> members can edit their own name, relationship and phone number in the app, and change their PIN or password.</li>
          <li><strong>Sign out everywhere:</strong> available from your account settings.</li>
          <li><strong>Other requests:</strong> to ask what we hold about you, to correct it, or to have it deleted, contact us at <ContactEmail />. Depending on where you live you may have additional legal rights; we will respond as the law requires.</li>
        </ul>
      </Section>

      <Section id="children" n={12} title="Children’s Privacy">
        <p>FamilyVault is not directed at children, and children cannot create an account on their own: every account is created by the owner’s invitation. Adults in a family may upload photos or documents that include children. The owner is responsible for what the family stores. If you believe a child’s personal information was provided to us in error, contact us and we will help remove it.</p>
      </Section>

      <Section id="changes" n={13} title="Changes to This Policy">
        <p>We may update this policy as the application changes. The “Last updated” date above shows the latest revision. If a change materially affects how Google user data is handled, we will update this page before the change takes effect.</p>
      </Section>

      <Section id="contact" n={14} title="Contact Information">
        <p>Operator: <OperatorName /></p>
        <p>Email: <ContactEmail /></p>
      </Section>
    </LegalPage>
  );
};
