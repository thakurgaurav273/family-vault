import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Info,
  Clock,
  Film,
  HardDrive,
  Heart,
} from 'lucide-react';
import { FamilyFile } from '../../types';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { formatBytes, formatDate } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface VideoPlayerModalProps {
  file: FamilyFile | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ file, onClose }) => {
  const { toggleFavorite, deleteFile, showToast } = useFamilyVault();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (!file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading video "${file.name}"...`, 'info');
  };

  const handleDelete = async () => {
    await deleteFile(file.id);
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate max-w-md">{file.name}</h3>
              <p className="text-xs text-neutral-400">
                Uploaded by {file.uploaderName} · {formatDate(file.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(file.id)}
              className={`p-2 rounded-xl transition-colors ${
                file.isFavorite
                  ? 'bg-rose-500/20 text-rose-500'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
              title="Favorite video"
            >
              <Heart className={`w-4 h-4 ${file.isFavorite ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Download video"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Toggle details"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-red-400 transition-colors"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player + Details split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-black">
          {/* Main Video Screen */}
          <div className="flex-1 flex items-center justify-center relative bg-black min-h-[300px]">
            <video
              src={file.url}
              controls
              autoPlay
              muted={isMuted}
              className="w-full max-h-[65vh] object-contain"
            />
          </div>

          {/* Collapsible Details Panel */}
          {showDetails && (
            <div className="w-full lg:w-80 bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 p-5 overflow-y-auto space-y-4 text-xs text-neutral-300 shrink-0">
              <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] text-neutral-400">
                Video Information
              </h4>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Duration</span>
                  <span className="font-mono text-white">{file.duration || '03:42'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Resolution</span>
                  <span className="font-mono text-white">4K UHD (3840×2160)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">File Size</span>
                  <span className="font-mono text-white">{formatBytes(file.size)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Category</span>
                  <span className="capitalize text-white">{file.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Visibility</span>
                  <span className="capitalize text-white">{file.visibility}</span>
                </div>
              </div>

              {file.description && (
                <div>
                  <span className="text-neutral-400 block mb-1">Description</span>
                  <p className="text-neutral-300 bg-neutral-800/40 p-2.5 rounded-lg leading-relaxed">
                    {file.description}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 space-y-1 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-400 font-sans font-medium text-xs">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Drive Backup</span>
                </div>
                <p className="text-neutral-400 truncate">ID: {file.driveFileId}</p>
                <p className="text-[10px] text-neutral-500 font-sans">
                  Original streaming master stored in primary family Drive account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Video?"
        message={`Are you sure you want to delete "${file.name}"? This will remove the file from both FamilyVault and Google Drive.`}
        confirmLabel="Delete Video"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
