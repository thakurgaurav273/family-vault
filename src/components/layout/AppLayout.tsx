import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { UploadModal } from '../upload/UploadModal';
import { PhotoViewerModal } from '../gallery/PhotoViewerModal';
import { VideoPlayerModal } from '../video/VideoPlayerModal';
import { DocumentPreviewModal } from '../document/DocumentPreviewModal';
import { Toast } from '../common/Toast';
import { useFamilyVault } from '../../context/FamilyVaultContext';

export const AppLayout: React.FC = () => {
  const { previewFile, setPreviewFile, files } = useFamilyVault();

  // Photo viewer list (all photos for prev/next carousel)
  const allPhotos = files.filter((f) => f.fileType === 'photo');

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Interactive Modals */}
      <GlobalSearchModal />
      <UploadModal />

      {previewFile && previewFile.fileType === 'photo' && (
        <PhotoViewerModal
          currentFile={previewFile}
          onClose={() => setPreviewFile(null)}
          allPhotos={allPhotos}
        />
      )}

      {previewFile && previewFile.fileType === 'video' && (
        <VideoPlayerModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {previewFile && previewFile.fileType === 'document' && (
        <DocumentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      <Toast />
    </div>
  );
};
