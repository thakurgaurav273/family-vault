import React, { useState, useMemo } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import {
  Film,
  Search,
  Play,
  Clock,
  User as UserIcon,
  Download,
  Plus,
  ArrowUpDown,
  HardDrive,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { formatDate, formatBytes } from '../utils/formatters';
import { MediaImage } from '../components/common/MediaImage';

export const VideosPage: React.FC = () => {
  const { files, members, setPreviewFile, setIsUploadOpen, showToast } = useFamilyVault();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUploader, setSelectedUploader] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'duration' | 'size'>('newest');

  const videos = useMemo(() => {
    return files.filter((f) => {
      if (f.fileType !== 'video') return false;
      if (selectedUploader !== 'all' && f.uploaderId !== selectedUploader) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesTag = f.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesUploader = f.uploaderName.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesUploader) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'size') {
        return b.size - a.size;
      }
      return 0;
    });
  }, [files, selectedUploader, searchQuery, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Film className="w-6 h-6 text-purple-600" />
            Family Video Vault
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {videos.length} videos stored in original 4K resolution on Google Drive.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Video</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title, person, or occasion..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="newest">Recently Uploaded</option>
            <option value="size">Largest File Size</option>
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <EmptyState icon={Film} label="No videos yet" sublabel="Upload birthday videos or trip recordings to begin your video library." actionLabel="Upload video" onAction={() => setIsUploadOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setPreviewFile(video)}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-xs flex flex-col"
            >
              {/* Thumbnail Container with Play Overlay & Duration */}
              <div className="relative aspect-16/9 bg-neutral-900 overflow-hidden">
                <MediaImage
                  src={video.thumbnailUrl}
                  alt={video.name}
                  fileType="video"
                  className="group-hover:scale-105 transition-transform duration-300"
                />

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.duration || '03:45'}
                </span>

                {/* Center Play Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform pl-0.5">
                    <Play className="w-5 h-5 fill-neutral-900" />
                  </div>
                </div>
              </div>

              {/* Video Info Card */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {video.name}
                  </h3>
                  {video.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                      {video.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={video.uploaderAvatar}
                      alt={video.uploaderName}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="truncate max-w-[100px]">{video.uploaderName}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                    <span>{formatBytes(video.size)}</span>
                    <span>·</span>
                    <span>{formatDate(video.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
