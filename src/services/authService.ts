import { User } from '../types';

export interface IAuthService {
  getCurrentUser(): User;
  setCurrentUser(user: User): void;
  getAllMembers(): User[];
  login(email: string, password?: string): Promise<User>;
  register(name: string, email: string, password?: string, familyName?: string): Promise<User>;
  acceptInvitation(inviteToken: string, name: string, password?: string): Promise<User>;
  updateProfile(userId: string, updates: Partial<User>): Promise<User>;
}

const STORAGE_KEY_CURRENT_USER = 'familyvault_current_user_v1';
const STORAGE_KEY_MEMBERS = 'familyvault_members_v1';

export class MockAuthService implements IAuthService {
  private getStoredMembers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveMembers(members: User[]): void {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }

  getCurrentUser(): User {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    const members = this.getStoredMembers();
    const owner = members.find((m) => m.role === 'owner') || members[0];
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(owner));
    return owner;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  }

  getAllMembers(): User[] {
    return this.getStoredMembers();
  }

  private async call(url: string, body: unknown): Promise<User> {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    this.setCurrentUser(data);
    return data;
  }

  login(email: string, password = ''): Promise<User> {
    return this.call('/api/auth/login', { email, password });
  }

  register(name: string, email: string, password = '', familyName?: string): Promise<User> {
    return this.call('/api/auth/register', { name, email, password, familyName });
  }

  acceptInvitation(token: string, name: string, password = ''): Promise<User> {
    return this.call('/api/auth/accept-invite', { token, name, password });
  }

  async forgot(email: string): Promise<void> {
    await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  }

  async lookup(kind: 'invite' | 'reset', token: string): Promise<{ kind: 'pin' | 'password'; email: string }> {
    const res = await fetch(`/api/auth/${kind}/${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'This link is invalid or has expired.');
    return data;
  }

  reset(token: string, secret: string): Promise<User> {
    return this.call('/api/auth/reset', { token, secret });
  }

  async changeSecret(current: string, next: string): Promise<void> {
    const res = await fetch('/api/auth/change-secret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current, next }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not change it');
  }

  async sendResetLink(memberId: string): Promise<{ emailed: boolean; resetUrl?: string }> {
    const res = await fetch(`/api/members/${memberId}/reset-credentials`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not send reset link');
    return data;
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: updates.name, relationship: updates.relationship, phone: updates.phone, avatar: updates.avatar }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not update profile');
    if (this.getCurrentUser().id === userId) this.setCurrentUser(data);
    return data;
  }

  async logoutAll(): Promise<void> {
    await fetch('/api/auth/logout-all', { method: 'POST' });
    localStorage.clear();
  }
}

export const authService = new MockAuthService();
