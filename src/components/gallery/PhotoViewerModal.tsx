import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Info,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Check,
  FolderOpen,
} from 'lucide-react';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { FamilyFile } from '../../types';
import { formatBytes, formatDate, formatDateTime } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface PhotoViewerModalProps {
  currentFile: FamilyFile | null;
  onClose: () => void;
  allPhotos?: FamilyFile[];
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  currentFile,
  onClose,
  allPhotos = [],
}) => {
  const { toggleFavorite, deleteFile, showToast, folders, moveFilesToFolder } = useFamilyVault();
  const [showInfo, setShowInfo] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<FamilyFile | null>(currentFile);

  useEffect(() => {
    setActivePhoto(currentFile);
    setZoomLevel(1);
  }, [currentFile]);

  // Find index in photo sequence
  const photoList = allPhotos.length > 0 ? allPhotos : activePhoto ? [activePhoto] : [];
  const currentIndex = activePhoto ? photoList.findIndex((p) => p.id === activePhoto.id) : -1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setActivePhoto(photoList[currentIndex - 1]);
      setZoomLevel(1);
    }
  }, [currentIndex, photoList]);

  const handleNext = useCallback(() => {
    if (currentIndex < photoList.length - 1) {
      setActivePhoto(photoList[currentIndex + 1]);
      setZoomLevel(1);
    }
  }, [currentIndex, photoList]);

  // Keyboard navigation
  useEffect(() => {
    if (!activePhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, onClose, handlePrev, handleNext]);

  if (!activePhoto) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = activePhoto.url;
    link.download = activePhoto.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading "${activePhoto.name}" from Google Drive...`, 'info');
  };

  const handleToggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.6 : prev === 1.6 ? 2.2 : 1));
  };

  const handleDelete = async () => {
    if (activePhoto) {
      await deleteFile(activePhoto.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    }
  };

  const currentFolder = folders.find((f) => f.id === activePhoto.folderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
              {activePhoto.name}
            </h3>
            <p className="text-xs text-neutral-400">
              {currentIndex >= 0 ? `${currentIndex + 1} of ${photoList.length}` : ''}
              {activePhoto.takenAt ? ` · Taken ${formatDate(activePhoto.takenAt)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom */}
          <button
            onClick={handleToggleZoom}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
            title={`Zoom (${zoomLevel}x)`}
          >
            {zoomLevel > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(activePhoto.id)}
            className={`p-2 rounded-full transition-colors ${
              activePhoto.isFavorite
                ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white'
            }`}
            title={activePhoto.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 ${activePhoto.isFavorite ? 'fill-rose-500 stroke-rose-500' : ''}`}
            />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
            title="Download from Google Drive"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Info Drawer Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full transition-colors ${
              showInfo ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white'
            }`}
            title="Details & Metadata"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 text-neutral-300 hover:text-red-400 transition-colors"
            title="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4 sm:p-12">
        <img
          src={activePhoto.url}
          alt={activePhoto.name}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-200 cursor-zoom-in"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={handleToggleZoom}
        />

        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/10 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {currentIndex < photoList.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/10 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Right Information / Metadata Drawer */}
      {showInfo && (
        <aside className="absolute right-0 top-16 bottom-0 w-80 sm:w-96 bg-neutral-900/90 backdrop-blur-md border-l border-neutral-800 text-neutral-200 p-6 overflow-y-auto space-y-6 z-30 animate-in slide-in-from-right-4 duration-200">
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              File Details
            </h4>
            <p className="text-sm font-semibold text-white break-words">{activePhoto.name}</p>
            {activePhoto.description && (
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                {activePhoto.description}
              </p>
            )}
          </div>

          {/* Key Metadata Grid */}
          <div className="space-y-3 text-xs border-y border-neutral-800 py-4">
            <div className="flex justify-between">
              <span className="text-neutral-400">Dimensions</span>
              <span className="font-mono text-neutral-200">
                {activePhoto.dimensions
                  ? `${activePhoto.dimensions.width} × ${activePhoto.dimensions.height}`
                  : '3840 × 2160'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">File Size</span>
              <span className="font-mono text-neutral-200">{formatBytes(activePhoto.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Date Captured</span>
              <span className="text-neutral-200">
                {activePhoto.takenAt ? formatDate(activePhoto.takenAt) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Uploaded to Vault</span>
              <span className="text-neutral-200">{formatDateTime(activePhoto.uploadedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Shared Folder</span>
              <span className="text-neutral-200">
                {currentFolder ? `📁 ${currentFolder.name}` : 'Root Vault'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Visibility</span>
              <span className="capitalize text-neutral-200">{activePhoto.visibility}</span>
            </div>
          </div>

          {/* Uploader Profile */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Uploaded By
            </h4>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-800">
              <img
                src={activePhoto.uploaderAvatar}
                alt={activePhoto.uploaderName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {activePhoto.uploaderName}
                </p>
                <p className="text-[11px] text-neutral-400">Family Member</p>
              </div>
            </div>
          </div>

          {/* Google Drive Link */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Google Drive Storage
            </h4>
            <div className="p-3 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Drive File ID</span>
                <span className="text-blue-400 truncate max-w-[140px]">{activePhoto.driveFileId}</span>
              </div>
              <p className="text-neutral-500 text-[10px] pt-1">
                Stored in the family's Google Drive
              </p>
            </div>
          </div>

          {/* Tags */}
          {activePhoto.tags && activePhoto.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activePhoto.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Photo?"
        message={`Are you sure you want to permanently delete "${activePhoto.name}" from FamilyVault and Google Drive? This action cannot be undone.`}
        confirmLabel="Delete Photo"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
