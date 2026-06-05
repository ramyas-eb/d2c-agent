'use client';
import { create } from 'zustand';

export type NotifType = 'payment' | 'shipment' | 'message' | 'alert' | 'balance';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  orderId?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const now = Date.now();
const SEED: AppNotification[] = [
  { id: 'n1', type: 'payment', title: 'Payment received', body: 'Priya Sharma paid ₹4,800 for Hand-embroidered Silk Saree', time: new Date(now - 10 * 60000).toISOString(), read: false },
  { id: 'n2', type: 'shipment', title: 'Order shipped', body: 'AWB SR1234567890 assigned via Delhivery · Anita Verma', time: new Date(now - 22 * 60000).toISOString(), read: false },
  { id: 'n3', type: 'payment', title: 'Payment received', body: 'Kavya Reddy paid ₹2,500 for Chanderi Cotton Kurta', time: new Date(now - 60 * 60000).toISOString(), read: false },
  { id: 'n4', type: 'balance', title: 'Balance due reminder sent', body: 'WhatsApp reminder sent to Meera Patel · ₹3,200 due in 2 days', time: new Date(now - 2 * 60 * 60000).toISOString(), read: true },
  { id: 'n5', type: 'message', title: 'New DM from customer', body: 'Supriya Nair: "Can I get a discount on the saree?"', time: new Date(now - 3 * 60 * 60000).toISOString(), read: true },
  { id: 'n6', type: 'alert', title: 'Payment link expired', body: "Deepa Krishnan's payment link expired without payment", time: new Date(now - 4 * 60 * 60000).toISOString(), read: true },
  { id: 'n7', type: 'shipment', title: 'Order delivered', body: "Lakshmi Iyer's order delivered · Delhivery confirmed", time: new Date(now - 5 * 60 * 60000).toISOString(), read: true },
];

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: SEED,
  addNotification: (n) => set((s) => ({
    notifications: [{ ...n, id: `notif-${Date.now()}`, read: false }, ...s.notifications],
  })),
  markRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
  })),
}));
