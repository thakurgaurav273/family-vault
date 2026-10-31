import React, { useState } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderOpen,
  ChevronLeft,
  Plus,
  Trash2,
  Share2,
  Calendar,
  Image as ImageIcon,
  Film,
  FileText,
  Eye,
  Heart,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { formatDate, formatBytes } from '../utils/formatters';
import { MediaImage } from '../components/common/MediaImage';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const {
    folders,
    files,
    setPreviewFile,
    setIsUploadOpen,
    setTargetUploadFolderId,
    toggleFavorite,
    deleteFile,
  } = useFamilyVault();

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const folder = folders.find((f) => f.id === folderId);
  const folderFiles = files.filter((f) => f.folderId === folderId);

  if (!folder) {
    return (
      <div className="py-20 text-center">
        <FolderOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Folder not found
        </h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4">This folder may have been removed.</p>
        <Link
          to="/folders"
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl"
        >
          Return to Folders
        </Link>
      </div>
    );
  }

  const handleUploadHere = () => {
    setTargetUploadFolderId(folder.id);
    setIsUploadOpen(true);
  };

  const handleDeleteFile = async () => {
    if (fileToDelete) {
      await deleteFile(fileToDelete);
      setFileToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <button
          onClick={() => navigate('/folders')}
          className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Shared Folders</span>
        </button>
        <span>/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{folder.name}</span>
      </div>

      {/* Folder Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: folder.color }}
          >
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {folder.name}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {folder.description || 'Shared collection of family memories.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2 font-mono">
              <span>{folderFiles.length} item(s)</span>
              <span>·</span>
              <span>Created by {folder.createdByName}</span>
              <span>·</span>
              <span>{formatDate(folder.createdAt)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleUploadHere}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload to this Folder</span>
        </button>
      </div>

      {/* Files Inside Folder */}
      {folderFiles.length === 0 ? (
        <EmptyState icon={FolderOpen} label="This folder is empty" sublabel="Upload photos, documents or videos directly to this shared folder." actionLabel="Upload files" onAction={handleUploadHere} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {folderFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setPreviewFile(file)}
              className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-xs border border-neutral-200 dark:border-neutral-800"
            >
              <MediaImage
                src={file.thumbnailUrl}
                alt={file.name}
                fileType={file.fileType}
                title={file.name}
                className="group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute top-2.5 right-2.5 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(file.id);
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-xs transition-opacity ${
                    file.isFavorite
                      ? 'opacity-100 bg-black/60 text-rose-500'
                      : 'opacity-0 group-hover:opacity-100 bg-black/40 text-white/80 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white pointer-events-none">
                <p className="text-xs font-semibold truncate leading-tight">{file.name}</p>
                <div className="flex items-center justify-between text-[10px] text-neutral-300 mt-1">
                  <span>{formatDate(file.uploadedAt)}</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete File?"
        message="Are you sure you want to delete this file?"
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleDeleteFile}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
};
