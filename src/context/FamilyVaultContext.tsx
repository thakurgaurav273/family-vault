import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  FamilyWorkspace,
  FamilyFile,
  FamilyFolder,
  DriveConnection,
  NotificationItem,
  ThemeMode,
  FileCategory,
  FileVisibility,
} from '../types';
import {
  authService,
  familyService,
  fileService,
  folderService,
  googleDriveService,
  DISCONNECTED_DRIVE,
  notificationService,
} from '../services';

interface Toast {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface FamilyVaultContextType {
  currentUser: User;
  switchUser: (user: User) => void;
  members: User[];
  workspace: FamilyWorkspace;
  updateWorkspace: (updates: Partial<FamilyWorkspace>) => Promise<void>;
  driveConnection: DriveConnection;
  files: FamilyFile[];
  folders: FamilyFolder[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  targetUploadFolderId: string | null;
  setTargetUploadFolderId: (id: string | null) => void;
  previewFile: FamilyFile | null;
  setPreviewFile: (file: FamilyFile | null) => void;
  refreshData: () => Promise<void>;
  toggleFavorite: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  batchDeleteFiles: (fileIds: string[]) => Promise<void>;
  moveFilesToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  syncDriveNow: () => Promise<void>;
  simulateUpload: (
    files: Array<{ name: string; size: number; type: string; dataUrl?: string; file?: File }>,
    category: FileCategory,
    folderId: string | null,
    visibility: FileVisibility
  ) => Promise<void>;
  toast: Toast | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const FamilyVaultContext = createContext<FamilyVaultContextType | undefined>(undefined);

export const FamilyVaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => authService.getCurrentUser());
  const [members, setMembers] = useState<User[]>([]);
  const [workspace, setWorkspace] = useState<FamilyWorkspace>(() => ({
    id: 'workspace-singh',
    name: 'Singh Family',
    tagline: 'Every memory. Every document. One family home.',
    description: 'Our private family sanctuary for preserving timeless memories and vital documents.',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date().toISOString(),
    ownerId: 'user-1',
    ownerName: 'Gaurav Singh',
    preferences: {
      defaultVisibility: 'family',
      uploadPermissions: 'all',
      fileDeletionPermissions: 'owner_admin',
      invitePermissions: 'admins',
      language: 'English (US)',
      timezone: 'Asia/Kolkata (IST)',
    },
  }));
  const [driveConnection, setDriveConnection] = useState<DriveConnection>(DISCONNECTED_DRIVE);
  const [files, setFiles] = useState<FamilyFile[]>([]);
  const [folders, setFolders] = useState<FamilyFolder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('familyvault_theme');
    return (saved as ThemeMode) || 'light';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetUploadFolderId, setTargetUploadFolderId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FamilyFile | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Sync theme with HTML root class
  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('familyvault_theme', mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [allFiles, allFolders, allMembers, curWorkspace, driveConn, notifs] = await Promise.all([
        fileService.getFiles(),
        folderService.getFolders(),
        familyService.getMembers(),
        familyService.getWorkspace(),
        googleDriveService.getConnection(),
        notificationService.getNotifications(),
      ]);
      setFiles(allFiles);
      setFolders(allFolders);
      setMembers(allMembers);
      setWorkspace(curWorkspace);
      setDriveConnection(driveConn);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchUser = (user: User) => {
    authService.setCurrentUser(user);
    setCurrentUser(user);
    showToast(`Switched active profile to ${user.name} (${user.role.toUpperCase()})`, 'info');
  };

  const updateWorkspace = async (updates: Partial<FamilyWorkspace>) => {
    const updated = await familyService.updateWorkspace(updates);
    setWorkspace(updated);
    showToast('Family workspace settings updated', 'success');
  };

  const toggleFavorite = async (fileId: string) => {
    try {
      const updated = await fileService.toggleFavorite(fileId);
      setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));
      if (previewFile?.id === fileId) {
        setPreviewFile(updated);
      }
      showToast(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'info');
    } catch {
      showToast('Could not update favorite status', 'error');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const target = files.find((f) => f.id === fileId);
      await fileService.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (previewFile?.id === fileId) {
        setPreviewFile(null);
      }
      showToast(`Deleted "${target?.name || 'file'}"`, 'info');
    } catch {
      showToast('Error deleting file', 'error');
    }
  };

