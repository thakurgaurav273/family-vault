import React, { useState, useMemo } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  Filter,
  Heart,
  Download,
  Trash2,
  FolderOpen,
  Calendar,
  User as UserIcon,
  CheckSquare,
  Square,
  Sparkles,
  Plus,
  ArrowUpDown,
  Maximize2,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { FamilyFile } from '../types';
import { formatDate, formatBytes } from '../utils/formatters';
import { MediaImage } from '../components/common/MediaImage';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const PhotosPage: React.FC = () => {
  const {
    files,
    members,
    folders,
    setPreviewFile,
    setIsUploadOpen,
    toggleFavorite,
    batchDeleteFiles,
    moveFilesToFolder,
    showToast,
  } = useFamilyVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUploader, setSelectedUploader] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);

  // Filter photos
  const filteredPhotos = useMemo(() => {
    return files.filter((file) => {
      if (file.fileType !== 'photo') return false;
      if (onlyFavorites && !file.isFavorite) return false;
      if (selectedUploader !== 'all' && file.uploaderId !== selectedUploader) return false;
      if (selectedFolderId !== 'all' && file.folderId !== selectedFolderId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = file.name.toLowerCase().includes(q);
        const matchesTag = file.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesUploader = file.uploaderName.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesUploader) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.takenAt || a.uploadedAt).getTime();
      const dateB = new Date(b.takenAt || b.uploadedAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [files, onlyFavorites, selectedUploader, selectedFolderId, searchQuery, sortBy]);

  // Group photos by Month & Year for authentic Apple/Google Photos timeline experience
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, FamilyFile[]> = {};
    filteredPhotos.forEach((photo) => {
      const d = new Date(photo.takenAt || photo.uploadedAt);
      const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });
    return groups;
  }, [filteredPhotos]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleBulkDownload = () => {
    showToast(`Downloading ${selectedIds.length} photos in ZIP archive from Google Drive...`, 'info');
  };

  const handleBatchDelete = async () => {
    await batchDeleteFiles(selectedIds);
    setSelectedIds([]);
    setIsConfirmDeleteOpen(false);
  };

  const handleBulkMove = async (folderId: string | null) => {
    await moveFilesToFolder(selectedIds, folderId);
    setSelectedIds([]);
    setIsMoveFolderOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Search/Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Family Photos
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {filteredPhotos.length} photos preserved across trips, festivals, and memories.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Multi-Select Toggle */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              isSelectionMode
                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {isSelectionMode ? `Cancel Selection (${selectedIds.length})` : 'Select Photos'}
          </button>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Photos</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photos by title, tags or location..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Uploader filter */}
          <select
            value={selectedUploader}
            onChange={(e) => setSelectedUploader(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Uploaders</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Folder filter */}
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Shared Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Favorites toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
              onlyFavorites
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900'
                : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-500' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center gap-1"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="capitalize">{sortBy}</span>
          </button>
        </div>
      </div>

      {/* Floating Multi-Select Action Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 p-3 rounded-2xl bg-neutral-900 text-white shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleSelectAll}
              className="text-neutral-300 hover:text-white underline"
            >
              {selectedIds.length === filteredPhotos.length ? 'Deselect all' : 'Select all'}
            </button>
            <span className="font-semibold">{selectedIds.length} photos selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setIsMoveFolderOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Move to Folder</span>
            </button>
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-medium flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Timeline Sections (Grouped by Month/Year) */}
      {Object.keys(groupedPhotos).length === 0 ? (
        <EmptyState icon={Sparkles} label="No photos yet" sublabel="Upload photos to start your family gallery. If you have filters on, try clearing them." actionLabel="Upload photos" onAction={() => setIsUploadOpen(true)} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPhotos).map(([monthGroup, groupPhotos]) => (
            <div key={monthGroup} className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {monthGroup}
                </h3>
                <span className="text-xs text-neutral-400 font-mono">
                  {groupPhotos.length} photo{groupPhotos.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {groupPhotos.map((photo) => {
                  const isSelected = selectedIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelect(photo.id, {} as any);
                        } else {
                          setPreviewFile(photo);
                        }
                      }}
                      className={`group relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-xs border transition-all ${
                        isSelected
                          ? 'ring-3 ring-blue-600 border-transparent'
                          : 'border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300'
                      }`}
                    >
                      <MediaImage
                        src={photo.thumbnailUrl}
                        alt={photo.name}
                        fileType="photo"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div
                          onClick={(e) => toggleSelect(photo.id, e)}
                          className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-md bg-black/50 backdrop-blur-xs flex items-center justify-center text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Square className="w-5 h-5 text-white/70" />
                          )}
                        </div>
                      )}

                      {/* Favorite Button on Hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(photo.id);
                        }}
                        className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-xs transition-opacity ${
                          photo.isFavorite
                            ? 'opacity-100 bg-black/60 text-rose-500'
                            : 'opacity-0 group-hover:opacity-100 bg-black/40 text-white/80 hover:text-white'
                        }`}
                        title="Favorite photo"
                      >
                        <Heart
                          className={`w-4 h-4 ${photo.isFavorite ? 'fill-rose-500' : ''}`}
                        />
                      </button>

                      {/* Title & Uploader Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white pointer-events-none">
                        <p className="text-xs font-semibold truncate leading-tight">{photo.name}</p>
                        <div className="flex items-center justify-between text-[10px] text-neutral-300 mt-1">
                          <span>{photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.uploadedAt)}</span>
                          <span>by {photo.uploaderName.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Move Folder Modal */}
      {isMoveFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Move {selectedIds.length} Photos to Folder
            </h3>
            <p className="text-xs text-neutral-500 mb-4">Choose a destination folder:</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4">
              <button
                onClick={() => handleBulkMove(null)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                📁 Root Gallery (No Folder)
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleBulkMove(f.id)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  📁 {f.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsMoveFolderOpen(false)}
              className="w-full py-2 text-xs font-medium rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Selected Photos?"
        message={`Are you sure you want to permanently delete ${selectedIds.length} photo(s)? This will remove them from FamilyVault and Google Drive.`}
        confirmLabel="Delete Photos"
        isDestructive
        onConfirm={handleBatchDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
