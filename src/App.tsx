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

export default function App() {
  return (
    <FamilyVaultProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App Layout */}
          <Route path="/" element={<AppLayout />}>
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
