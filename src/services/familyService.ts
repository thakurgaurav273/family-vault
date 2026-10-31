import { FamilyWorkspace, User, UserRole } from '../types';

// Placeholder shown only until the server's workspace loads (e.g. on the sign-in page). Never persisted.
const EMPTY_WORKSPACE: FamilyWorkspace = {
  id: '',
  name: 'FamilyVault',
  tagline: 'Every memory. Every document. One family home.',
  description: '',
  avatar: '',
  createdAt: '',
  ownerId: '',
  ownerName: '',
  preferences: {
    defaultVisibility: 'family',
    uploadPermissions: 'all',
    fileDeletionPermissions: 'owner_admin',
    invitePermissions: 'admins',
    language: 'English (US)',
    timezone: 'UTC',
  },
};

export interface IFamilyService {
  getWorkspace(): Promise<FamilyWorkspace>;
  updateWorkspace(updates: Partial<FamilyWorkspace>): Promise<FamilyWorkspace>;
  getMembers(): Promise<User[]>;
  inviteMember(email: string, role: UserRole, relationship?: string): Promise<User>;
  resendInvite(memberId: string): Promise<void>;
  revokeInvite(memberId: string): Promise<void>;
  removeMember(memberId: string): Promise<void>;
  changeRole(memberId: string, newRole: UserRole): Promise<User>;
}

const STORAGE_KEY_WORKSPACE = 'familyvault_workspace_v1';
const STORAGE_KEY_MEMBERS = 'familyvault_members_v1';

export class MockFamilyService implements IFamilyService {
  async getWorkspace(): Promise<FamilyWorkspace> {
    const raw = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return EMPTY_WORKSPACE;
  }

  async updateWorkspace(updates: Partial<FamilyWorkspace>): Promise<FamilyWorkspace> {
    const current = await this.getWorkspace();
    const updated = {
      ...current,
      ...updates,
      preferences: {
        ...current.preferences,
        ...(updates.preferences || {}),
      },
    };
    localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(updated));
    return updated;
  }

  async getMembers(): Promise<User[]> {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify([]));
    return [];
  }

  private saveMembers(members: User[]): void {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }

  async inviteMember(email: string, role: UserRole, relationship?: string): Promise<User> {
    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role, relationship }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to invite member');
    if (!data.emailed) await this.shareLink(data.inviteUrl);
    return data.member;
  }

  // Fallback when Resend isn't configured or sending failed: hand the link to the owner.
  private async shareLink(url: string) {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    window.prompt('Invitation link (copied) - send it to your family member:', url);
  }

  async resendInvite(memberId: string): Promise<void> {
    const res = await fetch(`/api/invites/${memberId}/resend`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to resend invite');
    if (!data.emailed) await this.shareLink(data.inviteUrl);
  }

  async revokeInvite(memberId: string): Promise<void> {
    let members = await this.getMembers();
    members = members.filter((m) => m.id !== memberId);
    this.saveMembers(members);
  }

  async removeMember(memberId: string): Promise<void> {
    let members = await this.getMembers();
    const member = members.find((m) => m.id === memberId);
    if (member?.role === 'owner') {
      throw new Error('Cannot remove primary family owner');
    }
    members = members.filter((m) => m.id !== memberId);
    this.saveMembers(members);
  }

  async changeRole(memberId: string, newRole: UserRole): Promise<User> {
    const members = await this.getMembers();
    const target = members.find((m) => m.id === memberId);
    if (!target) throw new Error('Member not found');
    if (target.role === 'owner' && newRole !== 'owner') {
      throw new Error('The primary family owner role cannot be demoted directly.');
    }
    target.role = newRole;
    this.saveMembers(members);
    return target;
  }
}

export const familyService = new MockFamilyService();
