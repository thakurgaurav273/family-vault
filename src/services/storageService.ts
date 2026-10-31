import { DriveConnection } from '../types';
import { googleDriveService } from './googleDriveService';
import { fileService } from './fileService';

export interface StorageStats {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usedPercentage: number;
  photosBytes: number;
  videosBytes: number;
  documentsBytes: number;
  otherBytes: number;
  totalPhotosCount: number;
  totalVideosCount: number;
  totalDocumentsCount: number;
  connection: DriveConnection;
}

export interface IStorageService {
  getStorageStats(): Promise<StorageStats>;
}

export class MockStorageService implements IStorageService {
  async getStorageStats(): Promise<StorageStats> {
    const connection = await googleDriveService.getConnection();
    const files = await fileService.getFiles();

    let photosCount = 0;
    let videosCount = 0;
    let documentsCount = 0;

    files.forEach((f) => {
      if (f.fileType === 'photo') {
        photosCount++;
      } else if (f.fileType === 'video') {
        videosCount++;
      } else {
        documentsCount++;
      }
    });

    // Quota comes from the real Drive account; the breakdown is the FamilyVault files on the server.
    const bd = connection.breakdown;
    const totalBytes = connection.storageTotalBytes;
    const totalUsed = connection.storageUsedBytes;
    const percentage = totalBytes ? Math.min(100, Math.round((totalUsed / totalBytes) * 1000) / 10) : 0;

    return {
      totalBytes,
      usedBytes: totalUsed,
      availableBytes: Math.max(0, totalBytes - totalUsed),
      usedPercentage: percentage,
      photosBytes: bd.photos,
      videosBytes: bd.videos,
      documentsBytes: bd.documents,
      otherBytes: bd.other,
      totalPhotosCount: photosCount,
      totalVideosCount: videosCount,
      totalDocumentsCount: documentsCount,
      connection,
    };
  }
}

export const storageService = new MockStorageService();
