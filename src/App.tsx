import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyVaultProvider } from './context/FamilyVaultContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { PhotosPage } from './pages/PhotosPage';
import { VideosPage } from './pages/VideosPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { FoldersPage } from './pages/FoldersPage';
import { FolderDetailPage } from './pages/FolderDetailPage';
import { FamilyPage } from './pages/FamilyPage';
import { StoragePage } from './pages/StoragePage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { OwnerSetupWizard } from './pages/OwnerSetupWizard';
import { LandingPage } from './pages/LandingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { isSignedIn } from './utils/session';

// "/" is the public landing page for visitors and the dashboard for signed-in members.
// Signed-out visitors can only ever reach "/" (see PUBLIC_PATHS in main.tsx), so the app shell is never shown to them.
const RootShell = () => (isSignedIn() ? <AppLayout /> : <LandingPage />);

export default function App() {
  return (
    <FamilyVaultProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App Layout */}
          <Route path="/" element={<RootShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="memories" element={<MemoriesPage />} />
            <Route path="photos" element={<PhotosPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="folders" element={<FoldersPage />} />
            <Route path="folders/:folderId" element={<FolderDetailPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="storage" element={<StoragePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Public pages (no authentication required) */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Standalone Authentication and Onboarding Screens */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/setup" element={<OwnerSetupWizard />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FamilyVaultProvider>
  );
}
