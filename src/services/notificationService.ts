import { NotificationItem } from '../types';

export interface INotificationService {
  getNotifications(): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<NotificationItem[]>;
  markAllAsRead(): Promise<NotificationItem[]>;
  addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): Promise<NotificationItem>;
}

const STORAGE_KEY_NOTIFICATIONS = 'familyvault_notifications_v1';

export class MockNotificationService implements INotificationService {
  private getStored(): NotificationItem[] {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private save(items: NotificationItem[]): void {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(items));
  }

  async getNotifications(): Promise<NotificationItem[]> {
    return this.getStored();
  }

  async markAsRead(id: string): Promise<NotificationItem[]> {
    const items = this.getStored();
    const found = items.find((i) => i.id === id);
    if (found) {
      found.isRead = true;
      this.save(items);
    }
    return items;
  }

  async markAllAsRead(): Promise<NotificationItem[]> {
    const items = this.getStored();
    items.forEach((i) => (i.isRead = true));
    this.save(items);
    return items;
  }

  async addNotification(
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>
  ): Promise<NotificationItem> {
    const items = this.getStored();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    items.unshift(newItem);
    this.save(items);
    return newItem;
  }
}

export const notificationService = new MockNotificationService();
