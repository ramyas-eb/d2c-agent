import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentFaq {
  id: string;
  q: string;
  a: string;
}

export interface AgentSettings {
  shopName: string;
  tone: string;
  returnPolicy: string;
  shippingDays: string;
  codAvailable: boolean;
  discount: string;
  faqs: AgentFaq[];
}

interface AgentSettingsStore {
  settings: AgentSettings;
  updateSettings: (partial: Partial<AgentSettings>) => void;
  addFaq: (faq: { q: string; a: string }) => void;
  removeFaq: (id: string) => void;
}

const defaultSettings: AgentSettings = {
  shopName: '',
  tone: 'warm, friendly, and helpful',
  returnPolicy: '',
  shippingDays: '3–5',
  codAvailable: false,
  discount: '',
  faqs: [],
};

export const useAgentSettingsStore = create<AgentSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      addFaq: ({ q, a }) =>
        set((state) => ({
          settings: {
            ...state.settings,
            faqs: [
              ...state.settings.faqs,
              { id: `faq-${Date.now()}-${Math.random().toString(36).slice(2)}`, q, a },
            ],
          },
        })),
      removeFaq: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            faqs: state.settings.faqs.filter((f) => f.id !== id),
          },
        })),
    }),
    { name: 'agent-settings' }
  )
);
