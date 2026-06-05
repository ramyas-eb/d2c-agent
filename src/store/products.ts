'use client';
import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  inStock: boolean;
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
    description: 'Pure silk, hand-embroidered with zari motifs. Available in emerald green, midnight blue, and rose gold.',
    inStock: true,
  },
  {
    id: 'P002',
    name: 'Banarasi Dupatta Set',
    sku: 'EKJ-BD-002',
    price: 12000,
    description: 'Authentic Banarasi weave dupatta paired with a lehenga. Traditional brocade patterns.',
    inStock: true,
  },
  {
    id: 'P003',
    name: 'Chanderi Cotton Saree',
    sku: 'EKJ-CS-003',
    price: 2200,
    description: 'Lightweight Chanderi cotton, perfect for daily wear. Block-print borders in earthy tones.',
    inStock: true,
  },
  {
    id: 'P004',
    name: 'Lehenga Choli',
    sku: 'EKJ-LC-004',
    price: 8500,
    description: 'Bridal and festive lehenga choli with heavy embroidery. Custom sizing available on request.',
    inStock: true,
  },
  {
    id: 'P005',
    name: 'Custom Kurta',
    sku: 'EKJ-CK-005',
    price: 1550,
    description: 'Made-to-order kurta in cotton or linen. Choose from 12 fabric swatches. Bulk pricing available.',
    inStock: true,
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
