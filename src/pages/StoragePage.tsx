import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  RefreshCw,
  Image as ImageIcon,
  Film,
  FileText,
  ShieldCheck,
  ExternalLink,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Cloud,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { storageService, StorageStats } from '../services/storageService';
import { formatBytes, formatDateTime } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { googleDriveService } from '../services';

export const StoragePage: React.FC = () => {
  const { driveConnection, refreshData, showToast, currentUser } = useFamilyVault();
  const isOwner = currentUser.role === 'owner';
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  const loadStats = async () => {
    const s = await storageService.getStorageStats();
    setStats(s);
  };

  useEffect(() => {
    loadStats();
  }, [driveConnection]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await googleDriveService.syncNow();
    await refreshData();
    await loadStats();
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Storage usage refreshed from Google Drive API', 'success');
    }, 600);
  };

  const handleDisconnect = async () => {
    await googleDriveService.disconnectDrive();
    await refreshData();
    setIsDisconnectModalOpen(false);
    showToast('Google Drive disconnected', 'info');
  };

  // Sends the owner to Google's account chooser, so a different Google account can be picked.
  const handleConnect = () => googleDriveService.connectDrive();

  if (!stats) return null;

  // Donut chart calculations
  const total = Math.max(1, stats.photosBytes + stats.videosBytes + stats.documentsBytes + stats.otherBytes);
  const pPhotos = (stats.photosBytes / total) * 100;
  const pVideos = (stats.videosBytes / total) * 100;
  const pDocs = (stats.documentsBytes / total) * 100;
  const pOther = (stats.otherBytes / total) * 100;
  const pFree = (stats.availableBytes / total) * 100;

  // SVG Donut geometry
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // The ring shows how much of the Drive quota is used; 0% draws nothing instead of a full circle.
  const usedLen = (Math.min(100, stats.usedPercentage) / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-600" />
            Storage & Google Drive Management
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time quota monitoring and Google Drive cloud backup synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Storage</span>
          </button>
        </div>
      </div>

      {/* Connected Google Drive Status Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Cloud className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {driveConnection.isConnected ? driveConnection.accountName : 'No Google Drive connected'}
              </h3>
              {driveConnection.isConnected ? (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-red-50 text-red-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Disconnected
                </span>
              )}
            </div>
            {driveConnection.isConnected ? (
              <>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">{driveConnection.accountEmail}</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Last successful synchronization: {formatDateTime(driveConnection.lastSyncedAt)}
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-500 mt-0.5">Uploads are paused until the owner connects a Google Drive.</p>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {driveConnection.isConnected ? (
              <>
                <button
                  onClick={() => setIsSwitchModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  Use a different Google account
                </button>
                <button
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                >
                  Disconnect Drive
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Connect Google Drive
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Analytics: Donut Chart + Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-6 self-start">
            Storage Utilization
          </h3>

          <div className="relative flex items-center justify-center my-2 shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-neutral-100 dark:text-neutral-800"
                fill="none"
              />
              {/* Photos segment */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#3b82f6"
                strokeWidth={strokeWidth}
                strokeDasharray={`${usedLen} ${circumference}`}
                strokeLinecap={usedLen > 0 ? 'round' : 'butt'}
                fill="none"
              />
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {stats.usedPercentage}%
              </span>
              <span className="text-xs text-neutral-400 font-medium">Used</span>
            </div>
          </div>

          <div className="w-full mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Drive quota: {formatBytes(stats.totalBytes)}</span>
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
              {formatBytes(stats.availableBytes)} free
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Card (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Category Breakdown
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Distribution of uploaded media and document files across family members.
            </p>

            <div className="space-y-4">
              {/* Photos */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500 shrink-0" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Photos ({stats.totalPhotosCount} items)
                    </span>
                  </div>
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">
                    {formatBytes(stats.photosBytes)}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.max(2, pPhotos)}%` }} />
                </div>
              </div>

              {/* Videos */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500 shrink-0" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Videos ({stats.totalVideosCount} clips)
                    </span>
                  </div>
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">
                    {formatBytes(stats.videosBytes)}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.max(2, pVideos)}%` }} />
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Documents & Scans ({stats.totalDocumentsCount} files)
                    </span>
                  </div>
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">
                    {formatBytes(stats.documentsBytes)}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(2, pDocs)}%` }} />
                </div>
              </div>

              {/* Other & Metadata */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-neutral-400 shrink-0" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Thumbnails & Database Metadata
                    </span>
                  </div>
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">
                    {formatBytes(stats.otherBytes)}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-neutral-400 h-full rounded-full" style={{ width: `${Math.max(1, pOther)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Total Family Vault Size</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-sm">
              {formatBytes(stats.usedBytes)} / {formatBytes(stats.totalBytes, 0)}
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isSwitchModalOpen}
        title="Switch to a different Google account?"
        message="New uploads will go to the new account's Drive. Files already uploaded stay in the old account's Drive and will not open in FamilyVault unless you reconnect that account."
        confirmLabel="Choose account"
        onConfirm={handleConnect}
        onCancel={() => setIsSwitchModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        title="Disconnect Google Drive?"
        message="Disconnecting Google Drive will pause automatic synchronization for all family members until the account owner reconnects."
        confirmLabel="Disconnect"
        isDestructive
        onConfirm={handleDisconnect}
        onCancel={() => setIsDisconnectModalOpen(false)}
      />
    </div>
  );
};
