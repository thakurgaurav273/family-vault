import { FamilyFolder } from '../types';

export interface IFolderService {
  getFolders(): Promise<FamilyFolder[]>;
  getFolderById(id: string): Promise<FamilyFolder | null>;
  createFolder(
    name: string,
    description?: string,
    color?: string,
    createdBy?: { id: string; name: string }
  ): Promise<FamilyFolder>;
  renameFolder(id: string, name: string): Promise<FamilyFolder>;
  deleteFolder(id: string): Promise<void>;
}

const STORAGE_KEY_FOLDERS = 'familyvault_folders_v1';

export class MockFolderService implements IFolderService {
  private getStoredFolders(): FamilyFolder[] {
    const raw = localStorage.getItem(STORAGE_KEY_FOLDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveFolders(folders: FamilyFolder[]): void {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }

  async getFolders(): Promise<FamilyFolder[]> {
    return this.getStoredFolders();
  }

  async getFolderById(id: string): Promise<FamilyFolder | null> {
    const folders = this.getStoredFolders();
    return folders.find((f) => f.id === id) || null;
  }

  async createFolder(
    name: string,
    description?: string,
    color?: string,
    createdBy?: { id: string; name: string }
  ): Promise<FamilyFolder> {
    const folders = this.getStoredFolders();
    const newFolder: FamilyFolder = {
      id: `folder-${Date.now()}`,
      name,
      description: description || '',
      color: color || '#3b82f6',
      createdBy: createdBy?.id || 'user-1',
      createdByName: createdBy?.name || 'Family',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileCount: 0,
      totalSize: 0,
    };
    folders.push(newFolder);
    this.saveFolders(folders);
    // Make sure the server knows the folder before anything (e.g. an upload) refers to it.
    await fetch(`/api/state/${STORAGE_KEY_FOLDERS}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: folders }),
    }).catch(() => {});
    return newFolder;
  }

  async renameFolder(id: string, name: string): Promise<FamilyFolder> {
    const folders = this.getStoredFolders();
    const target = folders.find((f) => f.id === id);
    if (!target) throw new Error('Folder not found');
    target.name = name;
    target.updatedAt = new Date().toISOString();
    this.saveFolders(folders);
    return target;
  }

  async deleteFolder(id: string): Promise<void> {
    let folders = this.getStoredFolders();
    folders = folders.filter((f) => f.id !== id);
    this.saveFolders(folders);
  }
}

export const folderService = new MockFolderService();
