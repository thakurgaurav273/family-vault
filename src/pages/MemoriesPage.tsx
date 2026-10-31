import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Heart,
  Play,
  Share2,
  FolderOpen,
  MapPin,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { formatDate } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { MediaImage } from '../components/common/MediaImage';

export const MemoriesPage: React.FC = () => {
  const { files, folders, setPreviewFile, showToast, setIsUploadOpen } = useFamilyVault();
  const [selectedHighlight, setSelectedHighlight] = useState<string>('all');

  const photos = files.filter((f) => f.fileType === 'photo');

  // Stories are built from the real folders: one per folder that holds photos, plus loose photos.
  const byNewest = (list: typeof photos) =>
    [...list].sort((x, y) => new Date(y.uploadedAt).getTime() - new Date(x.uploadedAt).getTime());
  const monthOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const memoriesStories = [
    ...folders.map((folder) => ({ folder, items: byNewest(photos.filter((p) => p.folderId === folder.id)) })),
    { folder: { id: 'unfiled', name: 'Recent uploads', description: 'Photos not yet in a folder' }, items: byNewest(photos.filter((p) => !p.folderId)) },
  ]
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      id: g.folder.id,
      title: g.folder.name,
      subtitle: g.folder.description || 'Photos from your family vault',
      cover: g.items[0],
      date: monthOf(g.items[0].uploadedAt),
      count: g.items.length,
    }))
    .sort((x, y) => new Date(y.cover.uploadedAt).getTime() - new Date(x.cover.uploadedAt).getTime());
  const recentPhotos = byNewest(photos).slice(0, 8);

  const handleStartSlideshow = () => {
    if (photos.length > 0) {
      setPreviewFile(photos[0]);
      showToast('Starting memory slideshow...', 'info');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header with Slideshow Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-6 sm:p-10 border border-neutral-800 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        {photos[0] && (
          <img
            src={photos[0].url}
            alt="Hero memory"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
          />
        )}

        <div className="relative z-20 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Family Story</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Memories That Stay With Us Forever
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Relive special milestones, anniversary celebrations, and spontaneous road trips curated from your Google Drive vault.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleStartSlideshow}
              className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md"
            >
              <Play className="w-4 h-4 fill-neutral-950" />
              <span>Play Memory Slideshow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Story Capsules (Apple Photos style Highlights) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Curated Stories & Journeys
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Auto-generated collections based on locations and family events
            </p>
          </div>
        </div>

        {memoriesStories.length === 0 && (
          <EmptyState icon={Sparkles} label="No memories yet" sublabel="Upload photos to start building your family stories." actionLabel="Upload photos" onAction={() => setIsUploadOpen(true)} />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {memoriesStories.map((story) => (
            <div
              key={story.id}
              onClick={() => {
                if (story.cover) setPreviewFile(story.cover);
              }}
              className="group relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer shadow-md border border-neutral-200/50 dark:border-neutral-800"
            >
              {story.cover && (
                <MediaImage
                  src={story.cover.thumbnailUrl}
                  alt={story.title}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 flex flex-col justify-between p-4 text-white">
                <div className="flex justify-end">
                  <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {story.count} moments
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-amber-400 font-medium block">
                    {story.date}
                  </span>
                  <h3 className="text-base font-bold leading-tight group-hover:text-amber-300 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs text-neutral-300 line-clamp-2 mt-1">
                    {story.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On This Day / Throwback Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Timeless Moments Preserved
            </h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Archived to Google Drive</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recentPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setPreviewFile(photo)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
            >
              <MediaImage src={photo.thumbnailUrl} alt={photo.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white text-[11px]">
                <p className="font-semibold truncate">{photo.name}</p>
                <span className="text-neutral-300 text-[10px]">{formatDate(photo.uploadedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