  const batchDeleteFiles = async (fileIds: string[]) => {
    try {
      await fileService.batchDelete(fileIds);
      const idSet = new Set(fileIds);
      setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
      showToast(`Deleted ${fileIds.length} files`, 'info');
    } catch {
      showToast('Error deleting selected files', 'error');
    }
  };

  const moveFilesToFolder = async (fileIds: string[], folderId: string | null) => {
    try {
      await fileService.moveFilesToFolder(fileIds, folderId);
      const folder = folders.find((f) => f.id === folderId);
      const folderName = folder ? folder.name : 'Root';
      await refreshData();
      showToast(`Moved ${fileIds.length} item(s) to ${folderName}`, 'success');
    } catch {
      showToast('Failed to move files', 'error');
    }
  };

  const syncDriveNow = async () => {
    try {
      const updated = await googleDriveService.syncNow();
      setDriveConnection(updated);
      showToast('Google Drive synced successfully', 'success');
      await notificationService.addNotification({
        title: 'Google Drive Synced',
        description: `Manual sync complete. All family files backed up to ${updated.accountEmail}.`,
        type: 'drive',
      });
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
    } catch {
      showToast('Sync failed', 'error');
    }
  };

  const simulateUpload = async (
    newFiles: Array<{ name: string; size: number; type: string; dataUrl?: string; file?: File }>,
    category: FileCategory,
    folderId: string | null,
    visibility: FileVisibility
  ) => {
    const form = new FormData();
    // Fields must precede files: the server picks the Drive parent folder when the first file starts streaming.
    form.append('category', category);
    form.append('folderId', folderId || '');
    form.append('visibility', visibility);
    newFiles.forEach((item) => item.file && form.append('files', item.file, item.name));
    const res = await fetch('/api/files/upload', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Upload failed', 'error');
      return;
    }
    const saved: FamilyFile[] = await res.json();
    localStorage.setItem('familyvault_files_v1', JSON.stringify([...saved, ...(await fileService.getFiles())]));

    await refreshData();
    showToast(`Successfully uploaded ${newFiles.length} file(s) to FamilyVault & Google Drive`, 'success');
    await notificationService.addNotification({
      title: `${currentUser.name} uploaded ${newFiles.length} item(s)`,
      description: `Uploaded to Google Drive vault in ${category}.`,
      type: 'upload',
    });
  };

  const markNotificationAsRead = async (id: string) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications([...updated]);
  };

  const markAllNotificationsAsRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications([...updated]);
    showToast('All notifications marked as read', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <FamilyVaultContext.Provider
      value={{
        currentUser,
        switchUser,
        members,
        workspace,
        updateWorkspace,
        driveConnection,
        files,
        folders,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        theme,
        setTheme,
        isSearchOpen,
        setIsSearchOpen,
        isUploadOpen,
        setIsUploadOpen,
        targetUploadFolderId,
        setTargetUploadFolderId,
        previewFile,
        setPreviewFile,
        refreshData,
        toggleFavorite,
        deleteFile,
        batchDeleteFiles,
        moveFilesToFolder,
        syncDriveNow,
        simulateUpload,
        toast,
        showToast,
      }}
    >
      {children}
    </FamilyVaultContext.Provider>
  );
};

export const useFamilyVault = (): FamilyVaultContextType => {
  const context = useContext(FamilyVaultContext);
  if (!context) {
    throw new Error('useFamilyVault must be used within a FamilyVaultProvider');
  }
  return context;
};
