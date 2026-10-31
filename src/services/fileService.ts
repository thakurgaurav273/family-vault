import { FamilyFile, FileType } from '../types';

export interface FileFilter {
  type?: FileType;
  category?: string;
  folderId?: string | null;
  search?: string;
  uploaderId?: string;
  isFavorite?: boolean;
  sortBy?: 'newest' | 'oldest' | 'name' | 'size';
}

export interface IFileService {
  getFiles(filter?: FileFilter): Promise<FamilyFile[]>;
  getFileById(id: string): Promise<FamilyFile | null>;
  uploadFile(file: Omit<FamilyFile, 'id' | 'uploadedAt' | 'driveFileId'>): Promise<FamilyFile>;
  deleteFile(id: string): Promise<void>;
  batchDelete(ids: string[]): Promise<void>;
  toggleFavorite(id: string): Promise<FamilyFile>;
  moveFilesToFolder(fileIds: string[], folderId: string | null): Promise<void>;
  renameFile(id: string, newName: string): Promise<FamilyFile>;
}

const STORAGE_KEY_FILES = 'familyvault_files_v1';

export class MockFileService implements IFileService {
  private getStoredFiles(): FamilyFile[] {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveFiles(files: FamilyFile[]): void {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
  }

  async getFiles(filter?: FileFilter): Promise<FamilyFile[]> {
    let files = this.getStoredFiles();

    if (filter) {
      if (filter.type) {
        files = files.filter((f) => f.fileType === filter.type);
      }
      if (filter.category && filter.category !== 'all') {
        files = files.filter((f) => f.category === filter.category);
      }
      if (filter.folderId !== undefined) {
        if (filter.folderId === null) {
          files = files.filter((f) => !f.folderId);
        } else if (filter.folderId !== 'all') {
          files = files.filter((f) => f.folderId === filter.folderId);
        }
      }
      if (filter.uploaderId && filter.uploaderId !== 'all') {
        files = files.filter((f) => f.uploaderId === filter.uploaderId);
      }
      if (filter.isFavorite !== undefined) {
        files = files.filter((f) => f.isFavorite === filter.isFavorite);
      }
      if (filter.search && filter.search.trim() !== '') {
        const q = filter.search.toLowerCase().trim();
        files = files.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.uploaderName.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q) ||
            (f.tags && f.tags.some((t) => t.toLowerCase().includes(q))) ||
            (f.description && f.description.toLowerCase().includes(q))
        );
      }

      // Sort
      const sortBy = filter.sortBy || 'newest';
      files.sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'size') {
          return b.size - a.size;
        }
        return 0;
      });
    } else {
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }

    return files;
  }

  async getFileById(id: string): Promise<FamilyFile | null> {
    const files = this.getStoredFiles();
    return files.find((f) => f.id === id) || null;
  }

  async uploadFile(fileData: Omit<FamilyFile, 'id' | 'uploadedAt' | 'driveFileId'>): Promise<FamilyFile> {
    const files = this.getStoredFiles();
    const newFile: FamilyFile = {
      ...fileData,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      uploadedAt: new Date().toISOString(),
      driveFileId: `1DRV_${Math.random().toString(36).substring(2, 12)}`,
    };
    files.unshift(newFile);
    this.saveFiles(files);
    return newFile;
  }

  async deleteFile(id: string): Promise<void> {
    let files = this.getStoredFiles();
    files = files.filter((f) => f.id !== id);
    this.saveFiles(files);
  }

  async batchDelete(ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    let files = this.getStoredFiles();
    files = files.filter((f) => !idSet.has(f.id));
    this.saveFiles(files);
  }

  async toggleFavorite(id: string): Promise<FamilyFile> {
    const files = this.getStoredFiles();
    const file = files.find((f) => f.id === id);
    if (!file) throw new Error('File not found');
    file.isFavorite = !file.isFavorite;
    this.saveFiles(files);
    return file;
  }

  async moveFilesToFolder(fileIds: string[], folderId: string | null): Promise<void> {
    const idSet = new Set(fileIds);
    const files = this.getStoredFiles();
    files.forEach((f) => {
      if (idSet.has(f.id)) {
        f.folderId = folderId;
      }
    });
    this.saveFiles(files);
  }

  async renameFile(id: string, newName: string): Promise<FamilyFile> {
    const files = this.getStoredFiles();
    const file = files.find((f) => f.id === id);
    if (!file) throw new Error('File not found');
    file.name = newName;
    this.saveFiles(files);
    return file;
  }
}

export const fileService = new MockFileService();
