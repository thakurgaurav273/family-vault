import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Eye,
  Trash2,
  RefreshCw,
  Lock,
  Users,
} from 'lucide-react';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { FileCategory, FileVisibility } from '../../types';
import { folderService } from '../../services';
import { formatBytes } from '../../utils/formatters';

interface FileUploadQueueItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  error?: string;
  dataUrl?: string;
}

const NEW_FOLDER = '__new__';

export const UploadModal: React.FC = () => {
  const {
    isUploadOpen,
    setIsUploadOpen,
    folders,
    targetUploadFolderId,
    setTargetUploadFolderId,
    simulateUpload,
    showToast,
    refreshData,
  } = useFamilyVault();

  const [queue, setQueue] = useState<FileUploadQueueItem[]>([]);
  const [category, setCategory] = useState<FileCategory>('personal');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(targetUploadFolderId);
  const [visibility, setVisibility] = useState<FileVisibility>('family');
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMap = useRef(new Map<string, File>());

  // Sync with target upload folder if set externally
  React.useEffect(() => {
    setSelectedFolderId(targetUploadFolderId);
  }, [targetUploadFolderId]);

  if (!isUploadOpen) return null;

  const handleClose = () => {
    if (isUploading) {
      if (!window.confirm('Upload is in progress. Are you sure you want to cancel?')) {
        return;
      }
    }
    setQueue([]);
    setNewFolderName('');
    setIsUploading(false);
    setIsUploadOpen(false);
    setTargetUploadFolderId(null);
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newItems: FileUploadQueueItem[] = [];
    const filesArray = Array.from(fileList);

    filesArray.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      let previewUrl: string | undefined = undefined;
      fileMap.current.set(id, file);

      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newItems.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'queued',
        dataUrl: previewUrl,
      });
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartUpload = async () => {
    if (queue.length === 0 || isUploading) return;
    if (selectedFolderId === NEW_FOLDER && !newFolderName.trim()) {
      showToast('Enter a name for the new folder', 'error');
      return;
    }

    setIsUploading(true);

    // Realistic multi-file simulated progress
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed') continue;

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q))
      );

      // Simulate network chunks
      for (const step of [30, 65, 90, 100]) {
        await new Promise((res) => setTimeout(res, 180));
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: step } : q))
        );
      }

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
      );
    }

    let destinationId = selectedFolderId;
    if (selectedFolderId === NEW_FOLDER) {
      try {
        const created = await folderService.createFolder(newFolderName.trim());
        await refreshData();
        destinationId = created.id;
      } catch {
        showToast('Could not create the folder', 'error');
        setIsUploading(false);
        return;
      }
    }

    // Persist files into FamilyVault & Google Drive
    await simulateUpload(
      queue.map((q) => ({
        name: q.name,
        size: q.size,
        type: q.type,
        dataUrl: q.dataUrl,
        file: fileMap.current.get(q.id),
      })),
      category,
      destinationId,
      visibility
    );

    setIsUploading(false);
    setTimeout(() => {
      handleClose();
    }, 600);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (type.startsWith('video/')) return <Film className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Upload to FamilyVault
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              All files are safely backed up to your family Google Drive account.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Drag & drop photos, videos or documents here
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              or <span className="text-blue-600 dark:text-blue-400 font-medium">browse files</span> from your device
            </p>
            <div className="flex items-center gap-2 mt-4 text-[11px] text-neutral-400">
              <span>Supports JPG, PNG, WEBP</span>
              <span>·</span>
              <span>MP4, MOV</span>
              <span>·</span>
              <span>PDF, DOCX, XLSX</span>
            </div>
          </div>

          {/* Upload Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FileCategory)}
                className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="personal">Personal & Memories</option>
                <option value="education">Education & Degrees</option>
                <option value="financial">Financial & Tax</option>
                <option value="medical">Medical & Health</option>
                <option value="identity">Identity & Passports</option>
                <option value="bills">Bills & Receipts</option>
                <option value="other">Other Documents</option>
              </select>
            </div>

            {/* Folder Destination */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Destination Folder
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value : null)}
                className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No folder (Vault root)</option>
                <option value={NEW_FOLDER}>＋ Create new folder…</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
              {selectedFolderId === NEW_FOLDER && (
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  maxLength={60}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder name"
                  className="mt-2 w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Privacy / Visibility */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as FileVisibility)}
                className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="family">Visible to entire family</option>
                <option value="admins">Admins & Owner only</option>
                <option value="private">Private (Only me & Owner)</option>
              </select>
            </div>
          </div>

          {/* Selected Files Queue */}
          {queue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Files to Upload ({queue.length})
                </span>
                <button
                  onClick={() => setQueue([])}
                  disabled={isUploading}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 max-h-52 overflow-y-auto">
                {queue.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.dataUrl ? (
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          {getFileIcon(item.type)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">{formatBytes(item.size)}</p>

                        {/* Progress Bar when uploading */}
                        {isUploading && (
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {item.status === 'uploading' && (
                        <span className="font-mono text-[11px] text-blue-600">{item.progress}%</span>
                      )}
                      {item.status === 'queued' && !isUploading && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-neutral-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {queue.length === 0
              ? 'Select files to begin upload'
              : `${queue.length} file(s) ready to sync`}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleStartUpload}
              disabled={queue.length === 0 || isUploading}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Drive...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Start Upload ({queue.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
