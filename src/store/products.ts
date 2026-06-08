'use client';
import { create } from 'zustand';
import { ProductVariant } from '@/types';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  inStock: boolean;
  variants?: ProductVariant[];
}

interface ProductStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  toggleStock: (id: string) => void;
}

export const initialProducts: Product[] = [
  {
    id: 'P001',
    name: 'Hand-embroidered Silk Saree',
    sku: 'EKJ-SS-001',
    price: 4800,
    description: 'Pure silk, hand-embroidered with zari motifs.',
    inStock: true,
    variants: [
      { label: 'Colour', options: ['Emerald Green', 'Midnight Blue', 'Rose Gold'] },
      { label: 'Length', options: ['5.5m', '6m'] },
    ],
  },
  {
    id: 'P002',
    name: 'Banarasi Dupatta Set',
    sku: 'EKJ-BD-002',
    price: 12000,
    description: 'Authentic Banarasi weave dupatta paired with a lehenga. Traditional brocade patterns.',
    inStock: true,
    variants: [
      { label: 'Colour', options: ['Royal Blue', 'Maroon', 'Gold'] },
      { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
  {
    id: 'P003',
    name: 'Chanderi Cotton Saree',
    sku: 'EKJ-CS-003',
    price: 2200,
    description: 'Lightweight Chanderi cotton, perfect for daily wear. Block-print borders in earthy tones.',
    inStock: true,
    variants: [
      { label: 'Colour', options: ['Terracotta', 'Olive Green', 'Indigo Blue'] },
      { label: 'Length', options: ['5.5m', '6m'] },
    ],
  },
  {
    id: 'P004',
    name: 'Lehenga Choli',
    sku: 'EKJ-LC-004',
    price: 8500,
    description: 'Bridal and festive lehenga choli with heavy embroidery.',
    inStock: true,
    variants: [
      { label: 'Colour', options: ['Coral Pink', 'Deep Maroon', 'Teal Blue'] },
      { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
  {
    id: 'P005',
    name: 'Custom Kurta',
    sku: 'EKJ-CK-005',
    price: 1550,
    description: 'Made-to-order kurta in cotton or linen. Bulk pricing available.',
    inStock: true,
    variants: [
      { label: 'Fabric', options: ['Cotton', 'Linen', 'Silk Blend'] },
      { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
];

export const useProductStore = create<ProductStore>((set) => ({
  products: initialProducts,

  addProduct: (product) => {
    const id = `P${Date.now()}`;
    set((state) => ({
      products: [...state.products, { id, ...product }],
    }));
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  toggleStock: (id) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, inStock: !p.inStock } : p,
      ),
    }));
  },
}));
