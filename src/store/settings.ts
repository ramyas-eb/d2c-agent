'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShopSettings {
  shopName: string;
  tagline: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  razorpayMode: 'test' | 'live';
  summaryEmail: string;
  summaryEnabled: boolean;
}

interface SettingsStore extends ShopSettings {
  update: (patch: Partial<ShopSettings>) => void;
  reset: () => void;
}

const DEFAULTS: ShopSettings = {
  shopName: 'Shop Ekaja',
  tagline: 'Handcrafted Indian ethnic wear',
  ownerName: 'Ekaja Founder',
  email: 'support@shopekaja.in',
  phone: '+91 98765 43210',
  address: 'Delhi NCR, India',
  gstNumber: '27AABCU9603R1ZX',
  razorpayMode: 'test',
  summaryEmail: '',
  summaryEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set(DEFAULTS),
    }),
    { name: 'shop-settings' }
  )
);
