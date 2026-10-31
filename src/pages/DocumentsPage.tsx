import React, { useState, useMemo } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import {
  FileText,
  Search,
  LayoutGrid,
  List,
  Filter,
  Plus,
  Download,
  Trash2,
  FolderOpen,
  ArrowUpDown,
  ShieldCheck,
  FileCheck,
  FileSpreadsheet,
  FileCode,
  Heart,
  Eye,
  Lock,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { FamilyFile, FileCategory } from '../types';
import { formatDate, formatBytes, getCategoryLabel } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const DocumentsPage: React.FC = () => {
  const { files, members, folders, setPreviewFile, setIsUploadOpen, deleteFile, showToast } =
    useFamilyVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size'>('newest');
  const [fileToDelete, setFileToDelete] = useState<FamilyFile | null>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Documents' },
    { id: 'identity', label: 'Identity & Passports' },
    { id: 'financial', label: 'Financial & Tax' },
    { id: 'medical', label: 'Medical & Health' },
    { id: 'education', label: 'Education & Degrees' },
    { id: 'bills', label: 'Bills & Receipts' },
    { id: 'personal', label: 'Personal & Legal' },
  ];

  const documents = useMemo(() => {
    return files.filter((f) => {
      if (f.fileType !== 'document') return false;
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      if (selectedFolderId !== 'all' && f.folderId !== selectedFolderId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesTag = f.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesDesc = f.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'size') {
        return b.size - a.size;
      }
      return 0;
    });
  }, [files, selectedCategory, selectedFolderId, searchQuery, sortBy]);

  const getDocIcon = (ext: string) => {
    if (ext === 'PDF') return <FileText className="w-5 h-5 text-red-500" />;
    if (['XLS', 'XLSX', 'CSV'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const handleDelete = async () => {
    if (fileToDelete) {
      await deleteFile(fileToDelete.id);
      setFileToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Family Document Vault
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Passports, property deeds, tax returns, insurance policies, and certificates securely stored in Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Category Pills (Functional Filter Buttons adhering to §1.A) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold shadow-xs'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search and Sort Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, policy number, or tag..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="newest">Recently Uploaded</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">File Size</option>
          </select>
        </div>
      </div>

      {/* Documents List or Grid View */}
      {documents.length === 0 ? (
        <EmptyState icon={FileText} label="No documents yet" sublabel="Upload policies, tax slips or certificates to secure them in the vault." actionLabel="Upload document" onAction={() => setIsUploadOpen(true)} />
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-800/40">
            <span className="col-span-5">Document Name</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-2">Uploaded By</span>
            <span className="col-span-2">Size</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setPreviewFile(doc)}
              className="grid grid-cols-1 sm:grid-cols-12 items-center px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group text-xs"
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  {getDocIcon(doc.extension)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 transition-colors">
                    {doc.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate sm:hidden">
                    {getCategoryLabel(doc.category)} · {formatBytes(doc.size)}
                  </p>
                </div>
              </div>

              <div className="col-span-2 hidden sm:block text-neutral-500 capitalize">
                {doc.category}
              </div>

              <div className="col-span-2 hidden sm:flex items-center gap-2">
                <img
                  src={doc.uploaderAvatar}
                  alt={doc.uploaderName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="truncate text-neutral-700 dark:text-neutral-300">
                  {doc.uploaderName}
                </span>
              </div>

              <div className="col-span-2 hidden sm:block font-mono text-[11px] text-neutral-500">
                {formatBytes(doc.size)}
              </div>

              <div
                className="col-span-1 flex items-center justify-end gap-1 shrink-0 mt-2 sm:mt-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPreviewFile(doc)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFileToDelete(doc)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setPreviewFile(doc)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    {getDocIcon(doc.extension)}
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded">
                    {doc.extension}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                  {doc.name}
                </h3>
                {doc.description && (
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span className="capitalize">{doc.category}</span>
                <span className="font-mono text-[11px]">{formatBytes(doc.size)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete Document?"
        message={`Are you sure you want to permanently delete "${fileToDelete?.name}"?`}
        confirmLabel="Delete Document"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
};
