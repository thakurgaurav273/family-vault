import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Trash2,
  FolderOpen,
  Edit2,
  ShieldCheck,
  Check,
  HardDrive,
  Heart,
  Eye,
  FileCheck,
} from 'lucide-react';
import { FamilyFile } from '../../types';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { formatBytes, formatDate, formatDateTime, getCategoryLabel } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface DocumentPreviewModalProps {
  file: FamilyFile | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ file, onClose }) => {
  const { toggleFavorite, deleteFile, showToast, folders, moveFilesToFolder } = useFamilyVault();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(file?.name || '');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);

  if (!file) return null;

  const handleDownload = () => {
    showToast(`Downloading "${file.name}" from Google Drive...`, 'info');
  };

  const handleSaveName = () => {
    file.name = editedName;
    setIsEditingName(false);
    showToast('Document renamed', 'success');
  };

  const handleDelete = async () => {
    await deleteFile(file.id);
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  const handleMoveFolder = async (folderId: string | null) => {
    await moveFilesToFolder([file.id], folderId);
    file.folderId = folderId;
    setIsMoveFolderOpen(false);
  };

  const currentFolder = folders.find((f) => f.id === file.folderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-sm font-semibold px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </h3>
                  <button
                    onClick={() => {
                      setEditedName(file.name);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{getCategoryLabel(file.category)}</span>
                <span>·</span>
                <span>{formatBytes(file.size)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(file.id)}
              className={`p-2 rounded-xl transition-colors ${
                file.isFavorite
                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Favorite document"
            >
              <Heart className={`w-4 h-4 ${file.isFavorite ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMoveFolderOpen(!isMoveFolderOpen)}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Move to folder"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="p-2 text-neutral-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Move Folder Submenu */}
        {isMoveFolderOpen && (
          <div className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Move to shared folder:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMoveFolder(null)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50"
              >
                Root Vault
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleMoveFolder(f.id)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50"
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document Body / Simulated PDF Paper View */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 dark:bg-neutral-950 flex flex-col md:flex-row gap-6">
          {/* Simulated Document Preview Canvas */}
          <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs p-6 sm:p-10 font-sans flex flex-col justify-between min-h-[420px]">
            <div>
              {/* Document Header Bar */}
              <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs uppercase">
                    {file.extension}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {file.name}
                    </h2>
                    <p className="text-xs text-neutral-500">Official Vault Document Archive</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Drive Verified</span>
                </div>
              </div>

              {/* Document Summary Description */}
              <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Document Synopsis & Notes
                  </h4>
                  <p>{file.description || 'Verified archival document scanned and stored in FamilyVault.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] mb-0.5">Uploader</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {file.uploaderName}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] mb-0.5">Category</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 capitalize">
                      {file.category}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] mb-0.5">Original File</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 font-mono text-[11px] truncate block">
                      {file.originalName}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] mb-0.5">Security Level</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {file.visibility === 'family' ? 'Family Shared' : 'Admins Only'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer Bar */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-6 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-mono">Drive ID: {file.driveFileId}</span>
              <span>Encrypted at rest on Google Drive</span>
            </div>
          </div>

          {/* Right Metadata Sidecard */}
          <div className="w-full md:w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-5 text-xs shrink-0">
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] mb-3">
                Metadata & Access
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400">Format</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {file.extension}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400">Size</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {formatBytes(file.size)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400">Uploaded</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {formatDate(file.uploadedAt)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400">Folder</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {currentFolder ? currentFolder.name : 'Vault Root'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] mb-2">
                Uploaded By
              </h4>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                <img
                  src={file.uploaderAvatar}
                  alt={file.uploaderName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {file.uploaderName}
                  </p>
                  <p className="text-[10px] text-neutral-400">{formatDateTime(file.uploadedAt)}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Original File</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Document?"
        message={`Are you sure you want to permanently delete "${file.name}"?`}
        confirmLabel="Delete Document"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
