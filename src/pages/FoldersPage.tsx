import React, { useState } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { FamilyFolder } from '../types';
import { formatDate, formatBytes } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { folderService } from '../services';

export const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const { folders, files, refreshData, showToast, setIsUploadOpen, setTargetUploadFolderId } =
    useFamilyVault();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const [folderToDelete, setFolderToDelete] = useState<FamilyFolder | null>(null);

  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await folderService.createFolder(newFolderName.trim(), newFolderDesc.trim(), newFolderColor);
      await refreshData();
      setIsCreateModalOpen(false);
      setNewFolderName('');
      setNewFolderDesc('');
      showToast(`Created folder "${newFolderName}"`, 'success');
    } catch {
      showToast('Error creating folder', 'error');
    }
  };

  const handleDeleteFolder = async () => {
    if (folderToDelete) {
      await folderService.deleteFolder(folderToDelete.id);
      await refreshData();
      setFolderToDelete(null);
      showToast('Folder deleted', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-amber-500" />
            Shared Family Folders
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Organized albums and document vaults accessible to all family members.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Folder</span>
        </button>
      </div>

      {folders.length === 0 && (
        <EmptyState icon={FolderPlus} label="No folders yet" sublabel="Create a folder to organize albums and documents for the whole family." actionLabel="Create your first folder" onAction={() => setIsCreateModalOpen(true)} />
      )}

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {folders.map((folder) => {
          // Count files inside folder
          const folderFiles = files.filter((f) => f.folderId === folder.id);
          const totalBytes = folderFiles.reduce((acc, f) => acc + f.size, 0) || folder.totalSize;
          const previewFile = folderFiles[0];

          return (
            <div
              key={folder.id}
              onClick={() => navigate(`/folders/${folder.id}`)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
            >
              {/* Folder Top Banner */}
              <div
                className="h-24 p-4 flex items-start justify-between text-white relative overflow-hidden"
                style={{ backgroundColor: folder.color }}
              >
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div
                  className="relative z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderToDelete(folder);
                  }}
                >
                  <button
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/90 transition-colors"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtle background pattern */}
                <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
              </div>

              {/* Folder Content Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                    {folder.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {folder.description || 'Shared family memory and document collection.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                  <div>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {folderFiles.length || folder.fileCount} items
                    </span>
                    <span className="text-[11px] text-neutral-400 block font-mono">
                      {formatBytes(totalBytes)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">Created by</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {folder.createdByName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl animate-in fade-in">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Create Shared Family Folder
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Organize your family trips, ceremonies, and important archives.
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Europe Trip 2026, House Renovation..."
                  className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="Short note about what goes in here..."
                  className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Folder Color
                </label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newFolderColor === c ? 'scale-110 ring-2 ring-offset-2 ring-neutral-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation */}
      <ConfirmModal
        isOpen={!!folderToDelete}
        title="Delete Folder?"
        message={`Are you sure you want to delete "${folderToDelete?.name}"? The files inside will remain in your general vault.`}
        confirmLabel="Delete Folder"
        isDestructive
        onConfirm={handleDeleteFolder}
        onCancel={() => setFolderToDelete(null)}
      />
    </div>
  );
};
