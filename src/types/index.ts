export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  joinedAt: string;
  status: 'active' | 'pending';
  relationship?: string;
  phone?: string;
}

export type FileCategory =
  | 'personal'
  | 'education'
  | 'financial'
  | 'medical'
  | 'identity'
  | 'bills'
  | 'other';

export type FileType = 'photo' | 'video' | 'document';

export type FileVisibility = 'family' | 'admins' | 'private';

export interface FamilyFile {
  id: string;
  name: string;
  originalName: string;
  fileType: FileType;
  mimeType: string;
  extension: string;
  size: number; // in bytes
  url: string;
  thumbnailUrl: string;
  previewUrl?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  uploadedAt: string;
  takenAt?: string;
  category: FileCategory;
  folderId?: string | null;
  visibility: FileVisibility;
  isFavorite: boolean;
  duration?: string; // e.g. "02:45" for video
  dimensions?: { width: number; height: number };
  tags?: string[];
  description?: string;
  driveFileId: string;
}

export interface FamilyFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  totalSize: number;
  isSystem?: boolean;
}

export interface DriveConnection {
  isConnected: boolean;
  accountEmail: string;
  accountName: string;
  accountAvatar?: string;
  lastSyncedAt: string;
  storageUsedBytes: number;
  storageTotalBytes: number; // e.g. 100 GB or 2 TB Google Drive plan
  status: 'healthy' | 'syncing' | 'warning' | 'disconnected';
  breakdown: {
    photos: number;
    videos: number;
    documents: number;
    other: number;
  };
}

export interface FamilyWorkspace {
  setupComplete?: boolean;
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  preferences: {
    defaultVisibility: FileVisibility;
    uploadPermissions: 'all' | 'admins';
    fileDeletionPermissions: 'owner_admin' | 'uploader_only';
    invitePermissions: 'admins' | 'all';
    language: string;
    timezone: string;
  };
}

export interface ActivityLog {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  action: 'upload' | 'delete' | 'favorite' | 'create_folder' | 'invite' | 'drive_sync';
  targetName: string;
  targetType: 'file' | 'folder' | 'member' | 'system';
  targetId?: string;
  timestamp: string;
  fileType?: FileType;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'upload' | 'invite' | 'drive' | 'storage' | 'system';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface UploadQueueItem {
  id: string;
  file: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  };
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error' | 'cancelled';
  category: FileCategory;
  folderId: string | null;
  visibility: FileVisibility;
  error?: string;
  previewUrl?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
