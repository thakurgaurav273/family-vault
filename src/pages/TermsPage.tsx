import React from 'react';
import { LegalPage, Section } from '../components/marketing/PublicLayout';
import { ContactEmail, OperatorName } from '../components/marketing/Placeholder';
import { usePageMeta } from '../hooks/usePageMeta';
import { siteConfig } from '../config/site';

const TOC = [
  { id: 'purpose', title: 'Purpose of FamilyVault' },
  { id: 'eligibility', title: 'Eligibility and Family Use' },
  { id: 'accounts', title: 'Account Responsibilities' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'ownership', title: 'Your Content' },
  { id: 'google-drive', title: 'Google Drive Dependency' },
  { id: 'availability', title: 'Service Availability and Limitations' },
  { id: 'deletion', title: 'Data Deletion and Account Access' },
  { id: 'changes', title: 'Changes to These Terms' },
  { id: 'contact', title: 'Contact Information' },
];

export const TermsPage: React.FC = () => {
  usePageMeta('Terms of Service', 'The terms for using FamilyVault, a private, invite-only family archive for photos, videos and documents.', siteConfig.termsPath);
  return (
    <LegalPage
      title="Terms of Service"
      toc={TOC}
      intro={<p>These terms describe how FamilyVault may be used. By signing in to or using FamilyVault you agree to them. They are a plain-language summary of the rules of the service and are not legal advice.</p>}
    >
      <Section id="purpose" n={1} title="Purpose of FamilyVault">
        <p>FamilyVault is a private, invite-only application for one family to store, organize and preserve photos, videos and documents. It is operated by <OperatorName />. It is not a public sharing or social network.</p>
      </Section>

      <Section id="eligibility" n={2} title="Eligibility and Family Use">
        <ul>
          <li>You may use FamilyVault only if you were invited by the family owner or an admin, or you are the owner who set up the vault.</li>
          <li>Use it for your own family’s legitimate, personal purposes. The owner decides who is invited, and what each person may upload, view and delete.</li>
          <li>Do not share your access with people the owner has not invited.</li>
        </ul>
      </Section>

      <Section id="accounts" n={3} title="Account Responsibilities">
        <ul>
          <li>Keep your password or PIN private and do not let others use your account.</li>
          <li>Provide accurate information, and tell the owner or us if you believe your account has been used without your permission.</li>
          <li>You are responsible for activity under your account.</li>
          <li>The owner is responsible for the connected Google account, the people invited, and the permissions set for the vault.</li>
        </ul>
      </Section>

      <Section id="acceptable-use" n={4} title="Acceptable Use">
        <p>Do not use FamilyVault to:</p>
        <ul>
          <li>upload anything unlawful, or content you have no right to store or share;</li>
          <li>store content that exploits or harms others, including children;</li>
          <li>upload malware, or try to break, probe or overload the service or its security;</li>
          <li>access another person’s account, or files you have not been given permission to see; or</li>
          <li>use the service in a way that breaches Google’s terms for Google Drive.</li>
        </ul>
        <p>The owner or operator may remove content or suspend access that breaks these rules.</p>
      </Section>

      <Section id="ownership" n={5} title="Your Content">
        <p>You and your family keep ownership of everything you upload. FamilyVault does not claim ownership of your files. You give the service permission only to store, retrieve, display and delete your files as needed to run the features you use, as described in the <a href={siteConfig.privacyPath}>Privacy Policy</a>.</p>
        <p>You are responsible for making sure you have the right to upload what you add, including photos of other people.</p>
      </Section>

      <Section id="google-drive" n={6} title="Google Drive Dependency">
        <p>Files are stored in the Google Drive account connected by the owner. FamilyVault therefore depends on Google Drive and on that account:</p>
        <ul>
          <li>Storage space, sharing limits and availability are set by Google and the owner’s Google plan.</li>
          <li>If the owner disconnects Drive, revokes access, deletes the FamilyVault folder, or the Google account is closed or restricted, files may become unavailable in FamilyVault.</li>
          <li>Google’s own terms and privacy policy apply to the use of Google Drive.</li>
        </ul>
        <p>We recommend keeping separate backups of anything irreplaceable.</p>
      </Section>

      <Section id="availability" n={7} title="Service Availability and Limitations">
        <ul>
          <li>FamilyVault is provided “as is” and “as available”, without a promise that it will be uninterrupted, error-free or free of data loss.</li>
          <li>The service may be unavailable for maintenance, outages or problems with providers it relies on.</li>
          <li>Features and limits, such as the maximum size of an uploaded file, may change.</li>
          <li>To the extent permitted by law, the operator is not liable for losses resulting from use of, or inability to use, the service. Nothing in these terms limits rights you have under law that cannot be limited.</li>
        </ul>
      </Section>

      <Section id="deletion" n={8} title="Data Deletion and Account Access">
        <ul>
          <li>Files can be deleted in the app by the people the owner has permitted; deleting a file also asks Google Drive to delete it.</li>
          <li>An admin or the owner can remove a family member, which ends that person’s access.</li>
          <li>The owner can disconnect Google Drive at any time.</li>
          <li>We may suspend or end access that breaks these terms. To have your data deleted, contact us; see the <a href={siteConfig.privacyPath}>Privacy Policy</a> for what is removed and what remains.</li>
        </ul>
      </Section>

      <Section id="changes" n={9} title="Changes to These Terms">
        <p>We may update these terms from time to time. The “Last updated” date above shows the latest revision. Continuing to use FamilyVault after a change means you accept the updated terms.</p>
      </Section>

      <Section id="contact" n={10} title="Contact Information">
        <p>Operator: <OperatorName /></p>
        <p>Email: <ContactEmail /></p>
      </Section>
    </LegalPage>
  );
};
