import { DriveConnection } from '../types';

export const DISCONNECTED_DRIVE: DriveConnection = {
  isConnected: false, accountEmail: '', accountName: '', lastSyncedAt: '',
  storageUsedBytes: 0, storageTotalBytes: 0, status: 'disconnected',
  breakdown: { photos: 0, videos: 0, documents: 0, other: 0 },
};

export interface IGoogleDriveService {
  getConnection(): Promise<DriveConnection>;
  connectDrive(returnTo?: 'storage' | 'setup'): Promise<DriveConnection>;
  disconnectDrive(returnTo?: 'storage' | 'setup'): Promise<DriveConnection>;
  reconnectDrive(returnTo?: 'storage' | 'setup'): Promise<DriveConnection>;
  syncNow(): Promise<DriveConnection>;
}

export class MockGoogleDriveService implements IGoogleDriveService {
  async getConnection(): Promise<DriveConnection> {
    const res = await fetch('/api/drive/status');
    if (!res.ok) return DISCONNECTED_DRIVE;
    return { ...DISCONNECTED_DRIVE, ...(await res.json()) };
  }

  // Starts the Google OAuth consent flow (owner only); the server redirects back to /storage.
  async connectDrive(returnTo: 'storage' | 'setup' = 'storage'): Promise<DriveConnection> {
    window.location.assign(`/api/drive/connect?returnTo=${returnTo}`);
    return new Promise(() => {});
  }

  async reconnectDrive(): Promise<DriveConnection> {
    return this.connectDrive();
  }

  async disconnectDrive(): Promise<DriveConnection> {
    const res = await fetch('/api/drive/disconnect', { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Disconnect failed');
    return res.json();
  }

  async syncNow(): Promise<DriveConnection> {
    return this.getConnection();
  }
}

export const googleDriveService = new MockGoogleDriveService();
