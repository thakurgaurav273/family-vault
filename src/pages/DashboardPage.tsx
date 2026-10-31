import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';
import {
  Image as ImageIcon,
  Activity,
  Film,
  FileText,
  HardDrive,
  Plus,
  Sparkles,
  Users,
  FolderPlus,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { formatBytes, formatDate, formatRelativeTime } from '../utils/formatters';
import { MediaImage } from '../components/common/MediaImage';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    workspace,
    driveConnection,
    files,
    folders,
    members,
    setIsUploadOpen,
    setTargetUploadFolderId,
    setPreviewFile,
    syncDriveNow,
  } = useFamilyVault();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncDriveNow();
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Compute greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser.name.split(' ')[0];

  // Stats
  const photosCount = files.filter((f) => f.fileType === 'photo').length;
  const videosCount = files.filter((f) => f.fileType === 'video').length;
  const docsCount = files.filter((f) => f.fileType === 'document').length;

  const usedFormatted = formatBytes(driveConnection.storageUsedBytes);
  const totalFormatted = formatBytes(driveConnection.storageTotalBytes, 0);
  const percentUsed = Math.min(
    100,
    Math.round((driveConnection.storageUsedBytes / driveConnection.storageTotalBytes) * 1000) / 10
  );

  // Recently uploaded (top 6)
  const recentFiles = [...files].slice(0, 6);

  // Recent memories (photos with takenAt or uploadedAt)
  const recentPhotos = files.filter((f) => f.fileType === 'photo').slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Your family's memories, all in one place. Connected to Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Drive</span>
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Metrics & Storage Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Photos */}
        <div
          onClick={() => navigate('/photos')}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Photos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {photosCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>High-res family moments</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Videos */}
        <div
          onClick={() => navigate('/videos')}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Videos
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {videosCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>4K recordings & clips</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Documents */}
        <div
          onClick={() => navigate('/documents')}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {docsCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>Passports, deeds & bills</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Drive Storage */}
        <div
          onClick={() => navigate('/storage')}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Storage Used
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
              {usedFormatted}
            </span>
            <span className="text-xs text-neutral-400 font-mono tabular-nums">/ {totalFormatted}</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentUsed}%` }} />
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                Upload Photos
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">Add to gallery</span>
            </div>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                Upload Videos
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">4K family clips</span>
            </div>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                Upload Document
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">PDF, deed, ID</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/folders')}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                Create Folder
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">Organize albums</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/family')}
            className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                Invite Member
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">Grow family vault</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Memories & Highlights Section (Apple Photos Inspired) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Recent Memories
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Moments from family travels, festivals, and celebrations
            </p>
          </div>
          <button
            onClick={() => navigate('/memories')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all memories
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentPhotos.length === 0 && (
          <EmptyState compact icon={ImageIcon} label="No memories yet" sublabel="Photos you upload will appear here." actionLabel="Upload photos" onAction={() => setIsUploadOpen(true)} />
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {recentPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setPreviewFile(photo)}
              className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-xs border border-neutral-200/50 dark:border-neutral-800"
            >
              <MediaImage
                src={photo.thumbnailUrl}
                alt={photo.name}
                fileType="photo"
                className="group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-3 text-white">
                <p className="text-xs font-semibold truncate leading-tight">{photo.name}</p>
                <div className="flex items-center justify-between text-[10px] text-neutral-300 mt-1">
                  <span>{photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.uploadedAt)}</span>
                  <span>by {photo.uploaderName.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Split Grid: Recently Uploaded Files & Family Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Uploaded (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Recently Uploaded Files
            </h3>
            <span className="text-xs text-neutral-400">Synced to Drive</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
            {recentFiles.length === 0 && (
              <EmptyState compact icon={FileText} label="No files uploaded yet" sublabel="New uploads from the whole family show up here." />
            )}
            {recentFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setPreviewFile(file)}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {file.fileType === 'photo' && (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  )}
                  {file.fileType === 'video' && (
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5" />
                    </div>
                  )}
                  {file.fileType === 'document' && (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 transition-colors">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>·</span>
                      <span>Uploaded by {file.uploaderName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-neutral-400 block font-mono">
                    {formatRelativeTime(file.uploadedAt)}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">
                    {file.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Family Activity Feed (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Family Activity
            </h3>
            <span className="text-xs text-neutral-400">Live Sync</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs space-y-3.5">
            {files.length === 0 && (
              <EmptyState compact icon={Activity} label="No activity yet" sublabel="Upload something to get started." />
            )}
            {[...files]
              .sort((x, y) => +new Date(y.uploadedAt) - +new Date(x.uploadedAt))
              .slice(0, 5)
              .map((f) => (
                <div key={f.id} className="flex items-start gap-3 text-xs">
                  <img
                    src={f.uploaderAvatar}
                    alt={f.uploaderName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-neutral-200 dark:ring-neutral-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-neutral-900 dark:text-neutral-100 truncate">
                      <span className="font-semibold">{f.uploaderName}</span>{' '}
                      <span className="text-neutral-500">uploaded {f.name}</span>
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      {new Date(f.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-500">Connected Google account</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {driveConnection.accountEmail}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
